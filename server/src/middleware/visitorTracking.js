const { VisitorSession, PageView } = require("../models/Visitor");
const UAParser = require("ua-parser-js");

// Helper to parse user agent
const parseUserAgent = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || "Unknown",
    version: result.browser.version || "",
    os: result.os.name || "Unknown",
    platform: result.os.version || "",
    device: result.device.type || "desktop",
    raw: userAgentString
  };
};

// Helper to extract referrer info
const parseReferrer = (referrerUrl) => {
  if (!referrerUrl) {
    return { url: "", domain: "", source: "direct" };
  }
  
  try {
    const url = new URL(referrerUrl);
    const domain = url.hostname;
    
    // Detect source type
    let source = "referral";
    if (domain.includes("google.")) source = "organic";
    else if (domain.includes("facebook.") || domain.includes("twitter.") || 
             domain.includes("linkedin.") || domain.includes("instagram.")) {
      source = "social";
    }
    
    return {
      url: referrerUrl,
      domain: domain,
      source: source
    };
  } catch (e) {
    return { url: referrerUrl, domain: "", source: "referral" };
  }
};

// Helper to extract UTM parameters
const extractUTMParams = (query) => {
  const utm = {};
  if (query.utm_source) utm.source = query.utm_source;
  if (query.utm_medium) utm.medium = query.utm_medium;
  if (query.utm_campaign) utm.campaign = query.utm_campaign;
  if (query.utm_term) utm.term = query.utm_term;
  if (query.utm_content) utm.content = query.utm_content;
  
  return Object.keys(utm).length > 0 ? utm : null;
};

// Get client IP address (handles proxies)
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         'unknown';
};

// Generate session ID from request
const getSessionId = (req) => {
  // Try to get from cookie first
  if (req.cookies && req.cookies.visitor_session_id) {
    return req.cookies.visitor_session_id;
  }
  
  // Try from header (for API calls)
  if (req.headers['x-session-id']) {
    return req.headers['x-session-id'];
  }
  
  return null;
};

// Visitor tracking middleware
const trackVisitor = async (req, res, next) => {
  try {
    // Skip tracking for certain paths
    const skipPaths = [
      '/api/admin/visitors', // Don't track admin analytics requests
      '/api/admin/visitor-analytics',
      '/uploads/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml'
    ];
    
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    if (shouldSkip) {
      return next();
    }
    
    // Get visitor data
    const sessionId = getSessionId(req);
    const fingerprint = req.headers['x-fingerprint'] || null;
    const ipAddress = getClientIP(req);
    const userAgent = parseUserAgent(req.headers['user-agent'] || '');
    const referrer = parseReferrer(req.headers.referer || req.headers.referrer);
    const utm = extractUTMParams(req.query);
    
    let visitorSession;
    
    if (sessionId) {
      // Find existing session
      visitorSession = await VisitorSession.findOne({ sessionId });
      
      if (visitorSession) {
        // Update existing session
        await visitorSession.incrementPageViews();
        visitorSession.isReturning = true;
      }
    }
    
    if (!visitorSession) {
      // Create new session
      const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if this fingerprint has visited before
      const isUnique = fingerprint ? 
        !(await VisitorSession.findOne({ fingerprint })) : 
        true;
      
      visitorSession = new VisitorSession({
        sessionId: newSessionId,
        fingerprint,
        ipAddress,
        userAgent,
        referrer,
        utm,
        isUnique,
        isReturning: !isUnique,
        userId: req.user?._id || null
      });
      
      await visitorSession.save();
      
      // Set cookie for session tracking (30 minutes)
      res.cookie('visitor_session_id', newSessionId, {
        maxAge: 30 * 60 * 1000, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // Attach to request for use in other middleware/controllers
    req.visitorSession = visitorSession;
    
  } catch (error) {
    console.error('Visitor tracking error:', error);
    // Don't block the request if tracking fails
  }
  
  next();
};

// Page view tracking middleware
const trackPageView = async (req, res, next) => {
  try {
    // Only track GET requests to HTML pages
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      return next();
    }
    
    if (!req.visitorSession) {
      return next();
    }
    
    const pageView = new PageView({
      sessionId: req.visitorSession.sessionId,
      visitorSessionRef: req.visitorSession._id,
      page: {
        path: req.path,
        url: req.originalUrl,
        query: JSON.stringify(req.query),
        title: '' // Will be updated from client-side
      },
      timestamp: new Date()
    });
    
    await pageView.save();
    
    // Attach to request
    req.pageView = pageView;
    
  } catch (error) {
    console.error('Page view tracking error:', error);
  }
  
  next();
};

module.exports = {
  trackVisitor,
  trackPageView,
  getClientIP,
  parseUserAgent
};
