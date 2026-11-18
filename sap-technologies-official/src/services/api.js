import authMethods from "./api/auth";
import adminMethods from "./api/admin";
import publicFormsMethods from "./api/publicForms";
import catalogMethods from "./api/catalog";
import awardsMethods from "./api/awards";
import galleryMethods from "./api/gallery";
import careersMethods from "./api/careers";
import commerceMethods from "./api/commerce";
import utilitiesMethods from "./api/utilities";
import { API_PROXY_ENABLED, DIRECT_API_URL } from "../config/apiOrigin";
import { mapBackendUrls } from "../utils/publicBackendUrl";
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0');
const DEFAULT_API_URL = "https://api.saptechug.com";
const DEFAULT_API_FALLBACK_URL = "https://sap-technologies-ug.onrender.com";
const RETRYABLE_API_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504, 521, 522, 523, 524]);
const API_FALLBACK_ENABLED = String(import.meta.env.VITE_ENABLE_API_FALLBACK ?? "true").toLowerCase() !== "false";
const FALLBACK_MUTATIONS = String(import.meta.env.VITE_API_FALLBACK_MUTATIONS ?? "true").toLowerCase() !== "false";
const SAFE_READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const normalizeApiUrl = url => {
  const cleaned = String(url || "").trim();
  if (!cleaned) return "";
  return cleaned.replace(/\/+$/, "");
};
const splitApiUrls = value => String(value || "").split(",").map(normalizeApiUrl).filter(Boolean);
const isBrowserSafeApiUrl = url => {
  if (!url) return true;
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (!isHttpsPage) return true;

  // Browsers block HTTPS pages from calling HTTP APIs. Drop insecure API URLs
  // before the browser turns them into a generic "Failed to fetch".
  return !url.toLowerCase().startsWith("http://");
};
const uniqueApiUrls = (urls, {
  allowEmpty = false
} = {}) => {
  const seen = new Set();
  return urls.map(normalizeApiUrl).filter(url => {
    if (!url && !allowEmpty) return false;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};
const getApiUrls = () => {
  if (API_PROXY_ENABLED) return [""];
  const isLocalDevelopment = isLocalhost && import.meta.env.DEV;
  const configuredPrimaryUrl = import.meta.env.VITE_API_PRIMARY_URL || import.meta.env.VITE_API_URL;
  const primaryUrl = configuredPrimaryUrl || (isLocalDevelopment ? "" : DEFAULT_API_URL);
  const configuredUrls = API_FALLBACK_ENABLED ? splitApiUrls(import.meta.env.VITE_API_URLS) : [];
  const fallbackUrl = API_FALLBACK_ENABLED ? import.meta.env.VITE_API_FALLBACK_URL || (isLocalDevelopment ? "" : DEFAULT_API_FALLBACK_URL) : "";
  if (isLocalDevelopment) {
    const localUrls = uniqueApiUrls([primaryUrl, ...configuredUrls, fallbackUrl], {
      allowEmpty: true
    });
    return localUrls.length ? localUrls : [""];
  }
  const configuredProductionUrls = uniqueApiUrls([primaryUrl, ...configuredUrls, fallbackUrl]).filter(isBrowserSafeApiUrl);
  return configuredProductionUrls.length ? configuredProductionUrls : [DEFAULT_API_URL];
};
const API_BASE_URLS = getApiUrls();
const API_BASE_URL = API_BASE_URLS[0] || "";
class ApiService {
  constructor() {
    this.baseURLs = API_BASE_URLS;
    this.baseURL = API_BASE_URL;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.authToken = this.getStoredAuthToken();
    this.authStatusPromise = null;
    this.authStatusCache = null;
    this.authStatusCacheTimeout = 60 * 1000; // Avoid repeated anonymous /account checks

    if (import.meta.env.DEV) {
      console.log('API Configuration:', {
        baseURL: this.baseURL,
        baseURLs: this.baseURLs,
        fallbackEnabled: API_FALLBACK_ENABLED,
        fallbackURL: API_FALLBACK_ENABLED ? import.meta.env.VITE_API_FALLBACK_URL || DEFAULT_API_FALLBACK_URL : "",
        fallbackMutations: FALLBACK_MUTATIONS,
        isLocalhost,
        env: import.meta.env.MODE,
        envApiUrl: import.meta.env.VITE_API_URL,
        envPrimaryApiUrl: import.meta.env.VITE_API_PRIMARY_URL,
        envApiUrls: import.meta.env.VITE_API_URLS
      });
    }
  }
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  cloneData(data) {
    try {
      if (typeof structuredClone === 'function') {
        return structuredClone(data);
      }
    } catch {
      // structuredClone may not exist in all environments
    }
    return JSON.parse(JSON.stringify(data));
  }
  getRequestBaseURLs(method, options = {}) {
    const fallbackEnabled = options.useApiFallback !== false;
    if (!fallbackEnabled || this.baseURLs.length <= 1) {
      return [this.baseURL];
    }
    return this.baseURLs;
  }
  canFallbackAfterHttpError(method, options = {}) {
    const normalizedMethod = String(method || "GET").toUpperCase();
    const isSafeRead = SAFE_READ_METHODS.has(normalizedMethod);
    const allowMutationFallback = FALLBACK_MUTATIONS || options.allowFallbackForMutation === true;
    return isSafeRead || allowMutationFallback;
  }
  isRetryableStatus(status) {
    return RETRYABLE_API_STATUSES.has(Number(status));
  }
  isRetryableApiError(error) {
    return Boolean(error?.isNetworkError || this.isRetryableStatus(error?.response?.status));
  }
  getStoredAuthToken() {
    try {
      return localStorage.getItem("sap_access_token") || "";
    } catch {
      return "";
    }
  }
  setAuthToken(token) {
    this.authToken = token || "";
    this.clearAuthStatusCache();
    try {
      if (this.authToken) {
        localStorage.setItem("sap_access_token", this.authToken);
      } else {
        localStorage.removeItem("sap_access_token");
      }
    } catch {
      // localStorage can be unavailable in private contexts; cookies still work.
    }
  }

  // Wake up the server (for free tier on Render)
  async wakeUpServer() {
    await Promise.allSettled(this.baseURLs.map(async baseURL => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        if (import.meta.env.DEV) console.log('Waking up server...', baseURL || 'local proxy');
        const response = await fetch(`${baseURL}/api/health`, {
          method: 'GET',
          signal: controller.signal,
          // Don't wait for the response
          priority: 'low'
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          if (import.meta.env.DEV) console.log('Server is awake:', baseURL || 'local proxy');
        }
      } catch {
        // Silently fail - this is just a wake-up call
        if (import.meta.env.DEV) console.log('Server wake-up initiated (may take 30-60 seconds on first load)', baseURL || 'local proxy');
      }
    }));
  }
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  clearAuthStatusCache() {
    this.authStatusPromise = null;
    this.authStatusCache = null;
  }
  getCachedAuthStatus() {
    if (!this.authStatusCache) return null;
    const now = Date.now();
    const maxAge = this.authStatusCache.isAuthenticated ? this.cacheTimeout : this.authStatusCacheTimeout;
    if (now - this.authStatusCache.timestamp > maxAge) {
      this.authStatusCache = null;
      return null;
    }
    return {
      isAuthenticated: this.authStatusCache.isAuthenticated,
      user: this.authStatusCache.user
    };
  }
  setAuthStatusCache(status) {
    this.authStatusCache = {
      isAuthenticated: Boolean(status?.isAuthenticated),
      user: status?.user || null,
      timestamp: Date.now()
    };
  }
  async request(endpoint, options = {}) {
    // Ensure endpoint starts with /api unless it already does
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

    // Check cache for GET requests (unless explicitly disabled)
    const method = (options.method || "GET").toUpperCase();
    const useCache = options.useCache !== false && method === "GET";
    const requestBaseURLs = this.getRequestBaseURLs(method, options);

    // Set up headers - but be careful with file uploads!
    // FormData needs special handling (browser sets Content-Type automatically)
    const headers = {};
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Add visitor tracking headers
    const sessionId = sessionStorage.getItem("visitor_session_id");
    const fingerprint = sessionStorage.getItem("x-fingerprint");
    if (sessionId) {
      headers["X-Session-ID"] = sessionId;
    }
    if (fingerprint) {
      headers["X-Fingerprint"] = fingerprint;
    }
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Merge headers properly, avoiding issues with undefined
    const mergedHeaders = {
      ...headers,
      ...(options.headers || {})
    };
    const config = {
      method: method,
      headers: mergedHeaders,
      credentials: "include",
      // Super important! This sends cookies so server knows who we are
      // Avoid HTTP-level caching for GET requests so intermediaries and the browser
      // don't serve stale responses. Components should still rely on the in-memory
      // cache which we manage explicitly.
      ...(method === 'GET' ? {
        cache: options.cacheMode || 'no-store'
      } : {})
    };

    // Add body if present
    if (options.body) {
      config.body = options.body;
    }
    let lastError = null;
    for (let attempt = 0; attempt < requestBaseURLs.length; attempt += 1) {
      const baseURL = requestBaseURLs[attempt];
      const url = `${baseURL}${apiEndpoint}`;
      const cacheKey = `${method}:${url}`;
      const hasFallbackAttempt = attempt < requestBaseURLs.length - 1;
      if (useCache) {
        const cached = this.getCached(cacheKey);
        if (cached) {
          if (import.meta.env.DEV) console.log('Serving from cache:', cacheKey);
          // Return a deep clone to avoid same-reference state updates in React
          return this.cloneData(cached);
        }
      }
      try {
        // Actually make the request to our server
        const response = await fetch(url, config);

        // Try to figure out what kind of response we got back
        const contentType = response.headers.get("Content-Type");
        let data;
        try {
          // Most of our API returns JSON, but sometimes it's just text
          if (contentType && contentType.includes("application/json")) {
            data = await response.json();
          } else {
            data = await response.text();
          }
        } catch (parseError) {
          // Sometimes the server sends back weird responses we can't parse
          console.error("Failed to parse response:", parseError);
          console.error("Response status:", response.status);
          console.error("Response headers:", response.headers);
          // Create a fallback error message so the app doesn't crash
          data = {
            message: `Server error: ${response.status} ${response.statusText}`,
            status: response.status
          };
        }
        if (!response.ok) {
          // Handle authentication errors more gracefully
          if (response.status === 401) {
            this.setAuthToken("");
            throw new Error("Authentication required");
          }

          // Create enhanced error with response data
          const validationMessages = Array.isArray(data?.errors) ? data.errors.map(item => typeof item === "string" ? item : item.msg || item.message).filter(Boolean) : [];
          const error = new Error(validationMessages.length ? [...new Set(validationMessages)].join(". ") : data?.message || `HTTP error! status: ${response.status}`);
          error.response = {
            status: response.status,
            statusText: response.statusText,
            data: data
          };
          if (hasFallbackAttempt && this.canFallbackAfterHttpError(method, options) && this.isRetryableApiError(error)) {
            lastError = error;
            if (import.meta.env.DEV) {
              console.warn('Primary API failed, trying fallback:', {
                endpoint: apiEndpoint,
                method,
                status: response.status,
                failedUrl: url,
                nextBaseURL: requestBaseURLs[attempt + 1] || 'local proxy'
              });
            }
            continue;
          }
          throw error;
        }
        if (API_PROXY_ENABLED) data = mapBackendUrls(data, "", [DIRECT_API_URL]);

        // Only cache successful GET responses with valid data
        if (useCache && response.ok && data) {
          this.setCache(cacheKey, data);
        }

        // After any successful mutating request, clear the cache so
        // subsequent GETs fetch fresh data. This prevents the UI from
        // showing stale data that requires a manual page refresh.
        if (method !== 'GET' && response.ok) {
          try {
            this.clearCache();
            if (import.meta.env.DEV) console.log('API cache cleared after mutation:', method, url);
          } catch (e) {
            // Non-fatal - log in development
            if (import.meta.env.DEV) console.warn('Failed to clear API cache after mutation', e);
          }
        }
        return data;
      } catch (error) {
        if (!error.response && !error.message?.includes("Authentication required")) {
          error.isNetworkError = true;
        }
        if (hasFallbackAttempt && this.isRetryableApiError(error)) {
          lastError = error;
          if (import.meta.env.DEV) {
            console.warn('API request failed, trying fallback:', {
              endpoint: apiEndpoint,
              method,
              failedUrl: url,
              nextBaseURL: requestBaseURLs[attempt + 1] || 'local proxy',
              reason: error.message
            });
          }
          continue;
        }

        // Only log errors that aren"t authentication-related to reduce console noise
        if (!error.message.includes("Authentication required")) {
          console.error("API request failed:", error);
          console.error("Request details:", {
            endpoint,
            method,
            url
          });
        }
        throw error;
      }
    }
    throw lastError || new Error(`API request failed for ${apiEndpoint}`);
  }

  // Authentication methods - handle user login/logout/registration
  // These are the core methods that let users access their accounts

  // Password Reset Methods

  // Check authentication status without throwing errors for unauthenticated users

  // Admin endpoints

  // Contact form

  // Newsletter subscription

  // Health check

  // Services management

  // Projects management

  // Public API methods (no authentication required)

  // Alias for backward compatibility

  // Partner methods

  // Awards Admin methods

  // Gallery methods

  // Jobs methods

  // Products methods

  // Products Admin methods

  // Product Inquiry methods

  // Service Quote methods

  // User methods

  // Check if current user is admin

  // Generic HTTP methods

  // Certificate verification method (public endpoint)

  // Global search across products, services, projects
}
// Keep one service instance and the existing public method contract.
for (const methods of [authMethods, adminMethods, publicFormsMethods, catalogMethods, awardsMethods, galleryMethods, careersMethods, commerceMethods, utilitiesMethods]) {
  for (const [name, method] of Object.entries(methods)) {
    Object.defineProperty(ApiService.prototype, name, {
      value: method,
      writable: true,
      configurable: true
    });
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
export { apiService };
