/**
 * Professional Keep-Alive Server Script
 * 
 * This script continuously pings the SAP Technologies server to prevent it from sleeping
 * on free-tier hosting platforms (Render, Heroku, etc.)
 * 
 * Features:
 * - Pings server every 5 minutes (configurable)
 * - Robust error handling with retry logic
 * - Detailed logging with timestamps
 * - Health monitoring and status reporting
 * - Graceful shutdown handling
 * 
 * Usage:
 *   node keep-alive-server.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "keep-alive": "node scripts/keep-alive-server.js"
 *   }
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  SERVER_URL: process.env.SERVER_URL || 'https://sap-technologies-ug.onrender.com',
  PING_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
  TIMEOUT: 30000, // 30 seconds timeout
  MAX_RETRIES: Infinity, // NEVER GIVE UP - Keep trying forever
  RETRY_DELAY: 10000, // 10 seconds between retries
  MAX_RETRY_DELAY: 60000, // Max 60 seconds between retries
  HEALTH_ENDPOINT: '/api/health'
};

// Statistics tracking
const stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  startTime: new Date(),
  lastSuccessfulPing: null,
  lastFailedPing: null,
  consecutiveFailures: 0
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
  const uptime = Math.floor((new Date() - stats.startTime) / 1000 / 60); // minutes
  const successRate = stats.totalPings > 0 
    ? ((stats.successfulPings / stats.totalPings) * 100).toFixed(2) 
    : 0;
  
  console.log('\n' + '='.repeat(60));
  log('📊 KEEP-ALIVE SERVER STATISTICS', 'info');
  console.log('='.repeat(60));
  console.log(`🕐 Uptime: ${uptime} minutes`);
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
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Ping the server with retry logic
 */
async function pingServer(retryCount = 0) {
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
        'User-Agent': 'SAP-Technologies-KeepAlive/1.0',
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
            log(`✅ Server responded: ${response.message || 'OK'} (Status: ${res.statusCode})`, 'success');
            resolve({ success: true, data: response });
          } catch (e) {
            log(`✅ Server is alive (Status: ${res.statusCode})`, 'success');
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
 * Execute ping with INFINITE retry logic - NEVER GIVES UP
 */
async function executePingWithRetry() {
  stats.totalPings++;
  log(`🔔 Pinging server... (Attempt ${stats.totalPings})`, 'info');
  
  let attempt = 1;
  let currentRetryDelay = CONFIG.RETRY_DELAY;
  
  // INFINITE LOOP - Will keep trying forever
  while (true) {
    try {
      await pingServer(attempt);
      // Success! Reset retry delay and exit
      return;
    } catch (error) {
      log(`❌ Ping failed (Attempt ${attempt}): ${error.message}`, 'error');
      
      // Calculate next retry delay with exponential backoff (capped at MAX_RETRY_DELAY)
      currentRetryDelay = Math.min(
        CONFIG.RETRY_DELAY * Math.pow(1.5, Math.min(attempt - 1, 5)),
        CONFIG.MAX_RETRY_DELAY
      );
      
      log(`⏳ Retrying in ${Math.round(currentRetryDelay / 1000)} seconds... (Attempt ${attempt})`, 'warning');
      
      await new Promise(resolve => setTimeout(resolve, currentRetryDelay));
      
      // Check if we should alert about extended downtime
      if (stats.consecutiveFailures >= 5) {
        log(`🚨 ALERT: ${stats.consecutiveFailures} consecutive failures detected!`, 'error');
      }
      
      attempt++;
    }
  }
}

/**
 * Start the keep-alive loop - RUNS FOREVER
 */
async function startKeepAlive() {
  log('🚀 SAP Technologies Keep-Alive Server Started (RESILIENT MODE)', 'success');
  log('💪 MODE: NEVER STOPS - Infinite retry on failures', 'success');
  log(`🌐 Target: ${CONFIG.SERVER_URL}${CONFIG.HEALTH_ENDPOINT}`, 'info');
  log(`⏰ Ping Interval: ${CONFIG.PING_INTERVAL / 1000 / 60} minutes`, 'info');
  log(`🔄 Retry Strategy: Infinite with exponential backoff`, 'info');
  log(`⏱️  Timeout: ${CONFIG.TIMEOUT / 1000} seconds`, 'info');
  console.log('='.repeat(60) + '\n');
  
  // Wrap the entire loop in a try-catch to handle any critical errors
  const keepAliveLoop = async () => {
    try {
      // Initial ping
      await executePingWithRetry();
      
      // Set up recurring pings
      setInterval(async () => {
        try {
          await executePingWithRetry();
          
          // Display stats every 10 pings
          if (stats.totalPings % 10 === 0) {
            displayStats();
          }
        } catch (error) {
          // This should never happen due to infinite retry, but handle it anyway
          log(`⚠️  Unexpected error in ping cycle: ${error.message}`, 'error');
          log('♻️  Continuing operation...', 'warning');
        }
      }, CONFIG.PING_INTERVAL);
      
      // Display stats every hour
      setInterval(() => {
        displayStats();
      }, 60 * 60 * 1000);
    } catch (error) {
      log(`💥 Critical error in keep-alive loop: ${error.message}`, 'error');
      log('🔄 Restarting in 5 seconds...', 'warning');
      setTimeout(keepAliveLoop, 5000); // Restart the loop
    }
  };
  
  // Start the loop
  keepAliveLoop();
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    log(`\n🛑 Received ${signal} - Shutting down gracefully...`, 'warning');
    displayStats();
    log('👋 Keep-Alive Server stopped', 'info');
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
  // Don't exit - keep the keep-alive running
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  log('♻️  Keep-Alive service continues running...', 'warning');
  // Don't exit - keep the keep-alive running
});

// Start the server
setupGracefulShutdown();
startKeepAlive().catch((error) => {
  log(`💥 Fatal error during startup: ${error.message}`, 'error');
  console.error(error.stack);
  log('🔄 Attempting restart in 5 seconds...', 'warning');
  setTimeout(() => startKeepAlive(), 5000);
});
