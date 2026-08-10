import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Get API base URL
const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname === '0.0.0.0');
  
  if (isLocalhost && import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "";
  }
  return import.meta.env.VITE_API_URL || "https://sap-technologies-ug.onrender.com";
};

const API_BASE_URL = getApiUrl();
const TRACKING_ENDPOINT = `${API_BASE_URL}/api/visitor/track`;

const getStoredSessionItem = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredSessionItem = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
};

const getPerformanceTiming = () => {
  if (typeof performance === "undefined") return {};

  const timing = performance.timing;
  if (!timing) return {};

  const loadTime = timing.loadEventEnd > 0
    ? timing.loadEventEnd - timing.navigationStart
    : 0;
  const domReady = timing.domContentLoadedEventEnd > 0
    ? timing.domContentLoadedEventEnd - timing.navigationStart
    : 0;

  return {
    loadTime: Math.max(0, loadTime),
    domReady: Math.max(0, domReady),
  };
};

// Generate a unique fingerprint for the visitor
const generateFingerprint = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("Browser Fingerprint", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("Browser Fingerprint", 4, 17);

  const canvasData = canvas.toDataURL();
  
  // Combine with other browser properties
  const fingerprint = {
    canvas: canvasData,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins || []).map(p => p.name).join(","),
  };

  // Create hash from fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = getStoredSessionItem("visitor_session_id");
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setStoredSessionItem("visitor_session_id", sessionId);
  }
  
  return sessionId;
};

const sendTrackingPayload = async (payload, preferBeacon = false) => {
  const enrichedPayload = {
    ...payload,
    fingerprint: payload.fingerprint || getStoredSessionItem("x-fingerprint") || "",
    url: payload.url || window.location.href,
  };

  if (preferBeacon && navigator.sendBeacon) {
    const body = new Blob([JSON.stringify(enrichedPayload)], {
      type: "application/json"
    });
    navigator.sendBeacon(TRACKING_ENDPOINT, body);
    return;
  }

  await fetch(TRACKING_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": enrichedPayload.sessionId,
      "X-Fingerprint": enrichedPayload.fingerprint,
    },
    credentials: "include",
    body: JSON.stringify(enrichedPayload),
    keepalive: true,
  });
};

// Custom hook for visitor tracking
export const useVisitorTracking = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const sessionId = useRef(getSessionId());
  const fingerprint = useRef(generateFingerprint());

  // Track page view
  useEffect(() => {
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;

    setStoredSessionItem("x-fingerprint", fingerprint.current);

    // Track scroll depth
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollableHeight = Math.max(1, documentHeight - windowHeight);
      const scrollPercentage = Math.min(100, Math.max(0, Math.round((scrollTop / scrollableHeight) * 100)));
      
      maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercentage);
    };

    window.addEventListener("scroll", handleScroll);

    // Send page view update when user leaves
    const sendPageViewUpdate = async () => {
      const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      try {
        await sendTrackingPayload({
          sessionId: sessionId.current,
          fingerprint: fingerprint.current,
          path: location.pathname,
          title: document.title,
          timeOnPage,
          scrollDepth: maxScrollRef.current,
          performance: getPerformanceTiming()
        });
      } catch (error) {
        console.error("Failed to update page view:", error);
      }
    };

    sendPageViewUpdate();

    // Send update before leaving page
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);

      sendTrackingPayload({
        sessionId: sessionId.current,
        fingerprint: fingerprint.current,
        path: location.pathname,
        title: document.title,
        timeOnPage,
        scrollDepth: maxScrollRef.current,
        performance: getPerformanceTiming()
      }, true).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Send periodic updates every 30 seconds
    const updateInterval = setInterval(sendPageViewUpdate, 30000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(updateInterval);
      sendPageViewUpdate(); // Send final update
    };
  }, [location]);

  return {
    sessionId: sessionId.current,
    fingerprint: fingerprint.current,
  };
};

// Track custom events
export const trackEvent = async (eventName, eventValue = "") => {
  try {
    const sessionId = getSessionId();
    const fingerprint = generateFingerprint();
    
    await sendTrackingPayload({
      sessionId,
      fingerprint,
      path: window.location.pathname,
      event: {
        name: eventName,
        value: eventValue,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
};

export default useVisitorTracking;
