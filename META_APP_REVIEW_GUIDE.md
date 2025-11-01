# Meta App Review Submission Guide

This guide walks you through the complete process of submitting your app for Meta App Review to get the required permissions: `ads_management`, `ads_read`, and `business_management`.

## Prerequisites

Before submitting for review, ensure you have:

- ✅ A Meta Developer account
- ✅ A Meta App created and configured
- ✅ Your app fully functional in development mode
- ✅ A publicly accessible demo version of your app (or demo video)
- ✅ Privacy Policy URL
- ✅ Terms of Service URL (optional but recommended)
- ✅ Valid business use case

---

## Step-by-Step Submission Process

### Step 1: Prepare Your App

#### 1.1 Complete App Basic Settings

1. Go to [Meta Developers](https://developers.facebook.com/apps)
2. Select your app
3. Navigate to **Settings** > **Basic**
4. Fill in all required fields:
   - **App Name**: Your app's public name
   - **App Icon**: Square image, at least 1024x1024px
   - **Privacy Policy URL**: Required! (see section below)
   - **User Data Deletion**: Required! (see DATA_DELETION_SETUP.md)
   - **Terms of Service URL**: Recommended
   - **App Domain**: Your production domain (e.g., `yourdomain.com`)
   - **Category**: Choose "Business and Pages" or relevant category
   - **Contact Email**: Valid email for Meta to reach you

#### 1.2 Configure Facebook Login

1. Go to **Products** > **Facebook Login** > **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/api/meta/callback
   https://app.yourdomain.com/api/meta/callback
   ```
3. Enable **Client OAuth Login**: ON
4. Enable **Web OAuth Login**: ON

#### 1.3 Add Marketing API Product

1. Go to **Add Products**
2. Click **Set Up** on **Marketing API**
3. Accept the terms and conditions

---

### Step 2: Create Privacy Policy

Meta requires a valid Privacy Policy URL. Here's what it must include:

#### Required Elements:

1. **Data Collection**
   - What user data you collect (email, Facebook ID, ad account info)
   - How you collect it (OAuth, API calls)

2. **Data Usage**
   - How you use the data (creating ad campaigns, analytics)
   - Who has access to the data

3. **Data Storage**
   - Where data is stored (your database, cloud provider)
   - How long you retain it

4. **User Rights**
   - How users can access their data
   - How users can delete their data
   - How to contact you

5. **Third-Party Sharing**
   - What data you share with Meta
   - What data you share with other services

#### Quick Privacy Policy Options:

**Option A: Use a Generator**
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [Termly](https://termly.io/products/privacy-policy-generator/)

**Option B: Host a Simple Policy**
Create a file at `frontend/app/privacy/page.tsx` or host on your domain.

**Example Template:**
```markdown
# Privacy Policy for [Your App Name]

Last Updated: [Date]

## What Data We Collect
- Facebook user ID and email (via Facebook Login)
- Meta ad account information
- Campaign and ad performance data

## How We Use Your Data
- To create and manage ad campaigns on your behalf
- To provide analytics and A/B testing features
- To improve our services

## Data Storage
- Data is stored securely in our database
- We use industry-standard encryption

## Your Rights
- You can request data deletion at any time
- Contact us at [your-email]

## Contact
Email: [your-email]
```

---

### Step 3: Prepare Demo Materials

You need to show Meta exactly how you'll use the requested permissions.

#### Option A: Demo Video (Recommended)

**What to Record:**

1. **Introduction (5-10 seconds)**
   - Show your app's name and purpose

2. **Login Flow (15-20 seconds)**
   - Click "Connect Meta"
   - Show Facebook OAuth dialog
   - Show permission request screen
   - Complete login

3. **Permission Usage (30-45 seconds)**

   For `ads_management`:
   - Navigate to A/B testing page
   - Show campaign creation form
   - Fill in details (don't submit)
   - Explain: "We use ads_management to create campaigns on behalf of users"

   For `ads_read`:
   - Navigate to analytics page
   - Show where ad data would appear
   - Explain: "We use ads_read to show campaign performance"

   For `business_management`:
   - Show ad account selection
   - Explain: "We use business_management to access user's ad accounts"

4. **End (5 seconds)**
   - Thank you message

**Recording Tools:**
- [Loom](https://www.loom.com/) - Free, easy screen recording
- [OBS Studio](https://obsproject.com/) - Free, professional
- QuickTime (Mac) - Built-in screen recording
- Windows Game Bar (Windows) - Press Win+G

**Video Requirements:**
- Length: 1-3 minutes
- Format: MP4, MOV, or upload to YouTube (unlisted)
- Quality: 720p minimum
- Audio: Explain what you're doing (optional but helpful)

#### Option B: Live Demo (Alternative)

Deploy your app to a public URL:
- Use Vercel, Netlify, or similar for frontend
- Use Railway, Render, or similar for backend
- Ensure it's accessible without authentication (or provide test credentials)

---

### Step 4: Submit for Review

#### 4.1 Start Review Submission

1. Go to **App Review** > **Permissions and Features**
2. Find the permissions you need:
   - `ads_management`
   - `ads_read`
   - `business_management`

#### 4.2 Request Each Permission

For **each permission**, click **Request** and fill out:

##### ads_management

**1. How is your app using this permission?**
```
Our app uses ads_management to create and manage Facebook ad campaigns on behalf
of our users. Users can create A/B tests with multiple ad variants, and our app
automatically creates campaigns, ad sets, and ads using the Marketing API.

Specifically, we use this permission to:
- Create campaigns via the Marketing API
- Create ad sets with targeting and budget
- Create ad creatives with user-generated content
- Update campaign status (pause/resume)
```

**2. Step-by-step instructions:**
```
1. User logs into our app and navigates to Dashboard
2. User clicks "Connect Meta" to authorize our app
3. User grants ads_management permission
4. User navigates to "A/B Testing" page
5. User selects 2 or more creative variants to test
6. User sets budget, audience, and duration
7. User clicks "Create A/B Test"
8. Our app creates a campaign, ad set, and individual ads using the Marketing API
9. User can pause/resume campaigns from the Analytics page
```

**3. Attach demo video or provide demo URL**
- Upload your video or paste YouTube link

##### ads_read

**1. How is your app using this permission?**
```
Our app uses ads_read to retrieve campaign performance data and display analytics
to users. This allows users to see how their A/B tests are performing and make
data-driven decisions.

Specifically, we use this permission to:
- Fetch campaign insights (impressions, clicks, CTR, CPC)
- Display ad performance metrics in our Analytics dashboard
- Track A/B test results and determine winning variants
```

**2. Step-by-step instructions:**
```
1. User has connected their Meta account with ads_read permission
2. User navigates to "Analytics" page
3. Our app fetches campaign insights using the Marketing API
4. User sees performance data for all running campaigns
5. User can view detailed metrics for each A/B test variant
6. User can compare performance across different creatives
```

**3. Attach demo video or provide demo URL**
- Same video as above (showing analytics section)

##### business_management

**1. How is your app using this permission?**
```
Our app uses business_management to access the user's ad accounts and business
information. This is required to create campaigns in the correct ad account and
ensure users can manage their business assets.

Specifically, we use this permission to:
- Retrieve user's ad account list
- Access ad account details
- Ensure campaigns are created in the correct business context
```

**2. Step-by-step instructions:**
```
1. User clicks "Connect Meta" in our app
2. User grants business_management permission
3. Our app retrieves the user's ad accounts using /me/adaccounts endpoint
4. User selects which ad account to use for campaigns
5. All subsequent campaigns are created in the selected ad account
```

**3. Attach demo video or provide demo URL**
- Same video (showing account selection)

---

### Step 5: Submit and Wait

1. Review all information
2. Click **Submit for Review**
3. Meta will review your submission (typically 3-5 business days, can take up to 14 days)
4. You'll receive email updates on the status

---

## Tips for Approval

### Do's ✅

1. **Be Specific**: Clearly explain exactly how you use each permission
2. **Show, Don't Tell**: Video demonstrations are very helpful
3. **Match Your Use Case**: Your demo should match your written description exactly
4. **Test Everything**: Ensure your demo works perfectly before submitting
5. **Be Professional**: Use proper grammar, clear explanations
6. **Provide Context**: Explain the business value to users
7. **Follow Guidelines**: Read [Meta's Platform Policy](https://developers.facebook.com/docs/development/release/policies)

### Don'ts ❌

1. **Don't Be Vague**: "We need this for our app" is not enough
2. **Don't Request Unnecessary Permissions**: Only ask for what you actually use
3. **Don't Use Generic Descriptions**: Customize for your specific app
4. **Don't Submit Broken Demos**: Test your video/demo multiple times
5. **Don't Ignore Privacy**: Must have a valid privacy policy
6. **Don't Rush**: Take time to prepare quality submission

---

## Common Rejection Reasons

### 1. Insufficient Use Case Explanation
**Problem**: Description too vague or generic
**Solution**: Provide specific, detailed explanation with examples

### 2. Demo Doesn't Match Description
**Problem**: Video shows different features than described
**Solution**: Ensure demo shows exact features you described

### 3. Missing Privacy Policy
**Problem**: No privacy policy URL or invalid link
**Solution**: Create and host a proper privacy policy

### 4. Broken Demo
**Problem**: Demo video doesn't work or URL is broken
**Solution**: Test everything before submitting

### 5. Not Actually Using Permission
**Problem**: App doesn't clearly demonstrate permission usage
**Solution**: Show clear, obvious use of the permission in demo

---

## During Review

### What Meta Reviews

1. **Privacy Policy Compliance**
2. **Actual Permission Usage** (do you really need it?)
3. **User Data Handling**
4. **Platform Policy Compliance**
5. **Demo Quality and Accuracy**

### Timeline

- **Submission**: Instant
- **In Review**: 3-5 business days (typically)
- **Maximum**: Up to 14 days
- **Weekends/Holidays**: Review pauses

### Checking Status

1. Go to **App Review** > **Permissions and Features**
2. Check status for each permission:
   - **In Review** 🟡 - Being reviewed
   - **Approved** 🟢 - Ready to use
   - **Rejected** 🔴 - Need to resubmit

---

## If Rejected

### Steps to Take

1. **Read Rejection Reason**
   - Check email from Meta
   - Check App Review dashboard

2. **Fix Issues**
   - Address specific concerns mentioned
   - Improve demo if needed
   - Clarify use case description

3. **Resubmit**
   - Can resubmit immediately
   - Make sure to address all concerns

### Appeal Process

If you believe rejection was in error:
1. Go to App Review dashboard
2. Click on rejected permission
3. Click **Appeal** or **Resubmit**
4. Provide additional context

---

## After Approval

### 1. Update Environment

```bash
# In backend/.env
META_MODE=prod
```

### 2. Restart Backend

```bash
cd backend
npm run dev
# or for production:
npm start
```

### 3. Test in Production

1. Try connecting with a non-admin user
2. Verify all permissions are granted
3. Test creating a campaign
4. Check analytics data

### 4. Monitor Usage

1. Go to **App Dashboard** in Meta Developer Console
2. Monitor API usage and errors
3. Check for any policy violations

---

## Alternative: Business Verification

For some use cases, you may also need **Business Verification**:

### When Required

- High API usage
- Certain advanced features
- Business-related apps

### How to Verify

1. Go to **Settings** > **Business Verification**
2. Provide:
   - Business documents (articles of incorporation, tax ID)
   - Business phone number
   - Business email
   - Business website
3. Wait for verification (can take several days)

---

## Quick Checklist

Before submitting, ensure you have:

- [ ] App icon uploaded (1024x1024px)
- [ ] Privacy Policy URL added and accessible
- [ ] Data Deletion URL added and accessible (REQUIRED!)
- [ ] Data Deletion Callback URL configured (for automated deletions)
- [ ] App domain configured
- [ ] Contact email set
- [ ] Facebook Login configured with correct redirect URIs
- [ ] Marketing API product added
- [ ] Demo video created (1-3 minutes)
- [ ] Clear use case written for each permission
- [ ] Step-by-step instructions written
- [ ] App tested in development mode
- [ ] All features working as described

---

## Resources

### Official Documentation
- [App Review Documentation](https://developers.facebook.com/docs/app-review)
- [Platform Policies](https://developers.facebook.com/docs/development/release/policies)
- [Marketing API Permissions](https://developers.facebook.com/docs/marketing-api/overview/authorization)

### Support
- [Meta Developer Community](https://developers.facebook.com/community/)
- [Meta Business Help Center](https://www.facebook.com/business/help)

### Tools
- [Loom for Screen Recording](https://www.loom.com/)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [Meta App Review Checklist](https://developers.facebook.com/docs/app-review/resources)

---

## Example Timeline

**Day 1**: Prepare demo video and privacy policy
**Day 2**: Fill out review forms and submit
**Day 3-7**: Wait for Meta review (check email daily)
**Day 8**: Receive approval ✅
**Day 8**: Update `META_MODE=prod` and deploy
**Day 8**: Test with real users

---

## Need Help?

If you're stuck at any step:

1. **Check Meta's Documentation**: Most questions are answered there
2. **Developer Community**: Post in Meta Developer forums
3. **Review Examples**: Look at approved apps for reference
4. **Contact Meta Support**: Use the Help button in Developer Console

---

## Summary

The App Review process might seem daunting, but it's straightforward if you:

1. ✅ Have a clear, legitimate use case
2. ✅ Create a good demo video showing permission usage
3. ✅ Write detailed, specific descriptions
4. ✅ Have all required documentation (privacy policy)
5. ✅ Test everything before submitting

**Good luck with your submission! 🚀**

Most apps that clearly demonstrate proper permission usage get approved within 3-5 business days.
