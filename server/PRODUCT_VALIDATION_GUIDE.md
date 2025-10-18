# Product Validation Troubleshooting Guide

## The Problem

When updating products, you're getting a "Validation failed" error (400 Bad Request). This is likely due to one of these issues:

1. **Invalid currency values** - Products with currencies not in the new expanded enum
2. **Field length violations** - Description too long or other field constraints
3. **JSON parsing errors** - Malformed data in technicalSpecs, features, tags, or price
4. **Image upload issues** - File too large or invalid format

## Recent Changes

### Server (Commit: d633ee8)
- ✅ Enhanced validation error handling in `productController.js`
- ✅ Now returns detailed field-level errors: `{ field: "...", message: "..." }`
- ✅ Better logging of Mongoose validation errors

### Frontend (Commit: 4ed6502)
- ✅ Enhanced `ProductForm.jsx` to display detailed validation errors
- ✅ Shows each failing field with its specific error message
- ✅ Better console logging of `error.response.data`

## How to Diagnose

### Step 1: Try Updating a Product
With the new changes deployed, when you try to update a product and it fails, you should now see:

**In the Browser Console:**
```javascript
❌ Product form error: Error: Validation failed
❌ Error response data: {
  status: "error",
  message: "Validation failed",
  errors: [
    { field: "price.currency", message: "USD is not a valid enum value for path `price.currency`" }
  ]
}
```

**In the Error Alert:**
```
Validation failed:

• price.currency: USD is not a valid enum value for path `price.currency`
• description: Description must be at least 50 characters
```

### Step 2: Check for Currency Issues
Run the diagnostic script to find products with invalid currencies:

```bash
cd server
node scripts/check-product-currencies.js
```

This will show:
- ✅ All currencies used in your database
- ❌ Products with invalid currency values
- 📊 Statistics of currency usage

### Step 3: Fix Currency Issues (if needed)

**Option A: Dry Run (Safe)**
```bash
node scripts/migrate-product-currencies.js
```
This shows what would be changed without actually changing anything.

**Option B: Apply Changes**
```bash
node scripts/migrate-product-currencies.js --apply
```
This will:
- 💾 Create a backup in `server/backups/`
- 🔄 Update products with invalid currencies to UGX (default)
- 📊 Show a summary of changes

**Option C: Manual Fix**
Update products one by one in the admin dashboard using the correct currency codes:
- UGX, USD, EUR, GBP (popular)
- KES, TZS, RWF, ZAR, NGN, GHS (African)
- CAD, AUD, JPY, CNY, INR, AED, SAR (other major)

## Valid Currency Codes

The Product model now accepts these 17 currencies:

```javascript
["UGX", "USD", "EUR", "GBP",           // Popular
 "KES", "TZS", "RWF", "ZAR", "NGN", "GHS",  // African
 "CAD", "AUD", "JPY", "CNY", "INR", "AED", "SAR"]  // Other Major
```

Default: **UGX** (Ugandan Shilling)

## Other Validation Rules

### Product Fields
- **name**: Required, min 3 characters, max 200 characters
- **shortDescription**: Required, min 10 characters, max 500 characters
- **technicalDescription**: Required, min 50 characters, max 5000 characters
- **category**: Required, must be valid category
- **price.amount**: Min 0 (no negative prices)
- **price.currency**: Must be one of the 17 valid currencies
- **price.type**: "fixed", "negotiable", or "contact-for-price"
- **image**: Optional (not required)
- **displayOrder**: Min 0

### Image Upload
- **Max size**: 10MB
- **Allowed types**: image/* (jpg, png, gif, webp, etc.)
- **Validation**: Client-side and server-side

## Checking Render Logs

To see detailed error messages on production:

1. Go to Render Dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for entries like:
   ```
   🔍 Validation error details: { ... }
   ❌ Product update error: ...
   ```

## Next Steps

1. **Try updating a product again** - You should now see detailed error messages
2. **Run the diagnostic script** - Check for currency issues
3. **Review the error details** - The error message will tell you exactly which field is failing
4. **Apply the fix** - Either migrate currencies or fix the specific validation issue

## Need More Help?

If you're still seeing generic "Validation failed" errors:
1. Check the browser console for `error.response.data`
2. Check Render logs for detailed validation errors
3. Share the specific field and error message for targeted help
