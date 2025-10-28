# Meta (Facebook) Setup Guide

## Quick Links

- **Developer Console**: https://developers.facebook.com/apps
- **Business Manager**: https://business.facebook.com/
- **Marketing API Docs**: https://developers.facebook.com/docs/marketing-apis

## Step-by-Step Setup

### 1. Create Meta App

1. Go to https://developers.facebook.com/
2. Click "My Apps" > "Create App"
3. Select "Business" type
4. Name: `Creativity Ad Platform`
5. Add your email

### 2. Add Products

**Facebook Login**:
- Click "Set Up" on Facebook Login
- Platform: Web
- Site URL: `http://localhost:3001`

**Marketing API**:
- Click "Set Up" on Marketing API
- This enables programmatic ad creation

### 3. Get Credentials

Go to **Settings > Basic**:
- Copy **App ID** → `META_APP_ID`
- Reveal and copy **App Secret** → `META_APP_SECRET`

### 4. Configure OAuth

Go to **Facebook Login > Settings**:

Add to "Valid OAuth Redirect URIs":
```
http://localhost:3001/api/meta/callback
http://localhost:3000/dashboard
```

Add to "App Domains":
```
localhost
```

### 5. Update .env File

```env
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_REDIRECT_URI=http://localhost:3001/api/meta/callback
```

### 6. Create Test Ad Account

1. Go to https://business.facebook.com/
2. Create Business Manager account
3. Business Settings > Ad Accounts > Add > Create New
4. Set up with small test budget ($5)
5. Save the Ad Account ID (format: `act_123456789`)

## Testing the Integration

Once setup is complete, you can test:

1. Start your app: `npm run dev`
2. Login to your Creativity account
3. Go to Settings or Dashboard
4. Click "Connect Meta Account"
5. You'll be redirected to Facebook OAuth
6. Grant permissions
7. You'll be redirected back with connected account

## Permissions Required

For the app to work, you need these permissions:
- ✅ `ads_management` - Create and manage ads
- ✅ `ads_read` - Read ad performance data
- ✅ `business_management` - Access business accounts

## Development vs Production

### Development Mode (Current)
- Only you and test users can access
- Use test ad accounts
- No real money spent
- Perfect for building and testing

### Production Mode (Later)
- Submit app for App Review
- Request permissions
- Add Privacy Policy & Terms
- Wait for approval
- Switch app to "Live"

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Check that `http://localhost:3001/api/meta/callback` is in Valid OAuth Redirect URIs
- Make sure there are no typos or extra spaces

### "App Not Setup"
- Verify Facebook Login product is added
- Check that Marketing API is enabled

### "Invalid App ID"
- Double-check APP_ID in .env matches Settings > Basic
- No quotes around the ID in .env file

### "Can't Connect Ad Account"
- Make sure you have a Business Manager account
- Create at least one ad account
- Grant your app access to the ad account

## Important Notes

⚠️ **For Development**:
- Keep app in Development Mode
- Use test ad accounts only
- OAuth will only work for admin/test users

⚠️ **For Production**:
- Must complete App Review
- Need real business verification
- Privacy Policy required
- Can take 3-7 days for approval

## What You Can Do

Once connected, the Creativity platform can:
- ✅ Create ad campaigns on Meta (Facebook/Instagram)
- ✅ Upload ad creatives (images + text)
- ✅ Run A/B tests between creative variants
- ✅ Fetch campaign performance data (CTR, CPC, spend)
- ✅ Manage budgets and targeting

## Need Help?

- Meta Developer Docs: https://developers.facebook.com/docs/
- Marketing API Reference: https://developers.facebook.com/docs/marketing-api/reference
- Community Forum: https://developers.facebook.com/community/

## Optional: Add Test Users

If you want others to test before going live:

1. Go to **Roles > Test Users**
2. Click **"Add Test Users"**
3. Create test Facebook accounts
4. These users can connect to your app in Development Mode
