import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  exchangeCodeForToken,
  getAdAccounts,
  getPages,
  createCampaign,
  createAdSet,
  createAd,
  createAdCreative,
  getCampaignInsights,
  updateCampaignStatus,
} from '../services/meta.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

// Debug endpoint to see current Meta configuration
router.get('/debug-config', (req, res) => {
  res.json({
    META_APP_ID: process.env.META_APP_ID || 'NOT SET',
    META_REDIRECT_URI: process.env.META_REDIRECT_URI || 'NOT SET',
    META_MODE: process.env.META_MODE || 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  });
});

// Debug endpoint to test page fetching
router.get('/debug-pages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user?.metaAccessToken) {
      return res.status(400).json({ error: 'Not connected to Meta' });
    }

    const pages = await getPages(user.metaAccessToken);

    res.json({
      success: true,
      pagesCount: pages.length,
      pages: pages.map(p => ({ id: p.id, name: p.name })),
      currentPageId: user.metaPageId,
    });
  } catch (error: any) {
    console.error('Debug pages error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data,
    });
  }
});

// Login with Facebook (basic permissions only - no ads access)
// This always works without App Review
router.get('/login', requireAuth, (req: AuthRequest, res) => {
  const scopes = 'public_profile,email';

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
    process.env.META_REDIRECT_URI!
  )}&scope=${scopes}&state=${req.user!.id}`;

  res.json({ auth_url: authUrl, mode: 'login_only' });
});

// Start OAuth flow
router.get('/connect', requireAuth, (req: AuthRequest, res) => {
  // Allow explicit scope override via query param for testing
  const scopeOverride = req.query.scopes as string;

  // Use different scopes based on mode
  // DEV mode: Only use permissions available without App Review
  // PROD mode: Use full permissions (requires App Review)
  const isDev = process.env.META_MODE === 'dev' || process.env.NODE_ENV === 'development';

  const scopes = scopeOverride || (isDev
    ? 'email,public_profile,ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_ads' // Dev mode: full permissions for admins/testers
    : 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_ads'); // Prod mode: full permissions (requires App Review)

  console.log(`Meta OAuth connect - Mode: ${isDev ? 'dev' : 'prod'}, Scopes: ${scopes}`);

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
    process.env.META_REDIRECT_URI!
  )}&scope=${scopes}&state=${req.user!.id}`;

  res.json({ auth_url: authUrl, mode: isDev ? 'development' : 'production', scopes });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const {
      code,
      state: userId,
      error: fbError,
      error_description,
      error_code,
      error_message
    } = req.query;

    // Handle Facebook errors (e.g., user denied permissions, invalid scopes)
    if (fbError || error_code) {
      const errorMsg = error_message || error_description || fbError || 'OAuth error occurred';
      console.error('Meta OAuth error:', { fbError, error_code, error_message, error_description });

      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=${encodeURIComponent(
          errorMsg as string
        )}&error_code=${error_code || ''}`
      );
    }

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code as string);

    // Try to get ad accounts (this will fail if user doesn't have ads permissions)
    let adAccounts: any[] = [];
    let hasAdsAccess = false;

    try {
      adAccounts = await getAdAccounts(tokenData.access_token);
      hasAdsAccess = adAccounts.length > 0;
    } catch (error) {
      console.log('No ads access - user probably only granted basic permissions');
    }

    // Try to get Facebook Pages
    let pages: any[] = [];
    let pageId: string | null = null;

    try {
      pages = await getPages(tokenData.access_token);
      console.log('Pages fetched:', pages.length, 'pages found');
      if (pages.length > 0) {
        pageId = pages[0].id;
        console.log('Selected page ID:', pageId, 'Page name:', pages[0].name);
      } else {
        console.log('No Facebook Pages found for this user');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      console.log('No page access - user may not have pages or pages_show_list permission');
    }

    // Save to user
    await prisma.user.update({
      where: { id: userId as string },
      data: {
        metaAccessToken: tokenData.access_token,
        metaAdAccountId: hasAdsAccess ? adAccounts[0].id : null,
        metaPageId: pageId,
      },
    });

    // Redirect back to frontend with success
    const redirectUrl = hasAdsAccess
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?meta_connected=true&ads_access=true`
      : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?meta_connected=true&ads_access=false`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Meta callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect Meta account';
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=${encodeURIComponent(errorMessage)}`
    );
  }
});

// Map old objective names to new outcome-based objectives
function mapToOutcomeObjective(objective?: string): string {
  const objectiveMap: Record<string, string> = {
    'LINK_CLICKS': 'OUTCOME_TRAFFIC',
    'CONVERSIONS': 'OUTCOME_SALES',
    'LEAD_GENERATION': 'OUTCOME_LEADS',
    'BRAND_AWARENESS': 'OUTCOME_AWARENESS',
    'POST_ENGAGEMENT': 'OUTCOME_ENGAGEMENT',
    'APP_INSTALLS': 'OUTCOME_APP_PROMOTION',
  };

  // If already using new format, return as-is
  if (objective?.startsWith('OUTCOME_')) {
    return objective;
  }

  // Map old format to new, default to OUTCOME_TRAFFIC
  return objectiveMap[objective || 'LINK_CLICKS'] || 'OUTCOME_TRAFFIC';
}

// Create A/B test
router.post('/abtest', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { creative_ids, budget, objective, audience, duration_days } = req.body;

    if (!creative_ids || creative_ids.length < 2) {
      return res.status(400).json({ error: 'At least 2 creative_ids are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user?.metaAccessToken || !user?.metaAdAccountId) {
      return res.status(400).json({ error: 'Meta account not connected' });
    }

    if (!user?.metaPageId) {
      return res.status(400).json({
        error: 'No Facebook Page connected. Please reconnect your Meta account to link a Facebook Page.'
      });
    }

    // Use sandbox ad account if configured (for testing without spending real money)
    let sandboxAdAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
    const sandboxAccessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

    // Ensure sandbox account ID has the 'act_' prefix
    if (sandboxAdAccountId && !sandboxAdAccountId.startsWith('act_')) {
      sandboxAdAccountId = `act_${sandboxAdAccountId}`;
    }

    const adAccountId = sandboxAdAccountId || user.metaAdAccountId;
    const accessToken = (sandboxAdAccountId && sandboxAccessToken) ? sandboxAccessToken : user.metaAccessToken;

    if (sandboxAdAccountId) {
      console.log('🧪 Using sandbox ad account for testing:', sandboxAdAccountId);
      if (!sandboxAccessToken) {
        return res.status(500).json({
          error: 'META_SANDBOX_ACCESS_TOKEN is required when using META_SANDBOX_AD_ACCOUNT_ID. Please set it in your .env file.'
        });
      }
      console.log('🧪 Using sandbox access token (first 20 chars):', sandboxAccessToken.substring(0, 20) + '...');
    }

    // Get creatives
    const creatives = await prisma.creative.findMany({
      where: {
        id: { in: creative_ids },
        userId: req.user!.id,
      },
    });

    if (creatives.length !== creative_ids.length) {
      return res.status(404).json({ error: 'Some creatives not found' });
    }

    // Map to new outcome-based objective
    const mappedObjective = mapToOutcomeObjective(objective);

    // Create campaign
    const campaignId = await createCampaign({
      accessToken,
      adAccountId,
      name: `AB Test - ${new Date().toISOString()}`,
      objective: mappedObjective,
    });

    // Map optimization goal based on objective
    const optimizationGoalMap: Record<string, string> = {
      'OUTCOME_TRAFFIC': 'LINK_CLICKS',
      'OUTCOME_SALES': 'OFFSITE_CONVERSIONS',
      'OUTCOME_LEADS': 'LEAD_GENERATION',
      'OUTCOME_AWARENESS': 'REACH',
      'OUTCOME_ENGAGEMENT': 'POST_ENGAGEMENT',
      'OUTCOME_APP_PROMOTION': 'APP_INSTALLS',
    };

    const optimizationGoal = optimizationGoalMap[mappedObjective] || 'LINK_CLICKS';

    // Calculate daily budget and ensure minimum ($2 USD/day to account for currency variations)
    const MIN_DAILY_BUDGET = 2; // $2 USD minimum
    const calculatedDailyBudget = budget / (duration_days || 5);
    const dailyBudget = Math.max(calculatedDailyBudget, MIN_DAILY_BUDGET);

    // Warn if we had to adjust the budget
    if (dailyBudget > calculatedDailyBudget) {
      console.log(`Daily budget adjusted from $${calculatedDailyBudget} to $${dailyBudget} to meet Meta minimum requirements`);
    }

    // Create ad set
    const adSetId = await createAdSet({
      accessToken,
      adAccountId,
      campaignId,
      name: `AB Test Ad Set - ${new Date().toISOString()}`,
      dailyBudget,
      targeting: audience || {
        geo_locations: { countries: ['US'] },
        age_min: 25,
        age_max: 45,
      },
      optimizationGoal,
    });

    // Create ads for each creative
    const variants = await Promise.all(
      creatives.map(async (creative: any) => {
        const textVariant = creative.textVariant as any;
        const inputContext = creative.inputContext as any;

        // Create ad creative on Meta (Meta needs to access the image, so generate a long-lived signed URL)
        // AWS S3 signed URLs have a maximum expiration of 7 days (604800 seconds)
        const metaCreativeId = await createAdCreative({
          accessToken,
          adAccountId,
          pageId: user.metaPageId!,
          name: `Creative ${creative.id}`,
          headline: textVariant.headline,
          body: textVariant.body,
          imageUrl: await getSignedUrl(creative.imageUrls[0] as string, 60 * 60 * 24 * 7), // 7 days (max allowed by AWS)
          linkUrl: inputContext.website_url || 'https://example.com',
          callToAction: textVariant.cta,
        });

        // Create ad
        const adId = await createAd({
          accessToken,
          adAccountId,
          adSetId,
          name: `Ad ${creative.id}`,
          creativeId: metaCreativeId,
        });

        return {
          creative_id: creative.id,
          ad_id: adId,
        };
      })
    );

    // Save AB test
    const abTest = await prisma.aBTest.create({
      data: {
        userId: req.user!.id,
        creativeIds: creative_ids,
        metaCampaignId: campaignId,
        status: 'created',
      },
    });

    res.json({
      status: 'created',
      meta_campaign_id: campaignId,
      ab_test_id: abTest.id,
      variants,
    });
  } catch (error: any) {
    console.error('Create AB test error:', error);
    console.error('Error response:', error.response?.data);
    res.status(500).json({
      error: 'Failed to create AB test',
      details: error.response?.data || error.message
    });
  }
});

// Get AB test results
router.get('/results', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { campaign_id } = req.query;

    if (!campaign_id) {
      return res.status(400).json({ error: 'campaign_id is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user?.metaAccessToken) {
      return res.status(400).json({ error: 'Meta account not connected' });
    }

    // Get insights from Meta
    const insights = await getCampaignInsights(user.metaAccessToken, campaign_id as string);

    // Get AB test
    const abTest = await prisma.aBTest.findFirst({
      where: {
        userId: req.user!.id,
        metaCampaignId: campaign_id as string,
      },
      include: {
        user: true,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    // Update results
    await prisma.aBTest.update({
      where: { id: abTest.id },
      data: {
        results: insights,
        status: 'completed',
      },
    });

    res.json({
      campaign_id,
      results: [insights], // Simplified - should get per-ad insights
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// List all A/B tests for the user
router.get('/abtests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (status) {
      where.status = status;
    }

    const abTests = await prisma.aBTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        variants: true,
        analytics: {
          orderBy: { date: 'desc' },
          take: 1, // Get latest analytics for each test
        },
      },
    });

    res.json({ tests: abTests });
  } catch (error) {
    console.error('List AB tests error:', error);
    res.status(500).json({ error: 'Failed to list AB tests' });
  }
});

// Get single A/B test with full details
router.get('/abtests/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        variants: {
          include: {
            abTest: false, // Avoid circular reference
          },
        },
        analytics: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    // Fetch creative details for each variant
    const creativeIds = abTest.variants.map((v) => v.creativeId);
    const creatives = await prisma.creative.findMany({
      where: { id: { in: creativeIds } },
    });

    // Map creatives to variants
    const variantsWithCreatives = abTest.variants.map((variant) => {
      const creative = creatives.find((c) => c.id === variant.creativeId);
      return {
        ...variant,
        creative,
      };
    });

    // Calculate aggregate metrics
    const totalImpressions = abTest.analytics.reduce((sum, a) => sum + a.impressions, 0);
    const totalClicks = abTest.analytics.reduce((sum, a) => sum + a.clicks, 0);
    const totalSpend = abTest.analytics.reduce((sum, a) => sum + a.spend, 0);
    const totalConversions = abTest.analytics.reduce((sum, a) => sum + a.conversions, 0);

    const avgCtr = totalClicks > 0 ? totalClicks / totalImpressions : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    res.json({
      ...abTest,
      variants: variantsWithCreatives,
      aggregateMetrics: {
        totalImpressions,
        totalClicks,
        totalSpend,
        totalConversions,
        avgCtr,
        avgCpc,
        avgCpm,
      },
    });
  } catch (error) {
    console.error('Get AB test error:', error);
    res.status(500).json({ error: 'Failed to get AB test' });
  }
});

// Get detailed analytics for a specific A/B test
router.get('/abtests/:id/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        variants: true,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    const where: any = {
      abTestId: id,
    };

    if (start_date && end_date) {
      where.date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string),
      };
    }

    const analytics = await prisma.adAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json({
      test: abTest,
      analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get analytics for a specific variant
router.get('/abtests/:id/variants/:variantId/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, variantId } = req.params;
    const { start_date, end_date } = req.query;

    // Verify test ownership
    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    // Verify variant belongs to test
    const variant = await prisma.aBTestVariant.findFirst({
      where: {
        id: variantId,
        abTestId: id,
      },
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Fetch variant analytics
    const where: any = {
      metaAdId: variant.metaAdId,
    };

    if (start_date && end_date) {
      where.date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string),
      };
    }

    const analytics = await prisma.adAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json({
      variant,
      analytics,
    });
  } catch (error) {
    console.error('Get variant analytics error:', error);
    res.status(500).json({ error: 'Failed to get variant analytics' });
  }
});

// Declare winner for an A/B test
router.post('/abtests/:id/declare-winner', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { winner_creative_id } = req.body;

    if (!winner_creative_id) {
      return res.status(400).json({ error: 'winner_creative_id is required' });
    }

    // Verify test ownership
    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        variants: true,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    // Verify winner creative is part of this test
    if (!abTest.creativeIds.includes(winner_creative_id)) {
      return res.status(400).json({ error: 'Winner creative is not part of this test' });
    }

    // Update test with winner
    const updatedTest = await prisma.aBTest.update({
      where: { id },
      data: {
        winnerCreativeId: winner_creative_id,
        status: 'completed',
        endDate: new Date(),
      },
    });

    res.json({
      message: 'Winner declared successfully',
      test: updatedTest,
    });
  } catch (error) {
    console.error('Declare winner error:', error);
    res.status(500).json({ error: 'Failed to declare winner' });
  }
});

// Delete an A/B test
router.delete('/abtests/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify test ownership
    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    // Optionally pause campaign on Meta before deleting
    if (abTest.metaCampaignId && abTest.status === 'active') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
        });

        if (user?.metaAccessToken) {
          await updateCampaignStatus(user.metaAccessToken, abTest.metaCampaignId, 'PAUSED');
        }
      } catch (error) {
        console.error('Failed to pause campaign on Meta:', error);
        // Continue with deletion even if pause fails
      }
    }

    // Delete test (cascade will handle variants and analytics)
    await prisma.aBTest.delete({
      where: { id },
    });

    res.json({ message: 'AB test deleted successfully' });
  } catch (error) {
    console.error('Delete AB test error:', error);
    res.status(500).json({ error: 'Failed to delete AB test' });
  }
});

// Manually sync analytics for a specific test
router.post('/abtests/:id/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verify test ownership
    const abTest = await prisma.aBTest.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        variants: true,
        user: true,
      },
    });

    if (!abTest) {
      return res.status(404).json({ error: 'AB test not found' });
    }

    if (!abTest.user.metaAccessToken) {
      return res.status(400).json({ error: 'Meta account not connected' });
    }

    if (!abTest.metaCampaignId) {
      return res.status(400).json({ error: 'Test has no Meta campaign' });
    }

    // Fetch insights from Meta
    const insights = await getCampaignInsights(
      abTest.user.metaAccessToken,
      abTest.metaCampaignId
    );

    // Store analytics (this is simplified - in production you'd want more detailed per-ad insights)
    if (insights) {
      await prisma.adAnalytics.create({
        data: {
          abTestId: abTest.id,
          metaAdId: abTest.metaCampaignId, // Using campaign ID as placeholder
          date: new Date(),
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0'),
          ctr: parseFloat(insights.ctr || '0'),
          conversions: parseInt(insights.conversions || '0'),
          spend: parseFloat(insights.spend || '0'),
          cpc: parseFloat(insights.cpc || '0'),
          cpm: parseFloat(insights.cpm || '0'),
        },
      });
    }

    res.json({
      message: 'Analytics synced successfully',
      insights,
    });
  } catch (error) {
    console.error('Sync analytics error:', error);
    res.status(500).json({ error: 'Failed to sync analytics' });
  }
});

// Update campaign status
router.patch('/campaigns/:campaignId/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user?.metaAccessToken) {
      return res.status(400).json({ error: 'Meta account not connected' });
    }

    // Update campaign status on Meta
    await updateCampaignStatus(user.metaAccessToken, campaignId, status);

    // Update local AB test status
    await prisma.aBTest.updateMany({
      where: {
        userId: req.user!.id,
        metaCampaignId: campaignId,
      },
      data: {
        status: status.toLowerCase(),
      },
    });

    res.json({ status: 'updated' });
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// Get connection status
router.get('/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        metaAccessToken: true,
        metaAdAccountId: true,
        metaPageId: true,
      },
    });

    const hasToken = !!user?.metaAccessToken;
    const hasAdsAccess = !!(user?.metaAccessToken && user?.metaAdAccountId);
    const hasPageAccess = !!user?.metaPageId;
    const isDev = process.env.META_MODE === 'dev' || process.env.NODE_ENV === 'development';

    // Check if sandbox mode is enabled
    let sandboxAdAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;

    // Ensure sandbox account ID has the 'act_' prefix
    if (sandboxAdAccountId && !sandboxAdAccountId.startsWith('act_')) {
      sandboxAdAccountId = `act_${sandboxAdAccountId}`;
    }

    const isSandboxMode = !!sandboxAdAccountId;

    let message = null;
    if (hasToken && !hasAdsAccess) {
      message = 'Connected with basic permissions only. Ads features require App Review.';
    } else if (hasAdsAccess && !hasPageAccess) {
      message = 'No Facebook Page connected. Please reconnect to link a Facebook Page.';
    }

    if (isSandboxMode) {
      message = '🧪 SANDBOX MODE: Testing environment - No real ads will be delivered or charged.';
    }

    res.json({
      connected: hasToken,
      ads_access: hasAdsAccess,
      page_access: hasPageAccess,
      ad_account_id: user?.metaAdAccountId || null,
      page_id: user?.metaPageId || null,
      mode: isDev ? 'development' : 'production',
      sandbox_mode: isSandboxMode,
      sandbox_ad_account_id: isSandboxMode ? sandboxAdAccountId : null,
      message,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

export default router;
