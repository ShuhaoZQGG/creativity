# Meta (Facebook) OAuth Setup Guide

This guide explains how to set up and use the Meta OAuth integration with your app in both development and production modes.

## Problem: Permission Errors in Development

When trying to use Meta's Ads API in development mode, you may encounter this error:

```
Invalid Scopes: ads_management, ads_read, business_management
```

This happens because these advanced permissions require **App Review** from Meta, even in development mode.

## Solution: Dual-Mode OAuth

We've implemented a dual-mode OAuth system that allows you to:

1. **Development Mode**: Use basic Facebook Login with limited permissions (works immediately)
2. **Production Mode**: Use full Ads API permissions (requires App Review)

---

## Setup Instructions

### 1. Update Environment Variables

Add the following to your `backend/.env` file:

```bash
# Meta (Facebook)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3001/api/meta/callback
META_MODE=dev  # 'dev' for development, 'prod' for production
FRONTEND_URL=http://localhost:3000
```

### 2. Configure Your Meta App

#### For Development Mode:

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create or select your app
3. Add your app administrators/testers:
   - Go to **Roles** > **Roles**
   - Add yourself and any testers as **Administrators** or **Developers**
4. Configure **Facebook Login**:
   - Go to **Products** > **Facebook Login** > **Settings**
   - Add valid OAuth redirect URIs:
     - `http://localhost:3001/api/meta/callback`
     - `http://localhost:3000/dashboard` (optional)

#### For Production Mode:

1. Complete all development mode steps above
2. Submit your app for **App Review**:
   - Go to **App Review** > **Permissions and Features**
   - Request review for:
     - `ads_management` - Create and manage ad campaigns
     - `ads_read` - Read ad performance data
     - `business_management` - Access business accounts
3. Provide detailed use case and demo video
4. Once approved, set `META_MODE=prod` in your `.env` file

---

## How It Works

### Development Mode (`META_MODE=dev`)

**Available Scopes:**
- `public_profile` - Basic profile info
- `email` - User's email address
- `ads_read` - Read-only ads access (only for app admins/testers)

**What You Can Do:**
- Test Facebook Login integration
- View basic profile information
- Read ad data (if you're an app admin/developer/tester)

**Limitations:**
- Cannot create or manage ad campaigns
- Only works for users added as app admins/developers/testers
- No access to business management features

### Production Mode (`META_MODE=prod`)

**Available Scopes (requires App Review):**
- `ads_management` - Full ads management
- `ads_read` - Read ads data
- `business_management` - Manage business accounts

**What You Can Do:**
- Full access to create and manage ad campaigns
- Run A/B tests with real campaigns
- Access all business and ad account features
- Works for all users (not just app administrators)

---

## Using the Integration

### Two Connection Options

The dashboard now provides two ways to connect:

#### 1. "Connect Meta (Dev)" / "Connect Meta Ads"
- Uses mode-specific scopes (basic in dev, full in prod)
- Best for: Testing the full integration flow

#### 2. "Login with Facebook"
- Always uses basic permissions only (`public_profile`, `email`)
- Best for: Simple Facebook authentication
- Always works without App Review

### Connection States

The dashboard will show different states based on your connection:

1. **Not Connected** (Orange indicator)
   - Shows both connection buttons
   - Prompts you to connect

2. **Facebook Connected** (Blue indicator)
   - Basic permissions granted
   - Shows message about needing App Review for ads features
   - Displays helpful information about required permissions

3. **Meta Ads Connected** (Green indicator)
   - Full ads access granted
   - Shows links to A/B Testing and Analytics
   - You can create campaigns and run tests

---

## Testing in Development Mode

### As an App Administrator:

1. Make sure you're added as an Administrator/Developer in your Meta app
2. Set `META_MODE=dev` in `backend/.env`
3. Click "Connect Meta (Dev)" on the dashboard
4. Approve the basic permissions
5. You should see "Facebook Connected" status

### Expected Behavior:

- ✅ Facebook login works
- ✅ Can retrieve basic profile info
- ✅ Can read ad data (if you have an ad account)
- ❌ Cannot create campaigns (requires App Review)
- ❌ Other users cannot connect (not added as testers)

---

## Error Handling

### Common Errors and Solutions

#### "Invalid Scopes" Error
**Cause:** Trying to request permissions that require App Review
**Solution:**
- Set `META_MODE=dev` in your `.env`
- Restart your backend server
- Use "Login with Facebook" instead

#### "No ad accounts found"
**Cause:** User doesn't have any ad accounts associated with their Facebook account
**Solution:**
- Create an ad account in [Meta Business Suite](https://business.facebook.com)
- Or continue with basic Facebook login

#### Callback redirect fails
**Cause:** Incorrect redirect URI configuration
**Solution:**
- Check that `META_REDIRECT_URI` matches exactly in your Meta app settings
- Ensure `FRONTEND_URL` is set correctly
- Make sure both backend and frontend are running

---

## API Endpoints

### Backend Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/login` | GET | Start basic Facebook login (always uses basic permissions) |
| `/api/meta/connect` | GET | Start OAuth flow (uses mode-specific scopes) |
| `/api/meta/callback` | GET | OAuth callback handler (handles both modes) |
| `/api/meta/status` | GET | Check connection status and permissions |

### Status Response

```json
{
  "connected": true,           // Has any Meta connection
  "ads_access": false,         // Has full ads permissions
  "ad_account_id": "act_123",  // Ad account ID (null if no ads access)
  "mode": "development",       // Current mode (development/production)
  "message": "Connected with basic permissions only. Ads features require App Review."
}
```

---

## Transitioning to Production

When you're ready to go to production:

1. **Submit for App Review**
   - Prepare detailed use case documentation
   - Create a demo video showing your app's functionality
   - Submit review requests for required permissions

2. **Update Configuration**
   ```bash
   META_MODE=prod
   ```

3. **Update Redirect URIs**
   - Add your production domain to Meta app settings
   - Update `META_REDIRECT_URI` and `FRONTEND_URL` for production

4. **Test with Real Users**
   - Have non-admin users test the connection
   - Verify all permissions are granted correctly

---

## Troubleshooting

### Check Your Configuration

```bash
# Backend
cd backend
cat .env | grep META

# Should show:
# META_APP_ID=your_app_id
# META_APP_SECRET=your_secret
# META_REDIRECT_URI=http://localhost:3001/api/meta/callback
# META_MODE=dev
# FRONTEND_URL=http://localhost:3000
```

### Verify Meta App Settings

1. **App Mode**: Should be in "Development" mode for testing
2. **OAuth Redirect URIs**: Must include your callback URL exactly
3. **App Roles**: You must be listed as Admin/Developer/Tester
4. **Facebook Login**: Must be added as a product

### Test the Integration

1. Clear browser cookies for facebook.com
2. Try "Login with Facebook" first (should always work)
3. Check Network tab in DevTools for any API errors
4. Check backend console for detailed error messages

---

## Security Notes

- Never commit `.env` files to version control
- Keep `META_APP_SECRET` confidential
- Use HTTPS in production
- Validate all OAuth callbacks on the backend
- Store access tokens securely (currently in database)
- Consider implementing token refresh logic for long-lived tokens

---

## Resources

- [Meta App Review Documentation](https://developers.facebook.com/docs/app-review)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Available Permissions](https://developers.facebook.com/docs/permissions/reference)

---

## Support

If you continue to experience issues:

1. Check the backend console for detailed error messages
2. Verify your Meta app configuration
3. Ensure you're added as an app administrator
4. Try the basic "Login with Facebook" option first
5. Review the [Meta Community Forum](https://developers.facebook.com/community/)

---

## Summary

✅ **Development Mode**: Basic Facebook login works immediately, perfect for testing
✅ **Production Mode**: Full ads access after App Review approval
✅ **Dual Options**: Choose between full OAuth or simple Facebook login
✅ **Clear States**: Dashboard shows exactly what permissions you have
✅ **Helpful Guidance**: Built-in instructions for getting App Review

You can now test your Meta integration in development mode and smoothly transition to production when ready!
