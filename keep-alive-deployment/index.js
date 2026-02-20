/**
 * SAP Technologies - 24/7 Keep-Alive Service
 * 
 * Standalone service to keep server awake on free-tier hosting
 * Deploy this to: Render.com, Railway.app, Fly.io, or any Node.js hosting
 * 
 * RESILIENT MODE: Never stops pinging, infinite retry
 */

const https = require('https');
const http = require('http');

// Configuration from environment variables or defaults
const CONFIG = {
  SERVER_URL: process.env.SERVER_URL || 'https://sap-technologies-ug.onrender.com',
  PING_INTERVAL: parseInt(process.env.PING_INTERVAL) || 5 * 60 * 1000, // 5 minutes
  TIMEOUT: parseInt(process.env.TIMEOUT) || 30000, // 30 seconds
  MAX_RETRY_DELAY: 60000, // Max 60 seconds between retries
  RETRY_DELAY: 10000, // Start with 10 seconds
  HEALTH_ENDPOINT: '/api/health',
  PORT: process.env.PORT || 3001 // For services that require a web server
};

// Statistics tracking
const stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  startTime: new Date(),
  lastSuccessfulPing: null,
  lastFailedPing: null,
  consecutiveFailures: 0,
  uptime: 0
};

/**
 * Format timestamp for logging
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Log with timestamp and color
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}[${getTimestamp()}] ${message}${colors.reset}`);
}

/**
 * Display statistics dashboard
 */
function displayStats() {
  stats.uptime = Math.floor((new Date() - stats.startTime) / 1000 / 60); // minutes
  const successRate = stats.totalPings > 0 
    ? ((stats.successfulPings / stats.totalPings) * 100).toFixed(2) 
    : 0;
  
  console.log('\n' + '='.repeat(70));
  log('📊 KEEP-ALIVE SERVICE STATISTICS', 'info');
  console.log('='.repeat(70));
  console.log(`🕐 Uptime: ${stats.uptime} minutes (${(stats.uptime / 60).toFixed(1)} hours)`);
  console.log(`📡 Total Pings: ${stats.totalPings}`);
  console.log(`✅ Successful: ${stats.successfulPings} (${successRate}%)`);
  console.log(`❌ Failed: ${stats.failedPings}`);
  console.log(`🔄 Consecutive Failures: ${stats.consecutiveFailures}`);
  
  if (stats.lastSuccessfulPing) {
    console.log(`✨ Last Success: ${stats.lastSuccessfulPing.toISOString()}`);
  }
  
  if (stats.lastFailedPing) {
    console.log(`⚠️  Last Failure: ${stats.lastFailedPing.toISOString()}`);
  }
  
  console.log('='.repeat(70) + '\n');
}

/**
 * Ping the server
 */
async function pingServer() {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.HEALTH_ENDPOINT, CONFIG.SERVER_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'SAP-Technologies-KeepAlive/2.0-Resilient',
        'Accept': 'application/json'
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          stats.successfulPings++;
          stats.consecutiveFailures = 0;
          stats.lastSuccessfulPing = new Date();
          
          try {
            const response = JSON.parse(data);
            log(`✅ Server alive: ${response.message || 'OK'} (${res.statusCode})`, 'success');
            resolve({ success: true, data: response });
          } catch (e) {
            log(`✅ Server is alive (${res.statusCode})`, 'success');
            resolve({ success: true, data: null });
          }
        } else {
          stats.failedPings++;
          stats.consecutiveFailures++;
          stats.lastFailedPing = new Date();
          log(`⚠️  Server returned status ${res.statusCode}`, 'warning');
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      stats.failedPings++;
      stats.consecutiveFailures++;
      stats.lastFailedPing = new Date();
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      stats.failedPings++;
      stats.consecutiveFailures++;
      stats.lastFailedPing = new Date();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Execute ping with INFINITE retry - NEVER GIVES UP
 */
async function executePingWithRetry() {
  stats.totalPings++;
  log(`🔔 Pinging server... (Total pings: ${stats.totalPings})`, 'info');
  
  let attempt = 1;
  let currentRetryDelay = CONFIG.RETRY_DELAY;
  
  // INFINITE LOOP - Will keep trying forever
  while (true) {
    try {
      await pingServer();
      // Success! Exit loop
      return;
    } catch (error) {
      log(`❌ Ping failed (Attempt ${attempt}): ${error.message}`, 'error');
      
      // Calculate next retry delay with exponential backoff
      currentRetryDelay = Math.min(
        CONFIG.RETRY_DELAY * Math.pow(1.5, Math.min(attempt - 1, 5)),
        CONFIG.MAX_RETRY_DELAY
      );
      
      log(`⏳ Retrying in ${Math.round(currentRetryDelay / 1000)}s...`, 'warning');
      
      // Alert on extended downtime
      if (stats.consecutiveFailures >= 5) {
        log(`🚨 ALERT: ${stats.consecutiveFailures} consecutive failures!`, 'error');
      }
      
      await new Promise(resolve => setTimeout(resolve, currentRetryDelay));
      attempt++;
    }
  }
}

/**
 * Start the keep-alive loop - RUNS FOREVER
 */
async function startKeepAlive() {
  log('🚀 SAP Technologies Keep-Alive Service Started (24/7 RESILIENT MODE)', 'success');
  log('💪 MODE: NEVER STOPS - Infinite retry on failures', 'success');
  log(`🌐 Target: ${CONFIG.SERVER_URL}${CONFIG.HEALTH_ENDPOINT}`, 'info');
  log(`⏰ Ping Interval: ${CONFIG.PING_INTERVAL / 1000 / 60} minutes`, 'info');
  log(`🔄 Retry Strategy: Infinite with exponential backoff`, 'info');
  log(`⏱️  Timeout: ${CONFIG.TIMEOUT / 1000} seconds`, 'info');
  console.log('='.repeat(70) + '\n');
  
  // Wrap the entire loop in error handling
  const keepAliveLoop = async () => {
    try {
      // Initial ping
      await executePingWithRetry();
      
      // Set up recurring pings
      setInterval(async () => {
        try {
          await executePingWithRetry();
          
          // Display stats every 12 pings (every hour with 5-min interval)
          if (stats.totalPings % 12 === 0) {
            displayStats();
          }
        } catch (error) {
          log(`⚠️  Unexpected error in ping cycle: ${error.message}`, 'error');
          log('♻️  Continuing operation...', 'warning');
        }
      }, CONFIG.PING_INTERVAL);
      
      // Display stats every 6 hours
      setInterval(() => {
        displayStats();
      }, 6 * 60 * 60 * 1000);
    } catch (error) {
      log(`💥 Critical error in keep-alive loop: ${error.message}`, 'error');
      log('🔄 Restarting in 5 seconds...', 'warning');
      setTimeout(keepAliveLoop, 5000);
    }
  };
  
  // Start the loop
  keepAliveLoop();
}

/**
 * Create a simple HTTP server (required by some hosting platforms)
 */
function createWebServer() {
  const server = http.createServer((req, res) => {
    // Health check endpoint for this keep-alive service
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'running',
        service: 'SAP Technologies Keep-Alive Service',
        targetServer: CONFIG.SERVER_URL,
        stats: {
          ...stats,
          uptime: Math.floor((new Date() - stats.startTime) / 1000 / 60),
          successRate: stats.totalPings > 0 
            ? ((stats.successfulPings / stats.totalPings) * 100).toFixed(2) + '%'
            : '0%'
        }
      }, null, 2));
    } else if (req.url === '/stats') {
      displayStats();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Stats displayed in console. Check logs.');
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(CONFIG.PORT, () => {
    log(`🌐 Web server listening on port ${CONFIG.PORT}`, 'success');
    log(`📊 Stats available at: http://localhost:${CONFIG.PORT}/stats`, 'info');
  });
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    log(`\n🛑 Received ${signal} - Shutting down gracefully...`, 'warning');
    displayStats();
    log('👋 Keep-Alive Service stopped', 'info');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Handle uncaught errors - NEVER STOP
 */
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`, 'error');
  console.error(error.stack);
  log('♻️  Keep-Alive service continues running...', 'warning');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection: ${reason}`, 'error');
  log('♻️  Keep-Alive service continues running...', 'warning');
});

// Start everything
setupGracefulShutdown();
createWebServer(); // Start web server for hosting platforms
startKeepAlive(); // Start keep-alive pinging
