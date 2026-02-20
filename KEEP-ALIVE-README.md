# 🔄 SAP Technologies Keep-Alive System

Professional server keep-alive solution to prevent your hosted server from sleeping on free-tier platforms (Render, Heroku, etc.).

## 📋 Overview

This system includes **two complementary approaches** to keep your server awake:

1. **Client-Side Keep-Alive** - Integrated into the React app
2. **Standalone Keep-Alive Server** - Independent Node.js script

## 🎯 Features

### Client-Side Keep-Alive (`keepAliveService.js`)
✅ Automatically pings server every 10 minutes when app is active  
✅ Intelligent visibility detection (pauses when tab is hidden)  
✅ Network-aware (handles offline/online states)  
✅ Automatic retry logic with exponential backoff  
✅ Detailed statistics and monitoring  
✅ Zero configuration required  

### Standalone Keep-Alive Server (`keep-alive-server.js`)
✅ Independent process - runs 24/7 without browser  
✅ Pings server every 5 minutes  
✅ Robust error handling and retry logic  
✅ Comprehensive logging with timestamps  
✅ Statistics dashboard  
✅ Graceful shutdown handling  
✅ Configurable via environment variables  

---

## 🚀 Quick Start

### Option 1: Client-Side Keep-Alive (Automatic)

The client-side keep-alive is **already integrated** and starts automatically when users visit your website.

**No setup required!** ✨

To monitor it in development:
```javascript
// Open browser console
window.keepAliveService.displayStats()
```

### Option 2: Standalone Keep-Alive Server (Recommended for 24/7)

Run the standalone script to keep your server awake even when no users are browsing:

#### Local Development
```bash
cd server
npm run keep-alive
```

#### Production Deployment
You can deploy this script to a free hosting service like:
- **Render** (Free tier)
- **Railway** (Free tier)
- **Fly.io** (Free tier)
- **Vercel** (Serverless cron)
- Or run it on your local machine 24/7

---

## ⚙️ Configuration

### Client-Side Configuration

Edit `sap-technologies-official/src/services/keepAliveService.js`:

```javascript
this.config = {
  pingInterval: 10 * 60 * 1000,    // 10 minutes (adjustable)
  initialDelay: 30 * 1000,          // 30 seconds after load
  timeout: 15000,                   // 15 second timeout
  maxRetries: 2,                    // Retry attempts
  retryDelay: 5000,                 // 5 seconds between retries
  pauseWhenHidden: true,            // Pause when tab hidden
  endpoint: '/api/health'           // Health check endpoint
};
```

### Standalone Server Configuration

Edit `server/scripts/keep-alive-server.js` or use environment variables:

```javascript
const CONFIG = {
  SERVER_URL: process.env.SERVER_URL || 'https://sap-technologies-ug.onrender.com',
  PING_INTERVAL: 5 * 60 * 1000,     // 5 minutes
  TIMEOUT: 30000,                    // 30 seconds
  MAX_RETRIES: 3,                    // Retry attempts
  RETRY_DELAY: 10000,                // 10 seconds between retries
  HEALTH_ENDPOINT: '/api/health'     // Health check endpoint
};
```

**Using Environment Variables:**
```bash
SERVER_URL=https://your-server.com node scripts/keep-alive-server.js
```

---

## 📊 Monitoring & Statistics

### Client-Side Monitoring

Open browser console (F12) and type:
```javascript
// Display full statistics
window.keepAliveService.displayStats()

// Get stats programmatically
window.keepAliveService.getStats()

// Manual ping
window.keepAliveService.ping()

// Stop service
window.keepAliveService.stop()

// Start service
window.keepAliveService.start()
```

### Standalone Server Monitoring

The standalone script displays statistics automatically:
- Real-time ping status
- Success/failure counters
- Uptime tracking
- Last ping timestamps
- Statistics dashboard every 10 pings or hourly

---

## 🔧 Deployment Strategies

### Strategy 1: Client-Side Only (Simple)
✅ Best for: Sites with regular traffic  
✅ Setup: Already done! No action needed  
⚠️ Limitation: Only works when users are browsing  

### Strategy 2: Standalone Script (24/7)
✅ Best for: Guaranteed uptime  
✅ Setup: Deploy to free hosting or run locally  
⚠️ Note: Requires deployment  

### Strategy 3: Hybrid (Recommended)
✅ Best for: Maximum reliability  
✅ Client-side handles daytime traffic  
✅ Standalone script handles nighttime/low-traffic  
✅ Redundancy ensures server never sleeps  

### Strategy 4: External Monitoring Services
Use external services like:
- **UptimeRobot** (https://uptimerobot.com) - Free tier: 50 monitors
- **Cron-Job.org** (https://cron-job.org) - Free tier: Unlimited
- **BetterUptime** (https://betteruptime.com) - Free tier: 10 monitors

---

## 📦 Package Scripts

### Server Scripts
```bash
# Start main server
npm start

# Start development server
npm run dev

# Start keep-alive service
npm run keep-alive
```

---

## 🐛 Troubleshooting

### Issue: Keep-alive not working
**Solution:**
1. Check if `/api/health` endpoint is accessible
2. Verify SERVER_URL is correct
3. Check browser console for errors
4. Ensure network connectivity

### Issue: Too many requests
**Solution:**
1. Increase ping intervals in config
2. Reduce retry attempts
3. Check if multiple keep-alive services are running

### Issue: Server still sleeping
**Solution:**
1. Deploy standalone keep-alive script to external service
2. Use multiple keep-alive methods (hybrid approach)
3. Consider paid hosting tier

### Issue: High data usage
**Solution:**
1. Increase ping intervals (10-15 minutes is optimal)
2. Disable client-side keep-alive on mobile networks
3. Use standalone script only

---

## 📈 Performance Impact

### Client-Side
- **Network Usage:** ~1 KB per ping (minimal)
- **CPU Usage:** Negligible
- **Battery Impact:** Minimal (pauses when hidden)

### Standalone Server
- **Network Usage:** ~1 KB per ping
- **CPU Usage:** < 1%
- **Memory Usage:** ~10-20 MB

---

## 🔐 Security Considerations

✅ Uses only public health check endpoint  
✅ No sensitive data transmitted  
✅ Standard HTTP requests  
✅ No authentication required for health checks  
✅ Rate-limited to prevent abuse  

---

## 📝 Logs & Debugging

### Client-Side Logs
Available in browser console (development mode only)

### Standalone Server Logs
Displayed in terminal with color-coded messages:
- 🔵 **Info** - General information
- 🟢 **Success** - Successful pings
- 🟡 **Warning** - Retries, non-critical issues
- 🔴 **Error** - Failed pings, critical issues

---

## 🎯 Best Practices

1. **Use Hybrid Approach** - Combine client-side + standalone for best results
2. **Monitor Regularly** - Check statistics to ensure system is working
3. **Adjust Intervals** - Balance between reliability and resource usage
4. **External Monitoring** - Consider adding UptimeRobot as third layer
5. **Log Analysis** - Review logs periodically for issues
6. **Graceful Degradation** - System should handle failures gracefully

---

## 📞 Support

For issues or questions:
- Email: saptechnologies256@gmail.com
- Check server logs for detailed error messages
- Review this documentation

---

## 📄 License

Part of SAP Technologies Uganda infrastructure  
© 2026 SAP Technologies. All rights reserved.

---

## 🔄 Version History

### v1.0.0 (2026-02-20)
- Initial implementation
- Client-side keep-alive service
- Standalone keep-alive server
- Comprehensive monitoring and statistics
- Configurable intervals and retry logic
- Graceful error handling
