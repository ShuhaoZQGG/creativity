# Meta App Review - Quick Reference

This is your one-page reference for all URLs and information needed for Meta App Review.

## Required URLs for Meta App Settings

Add these URLs in **Meta Developers Console** > **Your App** > **Settings** > **Basic**:

### 1. Privacy Policy URL ✅
```
https://your-app.vercel.app/privacy
```
**File:** `frontend/app/privacy/page.tsx`
**Guide:** `PRIVACY_POLICY_SETUP.md`

### 2. Data Deletion Instructions URL ✅ **REQUIRED**
```
https://your-app.vercel.app/data-deletion
```
**File:** `frontend/app/data-deletion/page.tsx`
**Guide:** `DATA_DELETION_SETUP.md`

### 3. Data Deletion Callback URL ✅
```
https://your-backend.railway.app/api/data-deletion/callback
```
**File:** `backend/src/routes/data-deletion.ts`
**Guide:** `DATA_DELETION_SETUP.md`

### 4. Terms of Service URL (Optional)
```
https://your-app.vercel.app/terms
```
**File:** `frontend/app/terms/page.tsx`

---

## Before Deploying - Customize These

### 1. Contact Emails

Replace placeholder emails in these files:

**Files to update:**
- `frontend/app/privacy/page.tsx` (line ~429)
- `frontend/app/terms/page.tsx` (line ~318)
- `frontend/app/data-deletion/page.tsx` (line ~184, ~353)

**Find:**
```
privacy@creativity-app.com
support@creativity-app.com
legal@creativity-app.com
```

**Replace with:**
```
your-email@your-domain.com
```

### 2. Jurisdiction (Terms Only)

**File:** `frontend/app/terms/page.tsx`

**Find:**
```
[Your Jurisdiction]
```

**Replace with:**
```
Delaware, United States
```
(or your actual jurisdiction)

---

## Deployment Checklist

### Step 1: Update Files
- [ ] Replace all placeholder emails with real emails
- [ ] Update jurisdiction in Terms of Service
- [ ] Set `META_MODE=dev` in `backend/.env`
- [ ] Set `FRONTEND_URL` in `backend/.env`

### Step 2: Test Locally
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit and test:
- [ ] http://localhost:3000/privacy
- [ ] http://localhost:3000/data-deletion
- [ ] http://localhost:3000/terms

### Step 3: Deploy

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (Railway/Render):**
```bash
cd backend
railway up
# or follow your hosting provider's instructions
```

### Step 4: Test Production URLs

Test in incognito mode:
- [ ] https://your-app.vercel.app/privacy (loads without login)
- [ ] https://your-app.vercel.app/data-deletion (loads without login)
- [ ] https://your-app.vercel.app/terms (loads without login)
- [ ] Data deletion form submits successfully
- [ ] All pages work on mobile

---

## Meta App Settings Configuration

### Where to Add URLs

1. Go to: [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Select your app
3. Navigate to: **Settings** > **Basic**
4. Scroll down to find each section

### Privacy Policy
**Location:** Settings > Basic > Privacy Policy URL
```
https://your-app.vercel.app/privacy
```

### User Data Deletion
**Location:** Settings > Basic > User Data Deletion

**Option:** Data Deletion Instructions URL (recommended)
```
https://your-app.vercel.app/data-deletion
```

**AND**

**Option:** Data Deletion Callback URL
```
https://your-backend.railway.app/api/data-deletion/callback
```

### App Domains
**Location:** Settings > Basic > App Domains
```
your-app.vercel.app
your-backend.railway.app
```

### Contact Email
**Location:** Settings > Basic > Contact Email
```
your-email@your-domain.com
```

---

## Permissions to Request

### Required Permissions for Your App

Go to: **App Review** > **Permissions and Features**

Request these three permissions:

#### 1. ads_management
**Use Case:**
```
We use ads_management to create and manage Facebook ad campaigns on behalf
of our users. Users can create A/B tests with multiple ad variants, and our
app creates campaigns, ad sets, and ads using the Marketing API.
```

#### 2. ads_read
**Use Case:**
```
We use ads_read to retrieve campaign performance data and display analytics
to users. This allows users to see campaign metrics like impressions, clicks,
CTR, and CPC.
```

#### 3. business_management
**Use Case:**
```
We use business_management to access the user's ad accounts. This is required
to create campaigns in the correct ad account and ensure proper business
context.
```

---

## Demo Video Requirements

### What to Show (1-3 minutes)

1. **Login Flow** (15-20 seconds)
   - Click "Connect Meta"
   - Show OAuth dialog
   - Grant permissions

2. **ads_management** (30 seconds)
   - Navigate to A/B Testing
   - Show campaign creation form
   - Explain how you create campaigns

3. **ads_read** (20 seconds)
   - Navigate to Analytics
   - Show performance metrics
   - Explain how you fetch data

4. **business_management** (15 seconds)
   - Show ad account selection
   - Explain how you access accounts

### Recording Tools
- [Loom](https://www.loom.com/) - Free, easy
- [OBS Studio](https://obsproject.com/) - Free, professional
- QuickTime (Mac) - Built-in

---

## Testing Your Setup

### Test Privacy Policy
```bash
curl https://your-app.vercel.app/privacy
# Should return HTML (status 200)
```

### Test Data Deletion Page
```bash
curl https://your-app.vercel.app/data-deletion
# Should return HTML (status 200)
```

### Test Data Deletion Callback
```bash
curl -X POST https://your-backend.railway.app/api/data-deletion/callback \
  -H "Content-Type: application/json" \
  -d '{"signed_request": "test.payload"}'

# Should return JSON with url and confirmation_code
```

### Test in Browser (Incognito)
- Visit all URLs in incognito mode
- Should load without requiring login
- Should display properly on mobile
- Forms should submit successfully

---

## Common Meta Rejection Reasons

### ❌ Privacy Policy URL not accessible
**Solution:** Deploy to production, test in incognito

### ❌ Data Deletion URL not accessible
**Solution:** Ensure page is public, no login required

### ❌ Callback URL doesn't work
**Solution:** Test with curl, check backend logs

### ❌ Broken demo video
**Solution:** Re-record, test link before submitting

### ❌ Use case not clear
**Solution:** Be specific, use templates in `META_APP_REVIEW_GUIDE.md`

---

## Timeline

| Day | Task | Duration |
|-----|------|----------|
| 1 | Update emails & deploy | 2-3 hours |
| 1 | Record demo video | 30-60 min |
| 1 | Submit for review | 15 min |
| 2-7 | Wait for Meta review | 3-5 days |
| 8 | Receive approval ✅ | - |
| 8 | Set `META_MODE=prod` | 5 min |

---

## Support Resources

### Documentation Created
- `PRIVACY_POLICY_SETUP.md` - Privacy policy deployment guide
- `DATA_DELETION_SETUP.md` - Data deletion setup guide
- `META_APP_REVIEW_GUIDE.md` - Complete app review walkthrough
- `META_OAUTH_SETUP.md` - OAuth integration guide

### Official Meta Resources
- [App Review Documentation](https://developers.facebook.com/docs/app-review)
- [Data Deletion Requirements](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- [Platform Policies](https://developers.facebook.com/docs/development/release/policies)
- [Meta Developer Community](https://developers.facebook.com/community/)

---

## Quick Command Reference

### Start Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Deploy
```bash
# Frontend
cd frontend && vercel --prod

# Backend
cd backend && railway up
```

### Test Endpoints
```bash
# Health check
curl https://your-backend.railway.app/health

# Data deletion callback
curl -X POST https://your-backend.railway.app/api/data-deletion/callback \
  -d '{"signed_request": "test"}'
```

---

## Final Checklist

Before submitting to Meta:

### Required URLs (All must be HTTPS and public)
- [ ] Privacy Policy URL added to Meta settings
- [ ] Data Deletion Instructions URL added to Meta settings
- [ ] Data Deletion Callback URL added to Meta settings
- [ ] All URLs tested in incognito mode
- [ ] All URLs work on mobile

### App Configuration
- [ ] App icon uploaded (1024x1024px)
- [ ] App name set
- [ ] Contact email set (and monitored)
- [ ] App domains configured
- [ ] Facebook Login product added
- [ ] Marketing API product added
- [ ] OAuth redirect URIs configured

### Content Ready
- [ ] Demo video recorded (1-3 minutes)
- [ ] Use cases written for all 3 permissions
- [ ] Step-by-step instructions written
- [ ] All placeholder text replaced

### Testing Complete
- [ ] App works in development mode
- [ ] All pages load without login
- [ ] Forms submit successfully
- [ ] OAuth flow works
- [ ] Data deletion form works

---

## What Happens Next

1. **Submission** - Submit review requests for all 3 permissions
2. **In Review** - Meta reviews (3-5 business days)
3. **Approval** - Receive email notification
4. **Production** - Update `META_MODE=prod` in `.env`
5. **Go Live** - App works for all users! 🎉

---

## Need Help?

If something doesn't work:

1. Check this guide first
2. Review the detailed guides:
   - `META_APP_REVIEW_GUIDE.md`
   - `DATA_DELETION_SETUP.md`
   - `PRIVACY_POLICY_SETUP.md`
3. Test locally before blaming deployment
4. Check Meta's error messages
5. Review Meta Developer Community

---

## Summary

You have everything you need:

✅ Privacy Policy (required)
✅ Data Deletion Page (required)
✅ Data Deletion Callback (required)
✅ Terms of Service (recommended)
✅ Backend API (handles deletions)
✅ Demo guides (for video creation)
✅ Use case templates (for review submission)

**Just:**
1. Update emails
2. Deploy
3. Add URLs to Meta
4. Record video
5. Submit!

Good luck! 🚀
