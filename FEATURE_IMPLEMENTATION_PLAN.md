# Feature Implementation Plan

## Overview
This document outlines the implementation plan for four major features to enhance the creative management platform.

---

## Task 1: Base Image Upload for Variants ✅ **COMPLETED**

**Current State**: Creative generation likely generates images from scratch or uses AI image generation.

**Implementation Status**: ✅ Completed - All core features implemented. See BASE_IMAGE_UPLOAD_IMPLEMENTATION.md for full details.

### Implementation Breakdown

#### Frontend Changes
- Add file upload component to creative generation form
- Preview uploaded image before generation
- Add option to choose between "Generate from scratch" or "Use base image"

#### Backend Changes
- **File Upload Endpoint**: `POST /api/creatives/upload-image`
  - Handle multipart/form-data
  - Store image temporarily or in blob storage
  - Return image URL/ID
- **Creative Generation Logic Update**:
  - Modify AI prompt to include image variation instructions
  - Use image-to-image generation (if using AI like DALL-E or Stability AI)
  - Apply filters/effects to base image for variants
  - Ensure variants maintain brand consistency while offering diversity

#### Database Changes
- Add `base_image_url` field to Creative model
- Track whether creative was generated from base image or from scratch

#### AI Integration Options
1. **Stability AI** - img2img endpoint for variations
2. **OpenAI DALL-E** - image editing/variation
3. **Cloudinary/ImageKit** - Programmatic transformations (filters, crops, overlays)

**Complexity**: Medium
**Time Estimate**: 2-3 days

---

## Task 2: Website URL Style Analysis ✅ **COMPLETED**

**Current State**: User manually inputs campaign details without automated website analysis.

**Implementation Status**: ✅ Completed - All core features implemented. See WEBSITE_STYLE_ANALYSIS_IMPLEMENTATION.md for full details.

### Implementation Breakdown

#### Frontend Changes
- Add website URL input field to creative generation form
- Show loading state while analyzing website
- Display extracted brand information (colors, fonts, style) for review/editing

#### Backend Changes
- **Website Scraping Service** (`services/websiteScraper.ts`):
  - Fetch website HTML
  - Extract brand colors (from CSS, logo, main colors)
  - Analyze typography
  - Capture screenshots
  - Extract brand messaging/tone from content

- **New Endpoint**: `POST /api/analyze-website`
  - Input: website URL
  - Output: brand style guide object

- **AI Vision Analysis**:
  - Use OpenAI GPT-4 Vision or Claude Vision to analyze screenshots
  - Extract design patterns, color schemes, visual hierarchy
  - Identify brand personality (modern, classic, playful, professional)

- **Creative Generation Enhancement**:
  - Pass website style data to AI prompt
  - Generate creatives matching brand colors
  - Adapt headline/description tone to match website copy

#### Technical Stack
- **Puppeteer/Playwright** - Website screenshot and DOM access
- **cheerio** - HTML parsing
- **colorthief** or **node-vibrant** - Color extraction
- **GPT-4 Vision API** - Visual style analysis

#### Database Changes
- Add `WebsiteAnalysis` model:
  ```typescript
  {
    url: string
    brandColors: string[]
    brandFonts: string[]
    styleKeywords: string[]
    tone: string
    screenshotUrl: string
    analyzedAt: Date
  }
  ```
- Link to Campaign or store with Creative

**Complexity**: Medium-High
**Time Estimate**: 3-5 days

---

## Task 3: A/B Tests & Analytics Integration with Meta Ads APIs

**Current State**: Pages exist but are empty placeholders.

### Implementation Breakdown

#### Prerequisites
- Meta Business Account and App setup
- Meta Marketing API access token
- Facebook Business Manager integration

#### Backend - Meta Ads API Integration

**New Service**: `services/metaAdsService.ts`

##### Core Functions:
1. **Campaign Management**:
   - Create campaigns on Meta
   - Link creatives to ad sets
   - Manage budgets and schedules

2. **A/B Test Setup**:
   - Create split test campaigns
   - Distribute creatives across test groups
   - Set test parameters (audience, budget split)

3. **Analytics Fetching**:
   - Pull insights data from Meta Ads API
   - Metrics: impressions, clicks, CTR, conversions, spend, CPC, ROAS

##### API Endpoints to Implement:

```typescript
// Push creative to Meta
POST /api/meta-ads/create-ad
{
  creativeId: string
  campaignId: string
  adSetId: string
  targeting: object
}

// Fetch campaign analytics
GET /api/meta-ads/analytics/:campaignId
Response: {
  impressions, clicks, ctr, conversions, spend, cpc, roas
}

// Create A/B test
POST /api/meta-ads/ab-test
{
  creativeIds: string[]
  testType: 'creative' | 'audience' | 'placement'
  budget: number
  duration: number
}

// Get A/B test results
GET /api/meta-ads/ab-test/:testId
Response: {
  variants: [{
    creativeId,
    performance: {...}
  }],
  winner: creativeId
}
```

#### Database Changes

**New Models**:
```typescript
// MetaAdCampaign
{
  id, name, metaCampaignId, status, budget, startDate, endDate
}

// MetaAd
{
  id, creativeId, metaAdId, campaignId, status
}

// ABTest
{
  id, name, testType, status, startDate, endDate, winnerCreativeId
}

// ABTestVariant
{
  id, abTestId, creativeId, metaAdId, trafficPercentage
}

// AdAnalytics
{
  id, metaAdId, date, impressions, clicks, ctr, conversions,
  spend, cpc, cpm, roas
}
```

#### Frontend - A/B Testing Page

**Features**:
- Create new A/B test interface
  - Select multiple creatives to test
  - Set test duration and budget
  - Choose audience
- Active tests dashboard
  - Real-time performance comparison
  - Visual charts (impressions, CTR, conversions)
- Test results view
  - Declare winner
  - Export insights

#### Frontend - Analytics Page

**Features**:
- Campaign overview dashboard
  - Total spend, impressions, conversions
  - Performance trends over time
- Per-creative analytics
  - Breakdown by creative
  - Compare performance
- Date range selector
- Export reports (CSV/PDF)
- Visual charts using **Chart.js** or **Recharts**

#### Meta Marketing API Integration

**Key Endpoints to Use**:
- `/act_{ad_account_id}/campaigns` - Campaign CRUD
- `/act_{ad_account_id}/ads` - Ad CRUD
- `/{ad_id}/insights` - Performance metrics
- `/campaigns` (with split testing params) - A/B tests

**Authentication Flow**:
1. User connects Meta Business account (OAuth)
2. Store access token securely
3. Select ad account to use

**Complexity**: High
**Time Estimate**: 7-10 days

---

## Task 4: Separate Creatives Gallery Page ✅ **COMPLETED**

**Current State**: Only recent creatives shown in dashboard, no comprehensive view.

**Implementation Status**: ✅ Completed - All core features implemented. See CREATIVES_GALLERY_IMPLEMENTATION.md for full details.

### Implementation Breakdown

#### Frontend - New Creatives Gallery Page

**Route**: `/creatives`

**Features**:

1. **Grid/List View Toggle**
   - Grid view with image previews
   - List view with detailed info

2. **Filtering & Search**
   - Search by headline, description
   - Filter by campaign
   - Filter by status (draft, active, archived)
   - Filter by date range
   - Filter by performance metrics (if integrated with Meta)

3. **Sorting Options**
   - Sort by date created (newest/oldest)
   - Sort by performance (CTR, conversions - if analytics available)
   - Sort by campaign

4. **Pagination**
   - Infinite scroll or page-based
   - Show 20-50 creatives per page

5. **Bulk Actions**
   - Select multiple creatives
   - Bulk delete
   - Bulk export
   - Bulk add to A/B test

6. **Creative Preview Card**
   - Image thumbnail
   - Headline & description preview
   - Campaign name
   - Created date
   - Performance metrics (if available)
   - Actions: View, Edit, Delete, Duplicate, Push to Meta

7. **Detailed View Modal**
   - Click creative to see full details
   - All creative fields
   - Performance history chart
   - Edit inline
   - Download image

#### Backend Changes

**New Endpoint**: `GET /api/creatives`
```typescript
Query params:
  - page: number
  - limit: number
  - search: string
  - campaignId: string
  - status: 'draft' | 'active' | 'archived'
  - sortBy: 'createdAt' | 'performance'
  - sortOrder: 'asc' | 'desc'
  - startDate: Date
  - endDate: Date

Response: {
  creatives: Creative[]
  pagination: {
    total, page, limit, totalPages
  }
}
```

**Enhancement to Existing Endpoints**:
- Ensure Creative model includes all necessary fields
- Add soft delete support (archived status)
- Optimize queries for large datasets (indexing)

#### UI/UX Considerations

**Components to Create**:
- `CreativeCard.tsx` - Individual creative display
- `CreativeGrid.tsx` - Grid layout
- `CreativeList.tsx` - List layout
- `CreativeFilters.tsx` - Filter sidebar
- `CreativeDetailModal.tsx` - Full details popup
- `BulkActions.tsx` - Multi-select toolbar

**Navigation**:
- Add "Creatives" link to main navigation
- Dashboard "Recent Creatives" section links to full gallery

**Complexity**: Low
**Time Estimate**: 1-2 days

---

## Summary & Recommended Implementation Order

### Priority Ranking (by value vs. complexity):

**1. Task 4 - Creatives Gallery** ⭐ ✅ **COMPLETED**
- **Complexity**: Low
- **Value**: High
- **Why first**: Foundation for managing creatives, no external dependencies
- **Time estimate**: 1-2 days
- **Status**: ✅ Implemented - See CREATIVES_GALLERY_IMPLEMENTATION.md for details

**2. Task 1 - Base Image Upload** ⭐⭐ ✅ **COMPLETED**
- **Complexity**: Medium
- **Value**: High
- **Dependencies**: AWS S3 (already implemented)
- **Time estimate**: 2-3 days
- **Status**: ✅ Implemented - See BASE_IMAGE_UPLOAD_IMPLEMENTATION.md for details

**3. Task 2 - Website Style Analysis** ⭐⭐⭐ ✅ **COMPLETED**
- **Complexity**: Medium-High
- **Value**: Medium-High
- **Dependencies**: Puppeteer, Cheerio, node-vibrant, GPT-4
- **Time estimate**: 3-5 days
- **Status**: ✅ Implemented - See WEBSITE_STYLE_ANALYSIS_IMPLEMENTATION.md for details

**4. Task 3 - Meta Ads Integration** ⭐⭐⭐⭐ (Next)
- **Complexity**: High
- **Value**: Very High (but complex)
- **Dependencies**: Meta Business account, OAuth, extensive API integration
- **Time estimate**: 7-10 days

### Technical Dependencies to Set Up:

- **Image Storage**: AWS S3, Cloudinary, or similar
- **Meta Developer Account**: For Marketing API access
- **Web Scraping**: Puppeteer/Playwright for website analysis
- **Charts Library**: Recharts or Chart.js for analytics
- **OAuth**: For Meta account connection
