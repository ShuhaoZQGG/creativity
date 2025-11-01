# Meta Developer Setup Guide

This guide will help you set up your Meta (Facebook) Developer account to use the Ads Management API with this application.

## Prerequisites
- A Facebook account
- A Facebook Business Manager account (recommended)
- An ad account with ads_management access

---

## Step-by-Step Setup

### Step 1: Access Meta Developers Dashboard

1. Go to https://developers.facebook.com/
2. Log in with your Facebook account
3. Click **"My Apps"** in the top right

### Step 2: Create a New App (or Use Existing)

1. Click **"Create App"**
2. Select **"Business"** as the app type
3. Fill in app details:
   - **App Name**: "Creativity Ads Manager" (or your preferred name)
   - **App Contact Email**: Your email
   - **Business Account**: Select your business account (or create one)
4. Click **"Create App"**

### Step 3: Add Required Products

In your app dashboard's left sidebar:

1. Click **"Add Product"**
2. Find and click **"Set Up"** on:
   - **Marketing API** (REQUIRED - this enables ads_management and ads_read)
   - **Facebook Login** (REQUIRED - for OAuth authentication)

### Step 4: Configure Facebook Login

1. In the left sidebar, click **Facebook Login** → **Settings**
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:4000/api/meta/callback
   ```
   (Add your production URL when deploying)
3. Click **"Save Changes"**

### Step 5: Get Your App Credentials

1. In the left sidebar, click **Settings** → **Basic**
2. Copy these values:
   - **App ID** → This is your `META_APP_ID`
   - **App Secret** → Click "Show" and copy → This is your `META_APP_SECRET`

### Step 6: Add Yourself as a Developer/Tester

**CRITICAL**: For development, you must add your Facebook account:

1. In the left sidebar, click **Roles** → **Roles**
2. Under **"Administrators"** or **"Developers"**, click **"Add Administrators"** or **"Add Developers"**
3. Enter your Facebook username or User ID
4. Click **"Submit"**

**OR add yourself as a Test User:**
1. Click **Roles** → **Test Users**
2. Click **"Add"**
3. Create or add a test user

### Step 7: Connect Your Ad Account

1. In the left sidebar, click **Marketing API** → **Tools**
2. Click **"Ad Account"**
3. Click **"Add Ad Accounts"**
4. Select your ad account from the list
5. Grant the necessary permissions

### Step 8: Update Environment Variables

Update your `.env` file in the backend:

```env
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_REDIRECT_URI=http://localhost:4000/api/meta/callback
NODE_ENV=development
```

### Step 9: App Review (For Production Only)

**For Development**: You can skip this - the app works in Development Mode for accounts added as Admins/Developers/Testers.

**For Production** (when ready to launch):

1. In the left sidebar, click **App Review** → **Permissions and Features**
2. Request review for:
   - `ads_management`
   - `ads_read`
   - `business_management`
3. Provide:
   - Detailed use case explanation
   - Screen recordings of your app
   - Test credentials
4. Wait for Meta approval (can take 1-2 weeks)

---

## Troubleshooting

### Error: "Invalid Scopes: ads_management, ads_read"

**Cause**: Your Facebook account is not added as a Developer/Administrator of the app, OR the Marketing API product is not added.

**Solutions**:
1. Verify you added **Marketing API** product to your app
2. Add your Facebook account as Admin/Developer (Step 6 above)
3. Make sure your app is in **Development Mode** (Settings → Basic → App Mode)
4. Clear your browser cookies and try connecting again

### Error: "App Not Set Up"

**Cause**: Marketing API product not properly configured.

**Solution**:
1. Go to **Marketing API** → **Tools**
2. Complete the setup wizard
3. Connect at least one ad account

### Error: "Redirect URI Mismatch"

**Cause**: The callback URL doesn't match what's configured in Facebook Login settings.

**Solution**:
1. Check Facebook Login → Settings → Valid OAuth Redirect URIs
2. Ensure it exactly matches: `http://localhost:4000/api/meta/callback`
3. No trailing slash, no extra parameters

### Error: "The user must be an administrator, developer, or tester"

**Cause**: Your Facebook account is not added to the app's roles.

**Solution**:
1. Go to **Roles** → **Roles**
2. Add yourself as Administrator or Developer
3. Accept the invitation (check your Facebook notifications)

---

## Development Mode vs Live Mode

### Development Mode (Default)
- Only works for users with Admin/Developer/Tester roles
- No App Review required
- Perfect for testing
- Limited to 5 ad accounts

### Live Mode (Production)
- Requires App Review approval
- Works for all Facebook users
- Required for public release
- Can access any ad account user grants permission to

To switch modes:
1. Go to **Settings** → **Basic**
2. Toggle **"App Mode"** at the top
3. Note: You can only switch to Live after App Review approval

---

## Testing Your Setup

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In your frontend, click **"Connect Meta Account"**

3. You should see a Facebook login page with permissions:
   - Access your ads account
   - Manage your ads
   - Read your ad account information

4. Click **"Continue"** to authorize

5. You should be redirected back to your app with a success message

---

## Next Steps After Setup

Once connected, you can:
- Create A/B tests with your generated creatives
- View analytics and performance metrics
- Manage campaign status (pause/resume)
- Export analytics data

---

## Useful Links

- **Meta Developers**: https://developers.facebook.com/
- **Marketing API Docs**: https://developers.facebook.com/docs/marketing-apis
- **App Review**: https://developers.facebook.com/docs/app-review
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/ (for testing API calls)
- **Business Manager**: https://business.facebook.com/

---

## Common Development Setup

For local development, your typical setup:

1. **App Mode**: Development
2. **Your Role**: Administrator or Developer
3. **Products**: Facebook Login + Marketing API
4. **OAuth Redirect**: `http://localhost:4000/api/meta/callback`
5. **Ad Accounts**: At least one test ad account connected

This allows you to test all features without App Review!

---

## Questions or Issues?

If you encounter issues not covered here:
1. Check the Meta Developers Documentation
2. Review your app's error logs in the Meta dashboard
3. Use Graph API Explorer to test permissions manually
4. Ensure your Facebook account has proper ad account access in Business Manager
