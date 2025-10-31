# Meta Ads Integration Implementation

## Overview
Complete implementation of Meta (Facebook) Ads integration with A/B testing and analytics capabilities. This feature allows users to connect their Meta advertising accounts, create A/B tests with generated creatives, and track detailed performance analytics.

## Implementation Date
October 31, 2025

---

## Features Implemented

### 1. Backend Infrastructure

#### Database Schema Enhancements
Enhanced Prisma schema with three new models for tracking Meta Ads data:

**ABTest Model** (Enhanced)
- Added fields for comprehensive test tracking:
  - `name`: Optional test name
  - `metaAdSetId`: Ad set ID from Meta
  - `budget`: Test budget
  - `objective`: Campaign objective (LINK_CLICKS, CONVERSIONS, etc.)
  - `audience`: Target audience configuration (JSON)
  - `durationDays`: Test duration
  - `winnerCreativeId`: ID of winning creative
  - `startDate` and `endDate`: Test timeline

**ABTestVariant Model** (New)
```prisma
model ABTestVariant {
  id                String   @id @default(uuid())
  abTestId          String
  creativeId        String
  metaAdId          String?
  metaCreativeId    String?
  trafficPercentage Float?
  status            String   @default("draft")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**AdAnalytics Model** (New)
```prisma
model AdAnalytics {
  id          String   @id @default(uuid())
  abTestId    String?
  metaAdId    String
  creativeId  String?
  date        DateTime @default(now())
  impressions Int      @default(0)
  clicks      Int      @default(0)
  ctr         Float    @default(0)
  conversions Int      @default(0)
  spend       Float    @default(0)
  cpc         Float    @default(0)
  cpm         Float    @default(0)
  roas        Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Location: `backend/prisma/schema.prisma`

#### API Routes

**Existing Routes** (Already implemented)
- `GET /api/meta/connect` - Start OAuth flow
- `GET /api/meta/callback` - OAuth callback handler
- `POST /api/meta/abtest` - Create A/B test with selected creatives
- `GET /api/meta/results` - Get campaign results

**New Routes** (Added in this implementation)
- `GET /api/meta/abtests` - List all A/B tests for user (with optional status filter)
- `GET /api/meta/abtests/:id/analytics` - Get detailed analytics for specific test
- `PATCH /api/meta/campaigns/:campaignId/status` - Update campaign status (ACTIVE, PAUSED, ARCHIVED)
- `GET /api/meta/status` - Check Meta account connection status

Location: `backend/src/routes/meta.ts`

#### Meta Service Functions

**Existing Functions**
- `exchangeCodeForToken()` - Exchange OAuth code for access token
- `getAdAccounts()` - Fetch user's ad accounts
- `createCampaign()` - Create Meta campaign
- `createAdSet()` - Create ad set
- `createAd()` - Create ad
- `createAdCreative()` - Create ad creative
- `getCampaignInsights()` - Fetch campaign performance data

**New Functions** (Added in this implementation)
- `updateCampaignStatus()` - Update campaign status on Meta
- `getAdInsights()` - Get ad-level insights with date filtering

Location: `backend/src/services/meta.ts`

### 2. Frontend Pages

#### A/B Testing Page
**Location**: `frontend/app/ab-testing/page.tsx`

**Features**:
- Meta account connection check with redirect to OAuth flow
- List all A/B tests with status indicators (active, paused, draft)
- Create new A/B test modal with:
  - Budget configuration
  - Objective selection (LINK_CLICKS, CONVERSIONS, REACH)
  - Duration setting
  - Creative selection (minimum 2 required)
  - Visual preview of selected creatives
- Display test performance metrics:
  - Impressions
  - Clicks
  - CTR (Click-Through Rate)
  - Spend
- View details link for each test

**Technical Implementation**:
- React hooks for state management
- Responsive grid layout for creative selection
- Real-time status updates
- Error handling with user-friendly alerts

#### Analytics Page
**Location**: `frontend/app/analytics/page.tsx`

**Features**:
- Meta account connection check
- Test selection dropdown
- Date range filtering (start and end date)
- Summary cards showing:
  - Total impressions
  - Total clicks with average CTR
  - Total conversions
  - Total spend with average CPC
- Performance chart (bar chart visualization)
- Detailed analytics table with:
  - Date
  - Impressions
  - Clicks
  - CTR
  - Conversions
  - Spend
  - CPC (Cost Per Click)
  - CPM (Cost Per Mille)
- CSV export functionality

**Technical Implementation**:
- Dynamic data aggregation
- Chart visualization using HTML/CSS
- CSV generation and download
- Responsive table design

#### Dashboard Integration
**Location**: `frontend/app/dashboard/page.tsx`

**Enhancements**:
- Meta connection status card with:
  - Visual indicator (green pulse for connected, orange for not connected)
  - Ad account ID display when connected
  - "Connect Meta" button when not connected
  - Quick access buttons to A/B Testing and Analytics pages
- Updated navigation links:
  - A/B Tests → `/ab-testing`
  - Analytics → `/analytics`
- Meta connection check on page load

### 3. OAuth Flow

**Implementation**:
1. User clicks "Connect Meta Account" on dashboard or A/B Testing page
2. Frontend calls `GET /api/meta/connect`
3. Backend generates OAuth URL with required scopes:
   - `ads_management`
   - `ads_read`
   - `business_management`
4. User redirects to Meta authorization page
5. After authorization, Meta redirects to callback URL with code
6. Backend exchanges code for access token
7. Backend fetches user's ad accounts
8. Access token and ad account ID stored in user record
9. User redirected back to application

**Security**:
- State parameter contains user ID for verification
- Access tokens stored securely in database
- Tokens used for subsequent Meta API calls

---

## API Endpoints Reference

### Meta Integration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/meta/connect` | Start OAuth flow | Yes |
| GET | `/api/meta/callback` | Handle OAuth callback | No |
| GET | `/api/meta/status` | Get connection status | Yes |
| GET | `/api/meta/abtests` | List A/B tests | Yes |
| POST | `/api/meta/abtest` | Create A/B test | Yes |
| GET | `/api/meta/abtests/:id/analytics` | Get test analytics | Yes |
| GET | `/api/meta/results` | Get campaign results | Yes |
| PATCH | `/api/meta/campaigns/:campaignId/status` | Update campaign status | Yes |

### Request/Response Examples

**Create A/B Test**
```json
POST /api/meta/abtest
{
  "creative_ids": ["uuid1", "uuid2", "uuid3"],
  "budget": 100,
  "objective": "LINK_CLICKS",
  "duration_days": 5
}

Response:
{
  "status": "created",
  "meta_campaign_id": "123456789",
  "ab_test_id": "uuid",
  "variants": [
    {
      "creative_id": "uuid1",
      "ad_id": "meta_ad_id_1"
    }
  ]
}
```

**List A/B Tests**
```json
GET /api/meta/abtests?status=active

Response:
{
  "tests": [
    {
      "id": "uuid",
      "name": null,
      "creativeIds": ["uuid1", "uuid2"],
      "metaCampaignId": "123456789",
      "status": "active",
      "budget": 100,
      "objective": "LINK_CLICKS",
      "variants": [...],
      "analytics": [...]
    }
  ]
}
```

**Get Analytics**
```json
GET /api/meta/abtests/{id}/analytics?start_date=2025-10-24&end_date=2025-10-31

Response:
{
  "test": {
    "id": "uuid",
    "name": null,
    ...
  },
  "analytics": [
    {
      "id": "uuid",
      "date": "2025-10-30T00:00:00.000Z",
      "impressions": 1000,
      "clicks": 50,
      "ctr": 0.05,
      "conversions": 5,
      "spend": 25.50,
      "cpc": 0.51,
      "cpm": 25.50,
      "roas": 2.5
    }
  ]
}
```

---

## Database Migration

The database schema was updated to include the new models. To apply the migration:

```bash
cd backend
npx prisma migrate dev --name add_meta_ads_analytics
npx prisma generate
```

**Note**: Migration requires database connectivity. If database is not accessible locally, the migration should be applied in the production environment.

---

## Configuration Requirements

### Environment Variables

Add these to your `.env` file:

```env
# Meta App Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/api/meta/callback

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Meta Developer Setup

1. Create a Meta App at https://developers.facebook.com
2. Add "Marketing API" product
3. Configure OAuth redirect URI
4. Request app review for required permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`

---

## Testing Checklist

- [ ] Meta OAuth connection flow works
- [ ] Access token is stored correctly
- [ ] A/B test creation with multiple creatives
- [ ] Campaign is created on Meta with correct settings
- [ ] Ads are created for each creative variant
- [ ] Analytics data is fetched from Meta
- [ ] Analytics are displayed correctly in frontend
- [ ] Date range filtering works
- [ ] CSV export includes all data
- [ ] Campaign status updates work (pause/resume)
- [ ] Navigation links work correctly
- [ ] Meta connection status displays properly on dashboard

---

## Known Limitations

1. **Page ID Configuration**: Currently uses simplified page ID extraction. Should be enhanced to allow users to select their Facebook Page.

2. **Analytics Sync**: Analytics are fetched on-demand. Consider implementing:
   - Background job to sync analytics periodically
   - Webhook integration for real-time updates

3. **Ad Creative Upload**: Meta requires images to be accessible via URL. Current implementation uses S3 signed URLs (30 days expiry).

4. **A/B Test Management**:
   - No automatic winner selection
   - No scheduled test end
   - Manual campaign management required

5. **Error Handling**: Some Meta API errors may not provide user-friendly messages.

---

## Future Enhancements

### Phase 2 Features
1. **Automated Winner Selection**
   - Statistical significance testing
   - Automatic budget reallocation
   - Winner notification

2. **Advanced Analytics**
   - Conversion tracking
   - Revenue attribution (ROAS)
   - Audience insights
   - Performance predictions

3. **Enhanced A/B Testing**
   - Multi-variate testing
   - Sequential testing
   - Custom audience targeting per variant

4. **Reporting**
   - Scheduled email reports
   - Custom dashboards
   - Comparative analysis
   - Historical trends

5. **Integration Improvements**
   - Multiple ad account support
   - Instagram placement
   - Audience Network placement
   - Custom conversion events

---

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma           (Enhanced with new models)
├── src/
│   ├── routes/
│   │   └── meta.ts            (Enhanced with new endpoints)
│   └── services/
│       └── meta.ts            (Enhanced with new functions)

frontend/
├── app/
│   ├── ab-testing/
│   │   └── page.tsx           (New - A/B Testing page)
│   ├── analytics/
│   │   └── page.tsx           (New - Analytics page)
│   └── dashboard/
│       └── page.tsx           (Enhanced with Meta connection)
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Meta account not connected" error
- **Solution**: Check OAuth flow completed successfully, verify access token is stored

**Issue**: Campaign creation fails
- **Solution**: Verify ad account has proper permissions, check Meta app is approved

**Issue**: No analytics data
- **Solution**: Ensure campaign is active and has run for at least 24 hours

**Issue**: Image upload fails
- **Solution**: Check S3 signed URL is accessible, verify image meets Meta requirements

### Debug Tips

1. Check browser console for API errors
2. Review backend logs for Meta API responses
3. Verify environment variables are set correctly
4. Test Meta API calls directly using Graph API Explorer

---

## Credits

Implementation completed as part of Task 3 from FEATURE_IMPLEMENTATION_PLAN.md

Meta Marketing API Documentation: https://developers.facebook.com/docs/marketing-apis
