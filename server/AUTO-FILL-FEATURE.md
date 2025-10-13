# Auto-Fill Feature for Logged-In Users

## Overview
This feature automatically fills in user information (email, name, phone) for logged-in users when they interact with public endpoints like contact forms, newsletter subscriptions, product inquiries, service quotes, and partnership requests.

## Implementation Details

### How It Works
1. **Optional Authentication**: Uses `optionalAuthMiddleware` to detect logged-in users without requiring authentication
2. **Auto-Fill Logic**: Controllers check if `req.user` exists and auto-fill empty fields from the user's profile
3. **User Linking**: All submissions are linked to the user account via a `user` reference field
4. **Frontend Indication**: Responses include an `autoFilled: true` flag to inform the frontend

### Benefits
- **Better UX**: Logged-in users don't need to re-enter their information
- **User Tracking**: Know which user submitted each form
- **Personalization**: Can display user's previous submissions
- **Data Integrity**: Consistent user data across all submissions

## Updated Endpoints

### 1. Contact Form (`POST /api/contact`)
**Auto-filled fields:**
- `name` - From user's `firstName` + `lastName`
- `email` - From user's `email`

**Response includes:**
```json
{
  "status": "success",
  "autoFilled": true,
  "data": { ... }
}
```

### 2. Newsletter Subscription (`POST /api/newsletter/subscribe`)
**Auto-filled fields:**
- `email` - From user's `email`

**Response includes:**
```json
{
  "status": "success",
  "autoFilled": true,
  "message": "Thank you for subscribing to our newsletter!"
}
```

### 3. Product Inquiry (`POST /api/product-inquiries/inquiries`)
**Auto-filled fields:**
- `customerEmail` - From user's `email`
- `customerPhone` - From user's `phone`

**Response includes:**
```json
{
  "success": true,
  "autoFilled": true,
  "message": "Inquiry submitted successfully!"
}
```

### 4. Service Quote (`POST /api/service-quotes/quotes`)
**Auto-filled fields:**
- `customerName` - From user's `firstName` + `lastName`
- `customerEmail` - From user's `email`
- `customerPhone` - From user's `phone`

**Response includes:**
```json
{
  "success": true,
  "autoFilled": true,
  "message": "Quote request submitted successfully!"
}
```

### 5. Partnership Request (`POST /api/partnership-requests`)
**Auto-filled fields:**
- `contactEmail` - From user's `email`
- `contactPerson` - From user's `firstName` + `lastName`

**Response includes:**
```json
{
  "status": "success",
  "autoFilled": true,
  "message": "Partnership request submitted successfully"
}
```

## Database Changes

### Models Updated
All submission models now include a `user` reference field:

```javascript
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
}
```

**Updated Models:**
- `Contact.js`
- `Newsletter.js`
- `ProductInquiry.js`
- `ServiceQuote.js`
- `PartnershipRequest.js`

## Route Middleware

All public submission routes now use `optionalAuthMiddleware`:

```javascript
const { optionalAuthMiddleware } = require("../middleware/auth");

// Example
router.post("/", optionalAuthMiddleware, contactLimiter, validateContact, contactController.submitContact);
```

**Updated Routes:**
- `contactRoutes.js` - POST /
- `newsletterRoutes.js` - POST /subscribe
- `productInquiryRoutes.js` - POST /inquiries
- `serviceQuoteRoutes.js` - POST /quotes
- `partnershipRequestRoutes.js` - POST /

## Controller Pattern

All controllers follow this pattern:

```javascript
async submitForm(req, res) {
  let { email, name, phone } = req.body;
  
  // Auto-fill user data if logged in
  if (req.user) {
    email = email || req.user.email;
    name = name || `${req.user.firstName} ${req.user.lastName}`.trim();
    phone = phone || req.user.phone || "";
  }
  
  // Validation...
  
  const submission = new Model({
    email,
    name,
    phone,
    user: req.user ? req.user._id : null,
    // ... other fields
  });
  
  await submission.save();
  
  res.status(201).json({
    status: "success",
    autoFilled: !!req.user,
    data: { ... }
  });
}
```

## Frontend Implementation Guide

### Detecting Auto-Fill
Check the `autoFilled` flag in the response:

```javascript
const response = await fetch('/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Include auth token if available
  },
  body: JSON.stringify({
    message: 'Hello!'
    // email and name will be auto-filled if logged in
  })
});

const data = await response.json();
if (data.autoFilled) {
  console.log('User data was auto-filled!');
}
```

### Pre-Populating Forms
If user is logged in, pre-populate form fields:

```javascript
import { useAuth } from './contexts/AuthContext';

function ContactForm() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    message: ''
  });
  
  // Show indication that fields are auto-filled
  // Allow users to override values if needed
}
```

### Showing Auto-Fill Indicator
```javascript
{user && (
  <div className="auto-fill-notice">
    ✓ Using your account information
  </div>
)}
```

## Testing

### Manual Testing
1. **Guest User**: Submit forms without logging in - should work normally
2. **Logged-In User**: 
   - Submit form with empty email/name fields
   - Verify data is auto-filled from user profile
   - Check response includes `autoFilled: true`
   - Verify submission is linked to user in database

### Database Verification
```javascript
// Check if submission is linked to user
const contact = await Contact.findById(contactId).populate('user');
console.log(contact.user); // Should show user details
```

## Security Considerations

1. **Optional Authentication**: Users can still submit forms as guests
2. **Rate Limiting**: Applies to both logged-in and guest users
3. **Validation**: All fields are still validated even if auto-filled
4. **User Override**: Users can override auto-filled values if needed
5. **Privacy**: User reference field only visible to admins

## Backward Compatibility

- Guest users can still submit all forms normally
- Existing submissions without user reference continue to work
- Frontend doesn't need immediate updates (feature degrades gracefully)
- `autoFilled` flag is optional information for frontend

## Future Enhancements

1. **Form History**: Show user's previous submissions on their dashboard
2. **Quick Actions**: One-click subscribe/contact for logged-in users
3. **Smart Defaults**: Pre-fill company name from previous partnership requests
4. **Preference Memory**: Remember preferred contact method, budget ranges, etc.

## Files Modified

### Controllers (5 files)
- `server/src/controllers/contactController.js`
- `server/src/controllers/newsletterController.js`
- `server/src/controllers/productInquiryController.js`
- `server/src/controllers/serviceQuoteController.js`
- `server/src/controllers/partnershipRequestController.js`

### Models (5 files)
- `server/src/models/Contact.js`
- `server/src/models/Newsletter.js`
- `server/src/models/ProductInquiry.js`
- `server/src/models/ServiceQuote.js`
- `server/src/models/PartnershipRequest.js`

### Routes (5 files)
- `server/src/routes/contactRoutes.js`
- `server/src/routes/newsletterRoutes.js`
- `server/src/routes/productInquiryRoutes.js`
- `server/src/routes/serviceQuoteRoutes.js`
- `server/src/routes/partnershipRequestRoutes.js`

## Summary

This feature provides a seamless experience for logged-in users by:
- ✅ Auto-filling email, name, and phone from user profile
- ✅ Linking all submissions to user accounts
- ✅ Maintaining backward compatibility with guest users
- ✅ Providing frontend indication via `autoFilled` flag
- ✅ Supporting all public submission endpoints

The implementation is complete and ready for testing!
