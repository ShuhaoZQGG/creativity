import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  exchangeCodeForToken,
  getAdAccounts,
  createCampaign,
  createAdSet,
  createAd,
  createAdCreative,
  getCampaignInsights,
  updateCampaignStatus,
} from '../services/meta.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

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
    ? 'email,public_profile,ads_management,ads_read,business_management' // Dev mode: full permissions for admins/testers
    : 'ads_management,ads_read,business_management'); // Prod mode: full permissions (requires App Review)

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

    // Save to user
    await prisma.user.update({
      where: { id: userId as string },
      data: {
        metaAccessToken: tokenData.access_token,
        metaAdAccountId: hasAdsAccess ? adAccounts[0].id : null,
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

    // Create campaign
    const campaignId = await createCampaign({
      accessToken: user.metaAccessToken,
      adAccountId: user.metaAdAccountId,
      name: `AB Test - ${new Date().toISOString()}`,
      objective: objective || 'LINK_CLICKS',
    });

    // Create ad set
    const adSetId = await createAdSet({
      accessToken: user.metaAccessToken,
      adAccountId: user.metaAdAccountId,
      campaignId,
      name: `AB Test Ad Set - ${new Date().toISOString()}`,
      dailyBudget: budget / (duration_days || 5),
      targeting: audience || {
        geo_locations: { countries: ['US'] },
        age_min: 25,
        age_max: 45,
      },
      optimizationGoal: 'LINK_CLICKS',
    });

    // Create ads for each creative
    const variants = await Promise.all(
      creatives.map(async (creative: any) => {
        const textVariant = creative.textVariant as any;
        const inputContext = creative.inputContext as any;

        // Create ad creative on Meta (Meta needs to access the image, so generate a long-lived signed URL)
        const metaCreativeId = await createAdCreative({
          accessToken: user.metaAccessToken!,
          adAccountId: user.metaAdAccountId!,
          name: `Creative ${creative.id}`,
          headline: textVariant.headline,
          body: textVariant.body,
          imageUrl: await getSignedUrl(creative.imageUrls[0] as string, 60 * 60 * 24 * 30), // 30 days for Meta
          linkUrl: inputContext.website_url || 'https://example.com',
          callToAction: textVariant.cta,
        });

        // Create ad
        const adId = await createAd({
          accessToken: user.metaAccessToken!,
          adAccountId: user.metaAdAccountId!,
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
  } catch (error) {
    console.error('Create AB test error:', error);
    res.status(500).json({ error: 'Failed to create AB test' });
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
      },
    });

    const hasToken = !!user?.metaAccessToken;
    const hasAdsAccess = !!(user?.metaAccessToken && user?.metaAdAccountId);
    const isDev = process.env.META_MODE === 'dev' || process.env.NODE_ENV === 'development';

    res.json({
      connected: hasToken,
      ads_access: hasAdsAccess,
      ad_account_id: user?.metaAdAccountId || null,
      mode: isDev ? 'development' : 'production',
      message: hasToken && !hasAdsAccess
        ? 'Connected with basic permissions only. Ads features require App Review.'
        : null,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

export default router;
