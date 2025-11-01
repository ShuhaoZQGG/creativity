# Privacy Policy Setup Guide

Your privacy policy has been created and is ready to use! Here's how to set it up for Meta App Review.

## What Was Created

### 1. Privacy Policy Page
**Location:** `frontend/app/privacy/page.tsx`

A fully-formatted, professional privacy policy page that includes:
- ✅ All required information for Meta App Review
- ✅ Detailed explanation of data collection and usage
- ✅ Third-party services disclosure (OpenAI, Anthropic, Meta, AWS, Stripe)
- ✅ Clear explanation of Meta API permissions usage
- ✅ User rights and data protection information
- ✅ GDPR-compliant privacy controls
- ✅ Contact information

### 2. Terms of Service Page
**Location:** `frontend/app/terms/page.tsx`

Professional terms of service covering:
- User agreements and acceptable use
- Meta integration responsibilities
- Payment and subscription terms
- Liability limitations

### 3. Markdown Reference
**Location:** `PRIVACY_POLICY.md`

Text version for reference or hosting elsewhere if needed.

---

## Setup Instructions

### Step 1: Verify Pages Are Accessible

1. **Start your frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Visit the privacy policy**:
   ```
   http://localhost:3000/privacy
   ```

3. **Visit terms of service**:
   ```
   http://localhost:3000/terms
   ```

4. **Verify everything displays correctly**

### Step 2: Deploy to Production (Before App Review)

You need to deploy your app so Meta can access your privacy policy.

#### Option A: Deploy to Vercel (Recommended - Free)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add privacy policy and terms of service"
   git push
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Set root directory to `frontend`
   - Click "Deploy"

3. **Your Privacy Policy URL**:
   ```
   https://your-app-name.vercel.app/privacy
   ```

#### Option B: Deploy to Netlify

1. **Build your app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `frontend/out` folder
   - Or connect your GitHub repository

3. **Your Privacy Policy URL**:
   ```
   https://your-app-name.netlify.app/privacy
   ```

### Step 3: Add Privacy Policy URL to Meta App

1. **Go to Meta Developers Console**:
   - Visit [developers.facebook.com/apps](https://developers.facebook.com/apps)
   - Select your app

2. **Add Privacy Policy URL**:
   - Navigate to **Settings** > **Basic**
   - Find "Privacy Policy URL" field
   - Enter your deployed URL:
     ```
     https://your-app-name.vercel.app/privacy
     ```
   - Click "Save Changes"

3. **Verify it works**:
   - Click the link to make sure it opens
   - Meta will check this during App Review

---

## Customization Needed

Before deploying, customize these sections:

### 1. Contact Emails

Update these placeholder emails in both `privacy/page.tsx` and `terms/page.tsx`:

**Current (placeholders):**
- `privacy@creativity-app.com`
- `support@creativity-app.com`
- `legal@creativity-app.com`

**Change to your real emails:**
```tsx
// In frontend/app/privacy/page.tsx (line ~429)
<a href="mailto:YOUR-EMAIL@YOUR-DOMAIN.com">
  YOUR-EMAIL@YOUR-DOMAIN.com
</a>

// In frontend/app/terms/page.tsx (similar location)
<a href="mailto:YOUR-EMAIL@YOUR-DOMAIN.com">
  YOUR-EMAIL@YOUR-DOMAIN.com
</a>
```

### 2. Jurisdiction (Terms of Service)

Update the governing law section in `terms/page.tsx`:

**Current:**
```tsx
These Terms are governed by the laws of [Your Jurisdiction].
```

**Change to:**
```tsx
These Terms are governed by the laws of Delaware, United States.
// Or your actual jurisdiction
```

### 3. Company Name (Optional)

If you want to use your actual company name instead of "Creativity":

**Find and replace in both files:**
- Search for: `"Creativity"` or `Creativity`
- Replace with: `Your Company Name, Inc.`

---

## For Meta App Review Submission

When submitting for App Review, use this information:

### Privacy Policy URL
```
https://your-deployed-app.vercel.app/privacy
```

### Terms of Service URL (Optional but Recommended)
```
https://your-deployed-app.vercel.app/terms
```

### What Reviewers Will See

The privacy policy clearly shows:

1. ✅ **What data you collect from Meta**
   - User profile information
   - Ad account details
   - Campaign performance data

2. ✅ **How you use Meta API permissions**
   - `ads_management` - Create and manage campaigns
   - `ads_read` - Retrieve performance analytics
   - `business_management` - Access ad accounts

3. ✅ **Third-party services**
   - Lists all AI providers (OpenAI, Anthropic, Stability AI)
   - Meta Marketing API usage
   - AWS S3 for storage
   - Stripe for payments

4. ✅ **User rights**
   - How to access data
   - How to delete data
   - How to revoke permissions

5. ✅ **Data security**
   - Encryption methods
   - Storage locations
   - Retention policies

---

## Quick Deployment Checklist

Before deploying for App Review:

- [ ] Updated contact emails to real addresses
- [ ] Updated jurisdiction in Terms of Service
- [ ] Tested privacy policy page locally (http://localhost:3000/privacy)
- [ ] Tested terms page locally (http://localhost:3000/terms)
- [ ] Deployed frontend to Vercel/Netlify
- [ ] Verified privacy policy URL is publicly accessible
- [ ] Added Privacy Policy URL in Meta App Settings
- [ ] Privacy policy link works and displays correctly
- [ ] No placeholder text remains (like [Your Jurisdiction])

---

## Testing the Privacy Policy

### Test Locally
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/privacy
```

### Test After Deployment
```bash
# Visit your deployed URL
curl https://your-app.vercel.app/privacy
# Should return HTML (not an error)
```

### Verify Meta Can Access It
1. Open your privacy policy URL in incognito mode
2. Should be accessible without login
3. Should display full content
4. Should be mobile-responsive

---

## Common Issues

### Issue: 404 Error on /privacy

**Cause:** Next.js routing not set up correctly

**Solution:**
- Make sure file is at `frontend/app/privacy/page.tsx` (not `pages/privacy.tsx`)
- Using Next.js 13+ App Router
- Restart dev server after creating the file

### Issue: Meta says "Invalid Privacy Policy URL"

**Possible causes:**
- URL is not publicly accessible (requires login)
- URL returns 404 or error
- URL is localhost (must be deployed)
- HTTPS not enabled

**Solution:**
- Deploy to Vercel/Netlify (they provide HTTPS automatically)
- Test URL in incognito mode
- Make sure it's accessible without authentication

### Issue: Privacy Policy looks broken/unstyled

**Cause:** Missing Tailwind CSS or component library

**Solution:**
- Make sure you have `@/components/ui/button` and `@/components/ui/card` installed
- These should already exist in your project
- If not, check your Tailwind and shadcn/ui setup

---

## Alternative: Host Privacy Policy Elsewhere

If you prefer not to host on your app:

### Option 1: GitHub Pages
1. Create a simple HTML file from `PRIVACY_POLICY.md`
2. Host on GitHub Pages (free)
3. URL: `https://username.github.io/repo/privacy.html`

### Option 2: Privacy Policy Hosting Services
- [Termly](https://termly.io) - Free hosting
- [iubenda](https://www.iubenda.com) - Professional service
- [PrivacyPolicies.com](https://www.privacypolicies.com) - Free generator with hosting

### Option 3: Google Docs (Quick Fix)
1. Copy `PRIVACY_POLICY.md` to Google Doc
2. File > Publish to web
3. Get public URL
4. Use in Meta App Settings

---

## Summary

You now have:

✅ **Professional Privacy Policy** - Ready for Meta App Review
✅ **Terms of Service** - Professional legal coverage
✅ **Next.js Pages** - Integrated into your app
✅ **Markdown Reference** - Easy to read/edit

**Next Steps:**

1. Update contact emails
2. Deploy to Vercel (5 minutes)
3. Add URL to Meta App Settings
4. Submit for App Review

The privacy policy includes everything Meta requires and is written in clear, user-friendly language. You're ready to submit for App Review! 🚀

---

## Need Help?

If you encounter issues:

1. **Check the pages work locally first** (`npm run dev`)
2. **Verify deployment is successful** (visit the URL)
3. **Test in incognito mode** (ensure no auth required)
4. **Check Meta's requirements**: [Meta Privacy Policy Guidelines](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-privacy)

Good luck with your App Review! 🎉
