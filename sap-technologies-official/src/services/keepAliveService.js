/**
 * Client-Side Keep-Alive Service
 * 
 * Automatically pings the server at regular intervals when the app is active
 * to prevent the server from going to sleep on free-tier hosting.
 * 
 * Features:
 * - Automatic background pinging
 * - Intelligent retry logic
 * - Visibility-aware (pauses when tab is hidden)
 * - Network-aware (handles offline/online states)
 * - Configurable intervals
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sap-technologies-ug.onrender.com";

class KeepAliveService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.recoveryIntervalId = null;
    this.config = {
      pingInterval: 10 * 60 * 1000, // 10 minutes
      initialDelay: 30 * 1000, // 30 seconds after app loads
      timeout: 15000, // 15 second timeout per request
      maxRetries: 5, // Try 5 times per ping cycle
      retryDelay: 3000, // 3 seconds between retries
      recoveryCheckInterval: 30000, // Check every 30 seconds for recovery
      pauseWhenHidden: true, // Pause when browser tab is hidden
      endpoint: '/api/health'
    };
    
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      consecutiveFailures: 0,
      lastPingTime: null,
      lastPingStatus: null,
      startTime: null
    };
    
    this.isVisible = true;
    this.isOnline = navigator.onLine;
    this.isPinging = false;
    
    this.setupEventListeners();
  }
  
  /**
   * Setup browser event listeners
   */
  setupEventListeners() {
    // Handle visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        
        if (this.config.pauseWhenHidden) {
          if (this.isVisible && this.isRunning) {
            this.log('📱 Tab is now visible - resuming keep-alive', 'info');
            this.ping(); // Immediate ping when tab becomes visible
          } else if (!this.isVisible) {
            this.log('💤 Tab is now hidden - pausing keep-alive', 'info');
          }
        }
      });
    }
    
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.log('🌐 Network connectivity restored', 'success');
      if (this.isRunning) {
        this.ping(); // Immediate ping when back online
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.log('📡 Network connectivity lost', 'warning');
    });
  }
  
  /**
   * Log messages (only in development)
   */
  log(message, type = 'info') {
    if (import.meta.env.DEV) {
      const styles = {
        info: 'color: #3b82f6',
        success: 'color: #10b981',
        error: 'color: #ef4444',
        warning: 'color: #f59e0b'
      };
      console.log(`%c[KeepAlive] ${message}`, styles[type] || styles.info);
    }
  }
  
  /**
   * Check if we should ping (considering visibility and network state)
   */
  shouldPing() {
    if (!this.isOnline) {
      this.log('❌ Skipping ping - offline', 'warning');
      return false;
    }
    
    if (this.config.pauseWhenHidden && !this.isVisible) {
      this.log('⏸️  Skipping ping - tab hidden', 'info');
      return false;
    }
    
    return true;
  }
  
  /**
   * Execute a single ping request
   */
  async executePing() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(`${API_BASE_URL}${this.config.endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'X-KeepAlive': 'true'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.stats.successfulPings++;
        this.stats.consecutiveFailures = 0; // Reset on success
        this.stats.lastPingStatus = 'success';
        this.stats.lastPingTime = new Date();
        
        const data = await response.json().catch(() => null);
        this.log(`✅ Server is alive ${data?.uptime ? `(Uptime: ${data.uptime})` : ''}`, 'success');
        
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
  
  /**
   * Ping with retry logic - NEVER GIVES UP
   */
  async ping() {
    if (!this.shouldPing()) {
      return;
    }
    
    if (this.isPinging) {
      this.log('⏳ Previous ping still in progress, skipping...', 'warning');
      return;
    }
    
    this.isPinging = true;
    this.stats.totalPings++;
    this.log(`🔔 Pinging server... (Total: ${this.stats.totalPings})`, 'info');
    
    let pingSuccess = false;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.executePing();
        pingSuccess = true;
        break; // Success - exit retry loop
      } catch (error) {
        this.log(`❌ Ping failed (${attempt}/${this.config.maxRetries}): ${error.message}`, 'error');
        
        if (attempt < this.config.maxRetries) {
          this.log(`⏳ Retrying in ${this.config.retryDelay / 1000}s...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    if (!pingSuccess) {
      this.stats.failedPings++;
      this.stats.consecutiveFailures++;
      this.stats.lastPingStatus = 'failed';
      this.stats.lastPingTime = new Date();
      this.log(`💔 All ${this.config.maxRetries} retry attempts failed`, 'error');
      
      if (this.stats.consecutiveFailures >= 3) {
        this.log(`🚨 ${this.stats.consecutiveFailures} consecutive failures - recovery mode active`, 'error');
      }
    }
    
    this.isPinging = false;
  }
  
  /**
   * Start the keep-alive service - NEVER STOPS
   */
  start() {
    if (this.isRunning) {
      this.log('⚠️  Keep-alive already running', 'warning');
      return;
    }
    
    this.isRunning = true;
    this.stats.startTime = new Date();
    
    this.log('🚀 Keep-Alive Service started (RESILIENT MODE - Never Stops)', 'success');
    this.log(`⏰ Ping interval: ${this.config.pingInterval / 1000 / 60} minutes`, 'info');
    this.log(`🎯 Target: ${API_BASE_URL}${this.config.endpoint}`, 'info');
    this.log(`💪 Recovery checks: Every ${this.config.recoveryCheckInterval / 1000} seconds`, 'info');
    
    // Initial ping after delay with error handling
    setTimeout(() => {
      this.ping().catch(err => {
        this.log(`Initial ping error: ${err.message}`, 'error');
        this.log('Service continues...', 'info');
      });
    }, this.config.initialDelay);
    
    // Set up recurring pings with error handling
    this.intervalId = setInterval(() => {
      this.ping().catch(err => {
        this.log(`Scheduled ping error: ${err.message}`, 'error');
        this.log('Next ping will continue as scheduled...', 'info');
      });
    }, this.config.pingInterval);
    
    // Set up recovery mechanism - extra pings when failures detected
    this.recoveryIntervalId = setInterval(() => {
      if (this.stats.consecutiveFailures >= 3 && !this.isPinging) {
        this.log(`🔄 Recovery ping triggered (${this.stats.consecutiveFailures} failures)`, 'warning');
        this.ping().catch(err => {
          this.log(`Recovery ping error: ${err.message}`, 'error');
        });
      }
    }, this.config.recoveryCheckInterval);
  }
  
  /**
   * Stop the keep-alive service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPinging = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.recoveryIntervalId) {
      clearInterval(this.recoveryIntervalId);
      this.recoveryIntervalId = null;
    }
    
    this.log('🛑 Keep-Alive Service stopped', 'warning');
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    const uptime = this.stats.startTime 
      ? Math.floor((new Date() - this.stats.startTime) / 1000 / 60) 
      : 0;
    
    const successRate = this.stats.totalPings > 0
      ? ((this.stats.successfulPings / this.stats.totalPings) * 100).toFixed(1)
      : 0;
    
    return {
      ...this.stats,
      uptime,
      successRate,
      isRunning: this.isRunning,
      isVisible: this.isVisible,
      isOnline: this.isOnline,
      isPinging: this.isPinging
    };
  }
  
  /**
   * Update configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Display statistics in console
   */
  displayStats() {
    const stats = this.getStats();
    console.log('\n' + '='.repeat(50));
    console.log('%c📊 Keep-Alive Statistics (RESILIENT MODE)', 'font-weight: bold; font-size: 14px');
    console.log('='.repeat(50));
    console.log(`⏰ Uptime: ${stats.uptime} minutes`);
    console.log(`📡 Total Pings: ${stats.totalPings}`);
    console.log(`✅ Successful: ${stats.successfulPings} (${stats.successRate}%)`);
    console.log(`❌ Failed: ${stats.failedPings}`);
    console.log(`🔄 Consecutive Failures: ${stats.consecutiveFailures}`);
    console.log(`🔄 Status: ${stats.isRunning ? 'Running' : 'Stopped'}`);
    console.log(`⚡ Pinging: ${stats.isPinging ? 'Yes' : 'No'}`);
    console.log(`👁️  Visible: ${stats.isVisible}`);
    console.log(`🌐 Online: ${stats.isOnline}`);
    
    if (stats.lastPingTime) {
      console.log(`📅 Last Ping: ${stats.lastPingTime.toLocaleString()}`);
    }
    
    console.log('='.repeat(50) + '\n');
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

// Export for use in app
export default keepAliveService;

// Also expose globally in development for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.keepAliveService = keepAliveService;
  console.log('%c[KeepAlive] Service available at window.keepAliveService', 'color: #10b981; font-weight: bold');
  console.log('%cUsage: window.keepAliveService.displayStats()', 'color: #3b82f6');
}
