# SAP Technologies - 24/7 Keep-Alive Service

This is a standalone keep-alive service that runs 24/7 to prevent your server from sleeping on free-tier hosting.

## 🚀 Quick Deploy Options

### Option 1: Render.com (Free - Recommended)
1. Push this folder to a GitHub repository
2. Go to [Render.com](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: `sap-keep-alive`
   - **Environment**: `Node`
   - **Build Command**: (leave empty)
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Add environment variable:
   - `SERVER_URL` = `https://sap-technologies-ug.onrender.com`
7. Click "Create Web Service"

### Option 2: Railway.app (Free)
1. Push this folder to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Add environment variable: `SERVER_URL`
6. Deploy!

### Option 3: Fly.io (Free)
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy
flyctl launch
```

### Option 4: Vercel (Serverless - Not ideal for long-running)
Use Vercel Cron instead - see below

## 🌐 Using External Services (Even Easier!)

### UptimeRobot (Free - Best for simplicity)
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up (free account allows 50 monitors)
3. Click "Add New Monitor"
4. Configure:
   - **Type**: HTTP(s)
   - **Name**: SAP Technologies Server
   - **URL**: `https://sap-technologies-ug.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes
5. Click "Create Monitor"

✅ That's it! UptimeRobot will ping your server every 5 minutes forever.

### Cron-Job.org (Free - Unlimited monitors)
1. Go to [Cron-Job.org](https://cron-job.org)
2. Create account
3. Create new cron job:
   - **URL**: `https://sap-technologies-ug.onrender.com/api/health`
   - **Schedule**: Every 5 minutes
4. Save

### BetterUptime (Free - 10 monitors)
1. Go to [BetterUptime.com](https://betteruptime.com)
2. Sign up
3. Add monitor with your server URL
4. Done!

## 💡 Environment Variables

- `SERVER_URL` - Your server URL (default: https://sap-technologies-ug.onrender.com)
- `PING_INTERVAL` - Ping interval in milliseconds (default: 300000 = 5 minutes)
- `TIMEOUT` - Request timeout in milliseconds (default: 30000 = 30 seconds)
- `PORT` - Web server port (default: 3001)

## 📊 Monitoring

Once deployed, you can check the status:
- Visit: `https://your-app.onrender.com/` to see stats
- Visit: `https://your-app.onrender.com/health` for health check
- Check logs in your hosting dashboard

## 🔧 Local Testing

```bash
npm start
```

## 📈 What This Does

1. **Pings your server** every 5 minutes
2. **Never stops** - even on failures, it retries infinitely
3. **Exponential backoff** - Smart retry delays
4. **Statistics tracking** - Monitor performance
5. **Auto-recovery** - Handles all errors gracefully

## 🎯 Recommendation

**For simplest setup**: Use **UptimeRobot** - No deployment needed, just configure and forget!

**For full control**: Deploy this service to **Render.com** - Completely free and runs 24/7.

**Hybrid approach**: Use both! Maximum reliability with redundancy.

## 🚀 Your Server Will Never Sleep Again!
