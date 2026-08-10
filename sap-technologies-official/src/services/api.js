const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname === '0.0.0.0');

const getApiUrl = () => {
  if (isLocalhost && import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "";
  }
  return import.meta.env.VITE_API_URL || "https://sap-technologies-ug.onrender.com";
};

const API_BASE_URL = getApiUrl();

class ApiService {
  constructor() {
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
        isLocalhost,
        env: import.meta.env.MODE,
        envApiUrl: import.meta.env.VITE_API_URL
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

  getStoredAuthToken() {
    try {
      return localStorage.getItem("sap_access_token") || "";
    } catch (error) {
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
    } catch (error) {
      // localStorage can be unavailable in private contexts; cookies still work.
    }
  }

  // Wake up the server (for free tier on Render)
  async wakeUpServer() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      if (import.meta.env.DEV) console.log('Waking up server...');
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        // Don't wait for the response
        priority: 'low'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (import.meta.env.DEV) console.log('Server is awake');
      }
    } catch (error) {
      // Silently fail - this is just a wake-up call
      if (import.meta.env.DEV) console.log('Server wake-up initiated (may take 30-60 seconds on first load)');
    }
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
    const maxAge = this.authStatusCache.isAuthenticated
      ? this.cacheTimeout
      : this.authStatusCacheTimeout;

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
    const url = `${this.baseURL}${apiEndpoint}`;
    
    // Check cache for GET requests (unless explicitly disabled)
    const method = (options.method || "GET").toUpperCase();
    const cacheKey = `${method}:${url}`;
    const useCache = options.useCache !== false && method === "GET";
    
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        if (import.meta.env.DEV) console.log('Serving from cache:', cacheKey);
        // Return a deep clone to avoid same-reference state updates in React
        try {
          // Use structuredClone when available for performance
          if (typeof structuredClone === 'function') {
            return structuredClone(cached);
          }
        } catch (e) {
          // structuredClone may not exist in all environments
        }
        return JSON.parse(JSON.stringify(cached));
      }
    }
    
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
      credentials: "include", // Super important! This sends cookies so server knows who we are
      // Avoid HTTP-level caching for GET requests so intermediaries and the browser
      // don't serve stale responses. Components should still rely on the in-memory
      // cache which we manage explicitly.
      ...(method === 'GET' ? { cache: options.cacheMode || 'no-store' } : {}),
    };
    
    // Add body if present
    if (options.body) {
      config.body = options.body;
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
        const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: data
        };
        throw error;
      }

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
      // Only log errors that aren"t authentication-related to reduce console noise
      if (!error.message.includes("Authentication required")) {
        console.error("API request failed:", error);
        console.error("Request details:", { endpoint, method, url });
      }
      throw error;
    }
  }

  // Authentication methods - handle user login/logout/registration
  // These are the core methods that let users access their accounts
  
  async login(credentials) {
    // Send login request with email/password
    const response = await this.request("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    const token = response?.data?.accessToken;
    if (token) {
      this.setAuthToken(token);
    }

    return response;
  }

  async signup(userData) {
    // Create new user account with name, email, password, and optional phone
    const payload = {
      name: userData.name?.trim(),
      email: userData.email?.trim(),
      password: userData.password
    };

    const phone = userData.phone?.trim();
    if (phone) {
      payload.phone = phone;
    }

    const response = await this.request("/api/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const token = response?.data?.accessToken;
    if (token) {
      this.setAuthToken(token);
    }

    return response;
  }

  async logout() {
    try {
      return await this.request("/api/logout", {
        method: "POST",
      });
    } finally {
      this.setAuthToken("");
    }
  }

  // Password Reset Methods
  async requestPasswordReset(email) {
    // Request verification code for password reset
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetData) {
    // Reset password with verification code
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData),
    });
  }

  async resendResetCode(email) {
    // Resend verification code
    return this.request("/auth/resend-reset-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getAccount() {
    return this.request("/api/account");
  }

  // Check authentication status without throwing errors for unauthenticated users
  async checkAuthStatus(options = {}) {
    const force = Boolean(options.force);
    if (!force) {
      const cached = this.getCachedAuthStatus();
      if (cached) return cached;

      if (this.authStatusPromise) {
        return this.authStatusPromise;
      }
    }

    this.authStatusPromise = (async () => {
      try {
        const response = await this.request("/api/account", { useCache: false });
        const status = { isAuthenticated: true, user: response?.data?.user };
        this.setAuthStatusCache(status);
        return status;
      } catch (error) {
        if (error.message.includes("Authentication required")) {
          const status = { isAuthenticated: false, user: null };
          this.setAuthStatusCache(status);
          return status;
        }
        throw error;
      } finally {
        this.authStatusPromise = null;
      }
    })();

    return this.authStatusPromise;
  }

  async updateAccount(userData) {
    return this.request("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async updateEmail(email) {
    return this.request("/api/users/email", {
      method: "PUT",
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(passwordData) {
    return this.request("/api/users/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  async uploadProfilePic(file) {
    const formData = new FormData();
    formData.append("profilePic", file);
    
    return this.request("/api/users/profile-pic", {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async deleteAccount() {
    return this.request("/api/users/account", {
      method: "DELETE",
    });
  }

  async getUserActivity() {
    return this.request("/api/users/activity");
  }

  // Admin endpoints
  async getAdminDashboardStats() {
    return this.request("/api/admin/dashboard/stats", { useCache: false });
  }

  async getSystemHealth() {
    return this.request("/api/admin/system/health", { useCache: false });
  }

  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${query ? `?${query}` : ""}`, { useCache: false });
  }

  async updateUserRole(userId, role) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async deleteUserAdmin(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  async getAllContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/contacts${query ? `?${query}` : ""}`, { useCache: false });
  }

  async updateContactStatus(contactId, status) {
    return this.request(`/api/admin/contacts/${contactId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteContactAdmin(contactId) {
    return this.request(`/api/admin/contacts/${contactId}`, {
      method: "DELETE",
    });
  }

  async getAllNewsletterSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/newsletter/subscribers${query ? `?${query}` : ""}`, { useCache: false });
  }

  async deleteNewsletterSubscriber(subscriberId) {
    return this.request(`/api/admin/newsletter/subscribers/${subscriberId}`, {
      method: "DELETE",
    });
  }

  // Contact form
  async submitContact(contactData) {
    return this.request("/api/contact", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
  }

  // Newsletter subscription
  async subscribeNewsletter(email) {
    return this.request("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request("/api/health");
  }

  // Services management
  async getAllServices(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/services?${queryParams}`, { useCache: false });
  }

  async getServiceById(serviceId) {
    return this.request(`/api/admin/services/${serviceId}`, { useCache: false });
  }

  async createService(serviceData) {
    const config = {
      method: "POST",
    };
    
    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    const result = await this.request("/api/admin/services", config);
    // Clear services cache after mutation
    this.clearCache();
    return result;
  }

  async updateService(serviceId, serviceData) {
    const config = {
      method: "PUT",
    };
    
    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    const result = await this.request(`/api/admin/services/${serviceId}`, config);
    // Clear services cache after mutation
    this.clearCache();
    return result;
  }

  async deleteService(serviceId) {
    const result = await this.request(`/api/admin/services/${serviceId}`, {
      method: "DELETE",
    });
    // Clear services cache after mutation
    this.clearCache();
    return result;
  }

  async toggleServiceFeatured(serviceId) {
    return this.request(`/api/admin/services/${serviceId}/featured`, {
      method: "PATCH",
    });
  }

  async getServiceCategories() {
    return this.request("/api/admin/services/categories");
  }

  async getServiceStats() {
    return this.request("/api/admin/services/stats", { useCache: false });
  }

  // Projects management
  async getAllProjects(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/projects?${queryParams}`, { useCache: false });
  }

  async getProjectById(projectId) {
    return this.request(`/api/admin/projects/${projectId}`, { useCache: false });
  }

  async createProject(projectData) {
    const config = {
      method: "POST",
    };
    
    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    const result = await this.request("/api/admin/projects", config);
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  }

  async updateProject(projectId, projectData) {
    const config = {
      method: "PUT",
    };
    
    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = { "Content-Type": "application/json" };
    }

    const result = await this.request(`/api/admin/projects/${projectId}`, config);
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  }  async deleteProject(projectId) {
    const result = await this.request(`/api/admin/projects/${projectId}`, {
      method: "DELETE",
    });
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  }

  async toggleProjectFeatured(projectId) {
    return this.request(`/api/admin/projects/${projectId}/featured`, {
      method: "PATCH",
    });
  }

  async getProjectStats() {
    return this.request("/api/admin/projects/stats", { useCache: false });
  }

  // Public API methods (no authentication required)
  async getPublicServices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/services${queryString ? `?${queryString}` : ""}`);
  }

  async getPublicProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/projects${queryString ? `?${queryString}` : ""}`, {
      method: "GET"
    });
  }

  async getPublicServiceById(serviceId) {
    return this.request(`/api/public/services/${serviceId}`);
  }

  async getPublicProjectById(projectId) {
    return this.request(`/api/public/projects/${projectId}`);
  }

  async getPublicServiceCategories() {
    return this.request("/api/public/services/categories");
  }

  async getPublicProjectCategories() {
    return this.request("/api/public/projects/categories");
  }

  // Alias for backward compatibility
  async getProjectCategories() {
    return this.getPublicProjectCategories();
  }

  async getServiceCategories() {
    return this.getPublicServiceCategories();
  }

  // Partner methods
  async getPartners() {
    return this.request("/api/partners/public");
  }

  async getAdminPartners(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/partners${query ? `?${query}` : ""}`, { useCache: false });
  }

  async deletePartner(partnerId) {
    return this.request(`/api/partners/${partnerId}`, {
      method: "DELETE"
    });
  }

  async getPartnershipRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/partnership-requests${query ? `?${query}` : ""}`, { useCache: false });
  }

  // Awards Admin methods
  async getAwardsCategories() {
    return this.request("/awards/categories", { useCache: false });
  }

  async createAwardsCategory(categoryData) {
    return this.request("/awards/admin/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async updateAwardsCategory(categoryId, categoryData) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteAwardsCategory(categoryId) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "DELETE"
    });
  }

  async getAdminNominations(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/awards/admin/nominations${queryParams ? `?${queryParams}` : ""}`, { useCache: false });
  }

  async updateNominationStatus(nominationId, status, adminNotes = "") {
    return this.request(`/awards/admin/nominations/${nominationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
      headers: { "Content-Type": "application/json" }
    });
  }

  async updateNomination(nominationId, formData) {
    return this.request(`/awards/admin/nominations/${nominationId}`, {
      method: "PUT",
      body: formData
    });
  }

  async deleteNomination(nominationId) {
    return this.request(`/awards/admin/nominations/${nominationId}`, {
      method: "DELETE"
    });
  }

  async getAwardsStats() {
    return this.request("/api/awards/admin/stats", { useCache: false });
  }

  async createAdminNomination(formData) {
    return this.request("/awards/nominations", {
      method: "POST",
      body: formData
    });
  }

  // Gallery methods
  async getPublicGallery() {
    return this.request("/api/gallery/public");
  }

  async getAdminGallery() {
    return this.request("/api/gallery", { useCache: false });
  }

  async createGalleryItem(formData) {
    return this.request("/api/gallery", {
      method: "POST",
      body: formData
    });
  }

  async updateGalleryItem(galleryId, formData) {
    return this.request(`/api/gallery/${galleryId}`, {
      method: "PUT",
      body: formData
    });
  }

  async deleteGalleryItem(galleryId) {
    return this.request(`/api/gallery/${galleryId}`, {
      method: "DELETE"
    });
  }

  // Jobs methods
  async getPublicJobs() {
    return this.request("/api/jobs/public");
  }

  async getJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, { useCache: false });
  }

  async getAdminJobs() {
    return this.request("/api/jobs", { useCache: false });
  }

  async createJob(jobData) {
    const config = {
      method: "POST"
    };

    if (jobData instanceof FormData) {
      config.body = jobData;
    } else {
      config.body = JSON.stringify(jobData);
      config.headers = { "Content-Type": "application/json" };
    }

    const result = await this.request("/api/jobs", config);
    this.clearCache();
    return result;
  }

  async updateJob(jobId, jobData) {
    const config = {
      method: "PUT"
    };

    if (jobData instanceof FormData) {
      config.body = jobData;
    } else {
      config.body = JSON.stringify(jobData);
      config.headers = { "Content-Type": "application/json" };
    }

    const result = await this.request(`/api/jobs/${jobId}`, config);
    this.clearCache();
    return result;
  }

  async deleteJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "DELETE"
    });
  }

  async applyForJob(jobId, applicationData) {
    const config = {
      method: "POST"
    };

    if (applicationData instanceof FormData) {
      config.body = applicationData;
    } else {
      config.body = JSON.stringify(applicationData);
      config.headers = { "Content-Type": "application/json" };
    }

    return this.request(`/api/jobs/${jobId}/apply`, config);
  }

  async getJobApplications(jobId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/jobs/${jobId}/applications${queryString ? `?${queryString}` : ""}`, { useCache: false });
  }

  async getAllJobApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/jobs/admin/applications${queryString ? `?${queryString}` : ""}`, { useCache: false });
  }

  async updateApplicationStatus(applicationId, status, adminNotes = "") {
    return this.request(`/api/jobs/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
      headers: { "Content-Type": "application/json" }
    });
  }

  // Products methods
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products${queryParams ? `?${queryParams}` : ""}`);
  }

  async getProduct(productId) {
    return this.request(`/api/products/${productId}`);
  }

  async getProductCategories() {
    return this.request("/api/products/categories");
  }

  // Products Admin methods
  async getProductsAdmin(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/products${queryParams ? `?${queryParams}` : ""}`, { useCache: false });
  }

  async createProduct(formData) {
    const result = await this.request("/api/products/admin/products", {
      method: "POST",
      body: formData
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  }

  async updateProduct(productId, formData) {
    const result = await this.request(`/api/products/admin/products/${productId}`, {
      method: "PUT",
      body: formData
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  }

  async deleteProduct(productId) {
    const result = await this.request(`/api/products/admin/products/${productId}`, {
      method: "DELETE"
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  }

  async updateProductOrder(products) {
    return this.request("/api/products/admin/products-order", {
      method: "PUT",
      body: JSON.stringify({ products }),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getProductAnalytics() {
    return this.request("/api/products/admin/analytics", { useCache: false });
  }

  // Product Inquiry methods
  async submitProductInquiry(inquiryData) {
    return this.request("/api/products/inquiries", {
      method: "POST",
      body: JSON.stringify(inquiryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async submitCartInquiry(cartData) {
    return this.request("/api/products/cart-inquiry", {
      method: "POST",
      body: JSON.stringify(cartData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getProductInquiries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/inquiries?${queryString}`, { useCache: false });
  }

  async updateInquiryStatus(inquiryId, data) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteInquiry(inquiryId) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "DELETE"
    });
  }

  async getInquiryStats() {
    return this.request("/api/products/admin/inquiries/stats", { useCache: false });
  }

  // Service Quote methods
  async submitServiceQuote(quoteData) {
    return this.request("/api/services/quotes", {
      method: "POST",
      body: JSON.stringify(quoteData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getServiceQuotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/services/admin/quotes?${queryString}`, { useCache: false });
  }

  async updateQuoteStatus(quoteId, data) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteQuote(quoteId) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "DELETE"
    });
  }

  async getQuoteStats() {
    return this.request("/api/services/admin/quotes/stats", { useCache: false });
  }

  // User methods
  async getCurrentUser() {
    const authStatus = await this.checkAuthStatus();
    return authStatus.user || null;
  }

  // Check if current user is admin
  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user && user.role === "admin";
    } catch (error) {
      return false;
    }
  }

  // Generic HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options
    });
  }

  async post(endpoint, body, options = {}) {
    const config = {
      method: "POST",
      ...options
    };

    // Handle FormData vs JSON
    if (body instanceof FormData) {
      config.body = body;
      // Remove Content-Type header for FormData to let browser set it
      if (config.headers && config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else if (body) {
      config.body = JSON.stringify(body);
    }

    return this.request(endpoint, config);
  }

  async put(endpoint, body, options = {}) {
    const config = {
      method: "PUT",
      ...options
    };

    if (body instanceof FormData) {
      config.body = body;
      if (config.headers && config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else if (body) {
      config.body = JSON.stringify(body);
    }

    return this.request(endpoint, config);
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options
    });
  }

  // Certificate verification method (public endpoint)
  async verifyCertificate(certificateId) {
    return this.request(`/api/certificates/verify/${certificateId}`, {
      method: "GET"
    });
  }

  // Global search across products, services, projects
  async search(q, type = 'all', limit = 20) {
    const params = new URLSearchParams({ q, type, limit: String(limit) });
    return this.request(`/api/search?${params}`, { useCache: false });
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
export { apiService };
