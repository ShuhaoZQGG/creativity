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
} from '../services/meta.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

// Start OAuth flow
router.get('/connect', requireAuth, (req: AuthRequest, res) => {
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(
    process.env.META_REDIRECT_URI!
  )}&scope=ads_management,ads_read,business_management&state=${req.user!.id}`;

  res.json({ auth_url: authUrl });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code as string);

    // Get ad accounts
    const adAccounts = await getAdAccounts(tokenData.access_token);

    if (adAccounts.length === 0) {
      return res.status(400).json({ error: 'No ad accounts found' });
    }

    // Save to user
    await prisma.user.update({
      where: { id: userId as string },
      data: {
        metaAccessToken: tokenData.access_token,
        metaAdAccountId: adAccounts[0].id,
      },
    });

    res.json({
      status: 'connected',
      ad_account_id: adAccounts[0].id,
    });
  } catch (error) {
    console.error('Meta callback error:', error);
    res.status(500).json({ error: 'Failed to connect Meta account' });
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
      creatives.map(async (creative) => {
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

export default router;
