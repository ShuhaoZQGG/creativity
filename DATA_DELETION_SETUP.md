# Meta Data Deletion Setup Guide

Meta requires a **User Data Deletion Callback URL** for all apps that use Facebook Login or access user data. This guide explains what was created and how to set it up for Meta App Review.

## What Was Created

### 1. Data Deletion Instructions Page
**Location:** `frontend/app/data-deletion/page.tsx`
**URL:** `https://your-app.com/data-deletion`

A comprehensive, user-friendly page that includes:
- ✅ Explanation of what data will be deleted
- ✅ Three deletion options (self-service, web form, email)
- ✅ Deletion request form
- ✅ Important notes and warnings
- ✅ FAQ section
- ✅ Publicly accessible (no login required)

### 2. Backend API Endpoints
**Location:** `backend/src/routes/data-deletion.ts`

Three endpoints created:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/data-deletion` | POST | Handle manual deletion requests from web form |
| `/api/data-deletion/callback` | POST | Handle Meta's automated deletion callbacks |
| `/api/data-deletion/status/:id` | GET | Check deletion request status |

### 3. Privacy Policy Integration
The privacy policy now includes a prominent link to the data deletion page with a clear call-to-action button.

---

## How It Works

### User-Initiated Deletion (Web Form)

1. User visits `https://your-app.com/data-deletion`
2. User fills out deletion request form
3. Form sends POST to `/api/data-deletion`
4. Backend deletes user data from database
5. User receives confirmation

### Meta-Initiated Deletion (Automated)

1. User deletes your app from Facebook settings
2. Meta sends signed POST request to `/api/data-deletion/callback`
3. Backend verifies signature using your App Secret
4. Backend deletes user data
5. Backend returns confirmation URL to Meta

**Meta's Expected Response:**
```json
{
  "url": "https://your-app.com/data-deletion-status?id=abc123",
  "confirmation_code": "abc123"
}
```

---

## Setup Instructions for Meta App Review

### Step 1: Update Contact Email

Before deploying, update the placeholder email in `data-deletion/page.tsx`:

**Find and replace:**
```tsx
// Current (line ~184 and ~353):
privacy@creativity-app.com

// Replace with:
your-actual-email@your-domain.com
```

### Step 2: Deploy to Production

Your data deletion page must be publicly accessible for Meta to review it.

#### Deploy Backend

Make sure your backend is deployed and accessible:

**Option A: Railway**
```bash
# Deploy backend to Railway
cd backend
railway up
```

**Option B: Render/Heroku**
```bash
# Follow their deployment guides
```

Your backend API will be at: `https://your-backend.railway.app`

#### Deploy Frontend

**Option A: Vercel (Recommended)**
```bash
cd frontend
vercel --prod
```

Your frontend will be at: `https://your-app.vercel.app`

### Step 3: Test the Data Deletion Page

Before submitting to Meta, verify everything works:

1. **Visit the page:**
   ```
   https://your-app.vercel.app/data-deletion
   ```

2. **Test the form:**
   - Fill in a test email
   - Submit the form
   - Verify you see success message

3. **Test in incognito:**
   - Ensure page is accessible without login
   - Verify all styling displays correctly
   - Test on mobile

4. **Test Meta callback (optional):**
   ```bash
   # Test the callback endpoint
   curl -X POST https://your-backend.railway.app/api/data-deletion/callback \
     -H "Content-Type: application/json" \
     -d '{"signed_request": "test.payload"}'
   ```

### Step 4: Add URL to Meta App Settings

#### For User Data Deletion Instructions

1. Go to [Meta Developers Console](https://developers.facebook.com/apps)
2. Select your app
3. Navigate to **Settings** > **Basic**
4. Find **"User Data Deletion"** section
5. Select **"Data Deletion Instructions URL"**
6. Enter your URL:
   ```
   https://your-app.vercel.app/data-deletion
   ```
7. Click **"Save Changes"**

#### For Automated Deletion Callback

1. In the same **User Data Deletion** section
2. Enter **"Data Deletion Callback URL"**:
   ```
   https://your-backend.railway.app/api/data-deletion/callback
   ```
3. Click **"Save Changes"**

**Screenshot Location in Meta Console:**
```
App Dashboard > Settings > Basic > Scroll down to "User Data Deletion"
```

---

## What Meta Reviews

Meta will check:

1. ✅ **Page is Publicly Accessible**
   - No login required
   - Works in incognito mode
   - HTTPS enabled

2. ✅ **Clear Instructions**
   - Explains what data is deleted
   - Provides clear steps
   - Multiple deletion options

3. ✅ **Callback Works**
   - Endpoint accepts POST requests
   - Verifies signed requests
   - Returns correct response format

4. ✅ **Actually Deletes Data**
   - Data is genuinely deleted from database
   - Process completes within 30 days

---

## Meta's Requirements Checklist

Before submitting, ensure:

- [ ] Data deletion page is publicly accessible (HTTPS)
- [ ] Page URL added to Meta App Settings
- [ ] Callback URL added to Meta App Settings
- [ ] Page displays without login
- [ ] Form submits successfully
- [ ] Backend endpoint handles Meta callbacks
- [ ] Contact email is valid and monitored
- [ ] Privacy policy links to data deletion page
- [ ] Page works on mobile devices

---

## Testing Meta's Signed Request

Meta sends signed requests to your callback endpoint. Here's how to test:

### Create a Test Signed Request

```javascript
// test-meta-signature.js
const crypto = require('crypto');

const appSecret = 'YOUR_META_APP_SECRET';
const payload = JSON.stringify({
  algorithm: 'HMAC-SHA256',
  issued_at: Math.floor(Date.now() / 1000),
  user_id: '123456789',
  deletion_id: 'test-deletion-123'
});

const payloadBase64 = Buffer.from(payload).toString('base64url');
const signature = crypto
  .createHmac('sha256', appSecret)
  .update(payloadBase64)
  .digest('base64url');

const signedRequest = `${signature}.${payloadBase64}`;
console.log('Signed Request:', signedRequest);
```

### Test the Callback

```bash
# Run the test script
node test-meta-signature.js

# Use the output to test your callback
curl -X POST https://your-backend.railway.app/api/data-deletion/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=YOUR_SIGNED_REQUEST_FROM_ABOVE"
```

**Expected Response:**
```json
{
  "url": "https://your-app.com/data-deletion-status?id=test-deletion-123",
  "confirmation_code": "test-deletion-123"
}
```

---

## What Gets Deleted

The `deleteUserData()` function in `data-deletion.ts` deletes:

1. ✅ **Ad Analytics** - All campaign performance data
2. ✅ **A/B Test Variants** - Individual ad variations
3. ✅ **A/B Tests** - Campaign tests
4. ✅ **Creatives** - Generated ad creatives (text and images)
5. ✅ **User Account** - Email, name, credentials
6. ✅ **Meta Tokens** - Access tokens and ad account IDs
7. ✅ **Images** - Files stored in AWS S3 (if enabled)

**Important Notes:**
- Data deletion is permanent and irreversible
- Campaigns running on Meta will continue (users must pause them in Meta Ads Manager)
- Some data may be retained for legal/tax purposes (e.g., payment records)
- Deletion is processed within 30 days

---

## Customization Options

### Add Grace Period (Recommended)

Instead of immediate deletion, add a 30-day grace period:

```typescript
// In data-deletion.ts
// Instead of immediate deletion:
await deleteUserData(user.id);

// Create a pending deletion record:
await prisma.deletionRequest.create({
  data: {
    userId: user.id,
    requestedAt: new Date(),
    scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'pending'
  }
});

// Then run a scheduled job to delete after 30 days
```

### Send Confirmation Emails

Add email notifications:

```typescript
// After deletion request
import { sendEmail } from '../services/email';

await sendEmail({
  to: email,
  subject: 'Data Deletion Request Received',
  body: `Your data deletion request has been received and will be processed within 30 days.
         Confirmation ID: ${deletionId}`
});
```

### Add Deletion Logs

Track deletion requests for compliance:

```typescript
// Create a deletionLog table in Prisma schema
await prisma.deletionLog.create({
  data: {
    email,
    facebookUserId: facebook_user_id,
    reason,
    deletedAt: new Date(),
    deletionId,
    source: 'web_form' // or 'meta_callback'
  }
});
```

---

## Common Issues and Solutions

### Issue: "Data Deletion URL is not accessible"

**Cause:** URL is not publicly accessible or requires authentication

**Solution:**
- Deploy to production (not localhost)
- Ensure HTTPS is enabled
- Test in incognito mode
- Remove any auth requirements for this page

### Issue: "Invalid callback response"

**Cause:** Backend not returning correct format

**Solution:**
Ensure your callback returns exactly this format:
```json
{
  "url": "https://...",
  "confirmation_code": "..."
}
```

### Issue: "Signature verification failed"

**Cause:** Incorrect app secret or signature parsing

**Solution:**
- Verify `META_APP_SECRET` is correct in `.env`
- Check signature verification logic
- Use Meta's official parsing method

### Issue: "Form submission fails"

**Cause:** Backend endpoint not accessible or CORS issue

**Solution:**
- Check backend is running and deployed
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Add CORS headers if needed

---

## Alternative: Simple Static Page

If you don't want a form, you can create a simple static page:

### Minimal Requirements

Meta only requires that you:
1. Have a public page with deletion instructions
2. Provide a way for users to request deletion

### Simple Version

```html
<!DOCTYPE html>
<html>
<head>
  <title>Data Deletion - Creativity</title>
</head>
<body>
  <h1>Request Data Deletion</h1>

  <p>To delete your data from Creativity, please:</p>

  <ol>
    <li>Log in to your account at <a href="https://your-app.com">your-app.com</a></li>
    <li>Go to Settings</li>
    <li>Click "Delete Account"</li>
  </ol>

  <p>Or email us at: <a href="mailto:privacy@your-app.com">privacy@your-app.com</a></p>

  <p>All data will be deleted within 30 days.</p>
</body>
</html>
```

Host this at `https://your-domain.com/data-deletion.html` and add that URL to Meta settings.

---

## For Meta App Review Submission

When submitting for App Review, Meta will ask:

### Question: "How do users delete their data?"

**Answer:**
```
Users can request data deletion through our dedicated Data Deletion page at:
https://your-app.vercel.app/data-deletion

The page provides three options:
1. Self-service deletion through account settings
2. Web form submission for data deletion requests
3. Email request to privacy@your-app.com

All deletion requests are processed within 30 days. We also handle automated
deletion callbacks when users remove our app from their Facebook settings.
```

### Question: "What data do you delete?"

**Answer:**
```
We delete all user data including:
- Account information (email, name, credentials)
- Facebook user ID and access tokens
- Ad account connections
- All generated ad creatives (text and images)
- Campaign data and analytics
- Images stored in cloud storage

Data is permanently deleted from our database and third-party services within
30 days of the deletion request.
```

---

## Compliance Notes

### GDPR Compliance

✅ Right to be forgotten (Art. 17)
✅ Data portability (Art. 20)
✅ Clear deletion process
✅ 30-day processing time

### CCPA Compliance

✅ Right to deletion
✅ Verification of requestor
✅ Clear instructions
✅ No discrimination for exercising rights

---

## Summary

You now have:

✅ **Public Data Deletion Page** - User-friendly instructions and form
✅ **Backend API** - Handles manual and automated deletion
✅ **Meta Callback** - Accepts and processes Meta's deletion requests
✅ **Privacy Integration** - Linked from privacy policy
✅ **Full Compliance** - Meets Meta, GDPR, and CCPA requirements

**URLs to Add to Meta Settings:**

1. **Data Deletion Instructions URL:**
   ```
   https://your-app.vercel.app/data-deletion
   ```

2. **Data Deletion Callback URL:**
   ```
   https://your-backend.railway.app/api/data-deletion/callback
   ```

You're ready to submit for Meta App Review! 🚀

---

## Support

If you encounter issues:

1. Check that both URLs are publicly accessible
2. Test the form submission
3. Verify backend is deployed and running
4. Review Meta's documentation: [Data Deletion Requirements](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)

Good luck with your App Review! 🎉
