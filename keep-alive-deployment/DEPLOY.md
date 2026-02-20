# 🚀 Deploying SAP Keep-Alive Service

## ⚡ Quick Deploy to Render.com (Recommended - 10 Minutes)

### Step 1: Push to GitHub
```bash
# Navigate to keep-alive-deployment folder
cd keep-alive-deployment

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "SAP Keep-Alive Service - Initial deployment"

# Create a new repository on GitHub named "sap-keep-alive"
# Then push to GitHub
git remote add origin https://github.com/YOUR-USERNAME/sap-keep-alive.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render
1. Go to **https://render.com** and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect" next to GitHub**
4. Select your **"sap-keep-alive"** repository
5. Configure the service:
   ```
   Name: sap-keep-alive
   Region: Choose closest to your main server
   Branch: main
   Runtime: Node
   Build Command: (leave empty or "npm install")
   Start Command: npm start
   Plan: Free
   ```
6. Click **"Advanced"** and add environment variables:
   ```
   SERVER_URL = https://sap-technologies-ug.onrender.com
   ```
7. Click **"Create Web Service"**

### Step 3: Wait for Deployment
- First build takes 2-5 minutes
- Watch the logs for "🚀 SAP Technologies Keep-Alive Service Started"
- Your service will be live at: `https://sap-keep-alive.onrender.com`

### Step 4: Verify It's Working
Visit: `https://sap-keep-alive.onrender.com/health`

You should see:
```json
{
  "status": "running",
  "service": "SAP Technologies Keep-Alive Service",
  "targetServer": "https://sap-technologies-ug.onrender.com",
  "stats": { ... }
}
```

✅ **Done! Your server will now stay awake 24/7!**

---

## 🚂 Alternative: Deploy to Railway.app (5 Minutes)

### Quick Deploy:
1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway auto-detects settings (thanks to railway.json)
6. Add environment variable:
   ```
   SERVER_URL = https://sap-technologies-ug.onrender.com
   ```
7. Click **"Deploy"**

✅ **Done in 5 minutes!**

---

## 🐳 Alternative: Deploy with Docker

### Using Docker Hub:
```bash
# Build image
docker build -t yourusername/sap-keep-alive .

# Push to Docker Hub
docker push yourusername/sap-keep-alive

# Run anywhere
docker run -d -p 3001:3001 \
  -e SERVER_URL=https://sap-technologies-ug.onrender.com \
  yourusername/sap-keep-alive
```

---

## ☁️ Alternative: Fly.io (Free 3 VMs)

### Deploy to Fly.io:
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Set environment variable
flyctl secrets set SERVER_URL=https://sap-technologies-ug.onrender.com

# Deploy
flyctl deploy
```

---

## 🔧 Environment Variables

All platforms support these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_URL` | `https://sap-technologies-ug.onrender.com` | Your server URL |
| `PING_INTERVAL` | `300000` | Ping interval in ms (5 min) |
| `TIMEOUT` | `30000` | Request timeout in ms (30 sec) |
| `PORT` | `3001` | Web server port |

---

## 📊 Monitoring Your Deployment

### Check Status:
- Visit: `https://your-app.onrender.com/`
- Check logs in hosting dashboard
- Verify pings in your main server logs

### Expected Logs:
```
🚀 SAP Technologies Keep-Alive Service Started (24/7 RESILIENT MODE)
💪 MODE: NEVER STOPS - Infinite retry on failures
🌐 Target: https://sap-technologies-ug.onrender.com/api/health
⏰ Ping Interval: 5 minutes
✅ Server alive: OK (200)
```

---

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Service is running (check hosting dashboard)
- [ ] Web endpoint responds: `https://your-app.onrender.com/health`
- [ ] Logs show successful pings every 5 minutes
- [ ] Your main server logs show incoming health checks
- [ ] No errors in deployment logs

---

## 🆘 Troubleshooting

### Service won't start:
- Check logs in hosting dashboard
- Verify `package.json` exists
- Ensure Node.js version is 18+

### Pings failing:
- Verify `SERVER_URL` is correct
- Check if `/api/health` endpoint exists on main server
- Check main server logs

### Service keeps sleeping (Render Free Tier):
This standalone service might also sleep on Render's free tier after 15 minutes of inactivity. To prevent this:
1. **Use UptimeRobot** to ping THIS service too!
   - URL: `https://sap-keep-alive.onrender.com/health`
   - Interval: 10 minutes
2. Or upgrade to Render paid plan ($7/month)

---

## 💡 Best Setup (Maximum Reliability)

```
UptimeRobot Monitor 1 → Main Server
        ↓
UptimeRobot Monitor 2 → Keep-Alive Service → Main Server
        ↓
Keep-Alive Service pings Main Server every 5 min
```

This creates **3 layers of protection**:
1. UptimeRobot pings main server directly
2. UptimeRobot keeps the keep-alive service awake
3. Keep-alive service pings main server

**Result: 99.99% uptime!** 🎉

---

## 🚀 Quick Command Summary

**Render.com (Web UI):**
- Push to GitHub → Connect in Render → Deploy

**Railway.app (Web UI):**
- Push to GitHub → Connect in Railway → Deploy  

**Fly.io (CLI):**
```bash
flyctl launch
flyctl deploy
```

**Docker:**
```bash
docker build -t sap-keep-alive .
docker run -d -p 3001:3001 -e SERVER_URL=https://your-server.com sap-keep-alive
```

---

## 📞 Need Help?

- Check deployment logs first
- Email: saptechnologies256@gmail.com
- Review logs at: `https://your-app.onrender.com/stats`

---

**🎉 Your server will NEVER sleep again!**
