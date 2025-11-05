import { prisma } from '../lib/prisma.js';
import { getCampaignInsights } from './meta.js';

/**
 * Sync analytics for a specific A/B test from Meta Marketing API
 */
export async function syncTestAnalytics(testId: string): Promise<any> {
  try {
    // Fetch test with user data
    const test = await prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: true,
        user: true,
      },
    });

    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (!test.user.metaAccessToken) {
      throw new Error(`User ${test.userId} has no Meta access token`);
    }

    if (!test.metaCampaignId) {
      console.log(`Test ${testId} has no Meta campaign ID, skipping`);
      return null;
    }

    console.log(`Syncing analytics for test ${testId} (campaign ${test.metaCampaignId})`);

    // Fetch insights from Meta Marketing API
    const insights = await getCampaignInsights(
      test.user.metaAccessToken,
      test.metaCampaignId
    );

    if (!insights) {
      console.log(`No insights available for test ${testId}`);
      return null;
    }

    // Store campaign-level analytics
    const analyticsData = {
      abTestId: test.id,
      metaAdId: test.metaCampaignId,
      date: new Date(),
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      ctr: parseFloat(insights.ctr || '0'),
      conversions: parseInt(insights.conversions || '0'),
      spend: parseFloat(insights.spend || '0'),
      cpc: parseFloat(insights.cpc || '0'),
      cpm: parseFloat(insights.cpm || '0'),
      roas: insights.roas ? parseFloat(insights.roas) : null,
    };

    // Check if we already have analytics for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAnalytics = await prisma.adAnalytics.findFirst({
      where: {
        abTestId: test.id,
        metaAdId: test.metaCampaignId,
        date: {
          gte: today,
        },
      },
    });

    let result;
    if (existingAnalytics) {
      // Update existing analytics
      result = await prisma.adAnalytics.update({
        where: { id: existingAnalytics.id },
        data: analyticsData,
      });
      console.log(`Updated analytics for test ${testId}`);
    } else {
      // Create new analytics entry
      result = await prisma.adAnalytics.create({
        data: analyticsData,
      });
      console.log(`Created new analytics for test ${testId}`);
    }

    // Update test status if needed
    if (test.status === 'created' && insights.impressions && parseInt(insights.impressions) > 0) {
      await prisma.aBTest.update({
        where: { id: test.id },
        data: {
          status: 'active',
          startDate: test.startDate || new Date(),
        },
      });
    }

    return result;
  } catch (error) {
    console.error(`Error syncing analytics for test ${testId}:`, error);
    throw error;
  }
}

/**
 * Sync analytics for all active tests
 */
export async function syncAllActiveTests(): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ testId: string; error: string }>;
}> {
  console.log('Starting analytics sync for all active tests...');

  const stats = {
    synced: 0,
    failed: 0,
    errors: [] as Array<{ testId: string; error: string }>,
  };

  try {
    // Fetch all active tests with Meta campaigns
    const activeTests = await prisma.aBTest.findMany({
      where: {
        status: {
          in: ['active', 'created'],
        },
        metaCampaignId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            metaAccessToken: true,
          },
        },
      },
    });

    console.log(`Found ${activeTests.length} active tests to sync`);

    // Sync each test
    for (const test of activeTests) {
      // Skip if user has no Meta access token
      if (!test.user.metaAccessToken) {
        console.log(`Skipping test ${test.id} - user has no Meta access token`);
        continue;
      }

      try {
        await syncTestAnalytics(test.id);
        stats.synced++;
      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push({
          testId: test.id,
          error: errorMessage,
        });
        console.error(`Failed to sync test ${test.id}:`, errorMessage);
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`Analytics sync complete: ${stats.synced} synced, ${stats.failed} failed`);
    return stats;
  } catch (error) {
    console.error('Error in syncAllActiveTests:', error);
    throw error;
  }
}

/**
 * Sync analytics for a specific user's tests
 */
export async function syncUserTests(userId: string): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ testId: string; error: string }>;
}> {
  console.log(`Syncing analytics for user ${userId}...`);

  const stats = {
    synced: 0,
    failed: 0,
    errors: [] as Array<{ testId: string; error: string }>,
  };

  try {
    const userTests = await prisma.aBTest.findMany({
      where: {
        userId,
        status: {
          in: ['active', 'created'],
        },
        metaCampaignId: {
          not: null,
        },
      },
    });

    console.log(`Found ${userTests.length} tests for user ${userId}`);

    for (const test of userTests) {
      try {
        await syncTestAnalytics(test.id);
        stats.synced++;
      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push({
          testId: test.id,
          error: errorMessage,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`User ${userId} sync complete: ${stats.synced} synced, ${stats.failed} failed`);
    return stats;
  } catch (error) {
    console.error(`Error syncing tests for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get ad-level insights (more detailed than campaign-level)
 * This is for future enhancement when we want variant-specific analytics
 */
export async function syncVariantAnalytics(testId: string): Promise<void> {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: {
      variants: true,
      user: true,
    },
  });

  if (!test || !test.user.metaAccessToken) {
    return;
  }

  // TODO: Implement ad-level insights fetching
  // This would involve calling Meta's API for each ad individually
  // and storing analytics per variant instead of per campaign
  console.log('Variant-level analytics sync not yet implemented');
}
