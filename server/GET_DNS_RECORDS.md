# Getting Your Domain Authentication DNS Records

## Step 1: Access SendGrid Domain Authentication

1. **Login to SendGrid:**
   - Go to: https://app.sendgrid.com/settings/sender_auth

2. **Look at the page - you'll see TWO sections:**

   ### Section 1: Domain Authentication (❌ NOT DONE YET)
   - This is what we need!
   - Should show: "Authenticate Your Domain" button
   - OR if started: Shows your domain with "Pending" or "Verify" button

   ### Section 2: Link Branding (✅ ALREADY DONE)
   - This shows:
     - url5736.sap-technologies.com → sendgrid.net ✅
     - 56630488.sap-technologies.com → sendgrid.net ✅

## Step 2: Start Domain Authentication (If Not Started)

If you see **"Authenticate Your Domain"** button:

1. Click the button
2. Select DNS provider: **Namecheap** (or your provider)
3. Enter domain: `sap-technologies.com`
4. Check both boxes:
   - ✅ Brand links with this domain
   - ✅ Use automated security
5. Click **"Next"**

## Step 3: Get Your 3 CNAME Records

SendGrid will show you **3 new CNAME records** that look like this:

```
Record 1 (Mail CNAME):
Type: CNAME
Host: em####.sap-technologies.com
Value: u######.wl###.sendgrid.net

Record 2 (DKIM 1):
Type: CNAME
Host: s1._domainkey.sap-technologies.com
Value: s1.domainkey.u######.wl###.sendgrid.net

Record 3 (DKIM 2):
Type: CNAME
Host: s2._domainkey.sap-technologies.com
Value: s2.domainkey.u######.wl###.sendgrid.net
```

**IMPORTANT:** Your actual values will be different! Copy them exactly as shown.

## Step 4: Check If You Already Started Domain Authentication

If you already see your domain listed under "Domain Authentication" section:

1. Look for: `sap-technologies.com`
2. Status will show:
   - ⏳ **Pending** = DNS records not added yet
   - ❌ **Failed** = DNS records incorrect
   - ✅ **Verified** = Already done! (if so, skip to Step 6)

3. Click the domain name or **"View DNS Records"** button
4. You'll see the 3 CNAME records you need to add

## Step 5: What to Look For

When you login to SendGrid, take a screenshot or copy these 3 values:

**Value 1 (em####):**
- Host starts with: `em` followed by numbers
- Example: `em1234.sap-technologies.com`

**Value 2 (s1._domainkey):**
- Host: `s1._domainkey.sap-technologies.com`

**Value 3 (s2._domainkey):**
- Host: `s2._domainkey.sap-technologies.com`

## Step 6: Add to Your DNS (Namecheap)

Once you have the 3 CNAME records from SendGrid:

1. Login to Namecheap
2. Go to Domain List → Manage sap-technologies.com
3. Click "Advanced DNS" tab
4. Click "Add New Record"

**For EACH of the 3 records:**

- **Type:** CNAME Record
- **Host:** [Just the subdomain part - e.g., "em1234" not "em1234.sap-technologies.com"]
- **Value:** [The full sendgrid.net address from SendGrid]
- **TTL:** Automatic

5. Click "Save All Changes"

---

## 🎯 Quick Action Items

**Right now, please:**

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Look at the **"Domain Authentication"** section (NOT "Link Branding")
3. Tell me what you see:
   - [ ] "Authenticate Your Domain" button (not started)
   - [ ] Your domain with "Pending" status (started but DNS not added)
   - [ ] Your domain with "Verified" status (already done!)

4. If you see DNS records, copy and share the 3 CNAME records so I can help you add them correctly

---

## 📝 Summary

**What you have now:**
- ✅ Link Branding: url5736.sap-technologies.com (makes links look professional)

**What you still need:**
- ❌ Domain Authentication: 3 additional CNAME records (makes emails go to inbox)

**These are DIFFERENT things!**
- Link Branding = Makes links in emails look professional
- Domain Authentication = Makes the email sender trusted (prevents spam)

You need BOTH for best results. You have the first one, now we need to add the second one.
