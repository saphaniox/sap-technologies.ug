# 📧 Email Service Setup Guide

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Resend API Key

1. **Sign up**: https://resend.com/signup
2. **Verify your email**
3. **Create API Key**: https://resend.com/api-keys
4. **Copy** the key (starts with `re_`)

### Step 2: Add to Environment Variables

#### For Local Development (.env file):
```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=saptechnologies256@gmail.com
NOTIFY_EMAIL=muganzasaphan@gmail.com
```

#### For Render (Production):
1. Go to: https://dashboard.render.com
2. Select your **backend service**
3. Go to **"Environment"** tab
4. Add these variables:
   - `RESEND_API_KEY` = `re_your_actual_api_key_here`
   - `RESEND_FROM_EMAIL` = `saptechnologies256@gmail.com`
   - `NOTIFY_EMAIL` = `muganzasaphan@gmail.com`
5. **Save Changes** - Render will auto-redeploy

#### For Vercel (If using):
```bash
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add NOTIFY_EMAIL
```

---

## ✅ Why Resend?

| Feature | Resend | SendGrid | Gmail SMTP |
|---------|--------|----------|------------|
| **Free Tier** | 3,000/month | 100/day | N/A |
| **Works on Render** | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Works on Vercel** | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Setup Time** | 2 min | 5 min | 10 min |
| **Deliverability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **API Type** | HTTPS (443) | HTTPS (443) | SMTP (blocked) |

---

## 🔍 Verify It's Working

After adding the API key and redeploying, check your logs:

### Success Message:
```
✅ Email service configured with Resend
📧 From Email: saptechnologies256@gmail.com
↩️  Reply-To Email: saptechnologies256@gmail.com
💡 Resend: 3,000 emails/month free, excellent deliverability
```

### Test Email:
Visit your contact form and submit a test message. You should receive emails within seconds!

---

## 🆘 Troubleshooting

### "Email service not configured"
- ✅ Make sure `RESEND_API_KEY` is set in environment variables
- ✅ Restart your server after adding variables

### "Unauthorized" Error
- ❌ API key is incorrect
- ✅ Copy the key again from https://resend.com/api-keys
- ✅ Make sure there are no extra spaces

### Still Using Gmail SMTP?
- Check logs - if you see "SMTP Port 587", Resend isn't configured
- Add `RESEND_API_KEY` environment variable
- The code prioritizes Resend > SendGrid > Gmail SMTP

---

## 📊 Email Priority Order

The system checks in this order:

1. **Resend** (if `RESEND_API_KEY` exists) ⭐ Recommended
2. **SendGrid** (if `SENDGRID_API_KEY` exists)
3. **Gmail SMTP** (fallback - blocked on cloud platforms)

---

## 🔄 Alternative: Keep SendGrid

If you prefer SendGrid, just comment out Resend:

```env
# RESEND_API_KEY=re_xxx
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=saptechnologies256@gmail.com
```

Both work perfectly on Render and Vercel! 🚀
