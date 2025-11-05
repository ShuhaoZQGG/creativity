import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

// Get dashboard data
router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log('[Dashboard] Fetching data for user:', req.user!.id);

    // Get user's creatives with their scores
    const creatives = await prisma.creative.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('[Dashboard] Found creatives:', creatives.length);

    // Get AB tests with results
    const abTests = await prisma.aBTest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[Dashboard] Found AB tests:', abTests.length);

    // Calculate summary statistics
    const creativesWithMetrics = await Promise.all(
      creatives.map(async (creative: any) => {
        try {
          const textVariant = creative.textVariant as any;
          const score = creative.score as any;

          // Find AB test results for this creative
          const relatedTest = abTests.find((test: any) =>
            test.creativeIds.includes(creative.id)
          );

          const results = relatedTest?.results as any;

          let imageUrl = null;
          if (creative.imageUrls && creative.imageUrls[0]) {
            try {
              imageUrl = await getSignedUrl(creative.imageUrls[0] as string);
            } catch (imageError) {
              console.error('[Dashboard] Error getting signed URL for creative', creative.id, imageError);
              // Continue without image URL
            }
          }

          return {
            id: creative.id,
            headline: textVariant?.headline || '',
            body: textVariant?.body || '',
            cta: textVariant?.cta || '',
            image_url: imageUrl,
            score: score?.overall || 0,
            ctr: results?.ctr ? parseFloat(results.ctr) : null,
            cpc: results?.cpc ? parseFloat(results.cpc) : null,
            spend: results?.spend ? parseFloat(results.spend) : null,
            impressions: results?.impressions ? parseInt(results.impressions) : null,
            clicks: results?.clicks ? parseInt(results.clicks) : null,
            created_at: creative.createdAt,
          };
        } catch (creativeError) {
          console.error('[Dashboard] Error processing creative', creative.id, creativeError);
          // Return a minimal creative object
          return {
            id: creative.id,
            headline: '',
            body: '',
            cta: '',
            image_url: null,
            score: 0,
            ctr: null,
            cpc: null,
            spend: null,
            impressions: null,
            clicks: null,
            created_at: creative.createdAt,
          };
        }
      })
    );

    // Calculate averages
    const creativesWithCTR = creativesWithMetrics.filter((c) => c.ctr !== null);
    const avgCTR =
      creativesWithCTR.length > 0
        ? creativesWithCTR.reduce((sum, c) => sum + (c.ctr || 0), 0) / creativesWithCTR.length
        : 0;

    const avgScore =
      creatives.length > 0
        ? creatives.reduce((sum: any, c: any) => {
            const score = c.score as any;
            return sum + (score?.overall || 0);
          }, 0) / creatives.length
        : 0;

    // Find top creative
    const topCreative = creativesWithMetrics.reduce(
      (best, current) => {
        const currentScore = (current.ctr || 0) + current.score;
        const bestScore = (best?.ctr || 0) + (best?.score || 0);
        return currentScore > bestScore ? current : best;
      },
      creativesWithMetrics[0] || null
    );

    console.log('[Dashboard] Returning data:', {
      creativesCount: creativesWithMetrics.length,
      testsCount: abTests.length,
    });

    res.json({
      creatives: creativesWithMetrics,
      summary: {
        total_creatives: creatives.length,
        total_tests: abTests.length,
        avg_ctr: avgCTR,
        avg_score: avgScore,
        top_creative_id: topCreative?.id || null,
      },
    });
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    console.error('[Dashboard] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analytics
router.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    const whereClause: any = { userId: req.user!.id };

    if (start_date && end_date) {
      whereClause.createdAt = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string),
      };
    }

    const creatives = await prisma.creative.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    const abTests = await prisma.aBTest.findMany({
      where: whereClause,
    });

    // Group by date
    const dailyStats = creatives.reduce((acc: any, creative: any) => {
      const date = creative.createdAt.toISOString().split('T')[0];

      if (!acc[date]) {
        acc[date] = {
          date,
          creatives_generated: 0,
          avg_score: 0,
          total_score: 0,
        };
      }

      acc[date].creatives_generated++;
      const score = creative.score as any;
      acc[date].total_score += score?.overall || 0;
      acc[date].avg_score = acc[date].total_score / acc[date].creatives_generated;

      return acc;
    }, {});

    res.json({
      daily_stats: Object.values(dailyStats),
      total_creatives: creatives.length,
      total_tests: abTests.length,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get KPIs with trend indicators
router.get('/dashboard/kpis', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { period = '7d' } = req.query;

    // Helper function to get date range
    const getDateRange = (periodStr: string) => {
      const now = new Date();
      let days = 7;

      if (periodStr === '30d') days = 30;
      else if (periodStr === '90d') days = 90;

      const start = new Date(now);
      start.setDate(start.getDate() - days);

      return { start, end: now, days };
    };

    const currentRange = getDateRange(period as string);
    const previousRange = {
      start: new Date(currentRange.start),
      end: new Date(currentRange.start),
    };
    previousRange.start.setDate(previousRange.start.getDate() - currentRange.days);

    // Calculate current period metrics
    const currentCreatives = await prisma.creative.count({
      where: {
        userId: req.user!.id,
        createdAt: { gte: currentRange.start, lte: currentRange.end },
      },
    });

    const currentTests = await prisma.aBTest.count({
      where: {
        userId: req.user!.id,
        status: 'active',
      },
    });

    const currentAnalytics = await prisma.adAnalytics.findMany({
      where: {
        abTest: { userId: req.user!.id },
        date: { gte: currentRange.start, lte: currentRange.end },
      },
    });

    // Calculate previous period metrics
    const previousCreatives = await prisma.creative.count({
      where: {
        userId: req.user!.id,
        createdAt: { gte: previousRange.start, lte: previousRange.end },
      },
    });

    const previousAnalytics = await prisma.adAnalytics.findMany({
      where: {
        abTest: { userId: req.user!.id },
        date: { gte: previousRange.start, lte: previousRange.end },
      },
    });

    // Calculate current metrics
    const currentTotalSpend = currentAnalytics.reduce((sum, a) => sum + a.spend, 0);
    const currentTotalClicks = currentAnalytics.reduce((sum, a) => sum + a.clicks, 0);
    const currentTotalImpressions = currentAnalytics.reduce((sum, a) => sum + a.impressions, 0);
    const currentTotalConversions = currentAnalytics.reduce((sum, a) => sum + a.conversions, 0);

    const currentAvgCtr =
      currentTotalImpressions > 0 ? currentTotalClicks / currentTotalImpressions : 0;
    const currentAvgCpc = currentTotalClicks > 0 ? currentTotalSpend / currentTotalClicks : 0;

    // Calculate previous metrics
    const previousTotalSpend = previousAnalytics.reduce((sum, a) => sum + a.spend, 0);
    const previousTotalClicks = previousAnalytics.reduce((sum, a) => sum + a.clicks, 0);
    const previousTotalImpressions = previousAnalytics.reduce((sum, a) => sum + a.impressions, 0);
    const previousTotalConversions = previousAnalytics.reduce((sum, a) => sum + a.conversions, 0);

    const previousAvgCtr =
      previousTotalImpressions > 0 ? previousTotalClicks / previousTotalImpressions : 0;
    const previousAvgCpc = previousTotalClicks > 0 ? previousTotalSpend / previousTotalClicks : 0;

    // Helper to calculate trend
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { changePercent: 0, trend: 'stable' as const };

      const changePercent = ((current - previous) / previous) * 100;
      const trend =
        changePercent > 5 ? ('up' as const) : changePercent < -5 ? ('down' as const) : ('stable' as const);

      return { changePercent, trend };
    };

    // Find best performing creative
    const bestCreative = await prisma.creative.findFirst({
      where: { userId: req.user!.id },
      orderBy: { score: 'desc' },
    });

    res.json({
      total_creatives: {
        current: currentCreatives,
        ...calculateTrend(currentCreatives, previousCreatives),
      },
      active_tests: {
        current: currentTests,
        changePercent: 0, // Tests are active count, not time-based
        trend: 'stable' as const,
      },
      avg_ctr: {
        current: currentAvgCtr,
        ...calculateTrend(currentAvgCtr, previousAvgCtr),
      },
      total_spend: {
        current: currentTotalSpend,
        ...calculateTrend(currentTotalSpend, previousTotalSpend),
      },
      avg_cpc: {
        current: currentAvgCpc,
        ...calculateTrend(currentAvgCpc, previousAvgCpc),
      },
      conversions: {
        current: currentTotalConversions,
        ...calculateTrend(currentTotalConversions, previousTotalConversions),
      },
      best_performing: bestCreative
        ? {
            creative_id: bestCreative.id,
            metric: 'score',
            value: (bestCreative.score as any)?.overall || 0,
          }
        : null,
    });
  } catch (error) {
    console.error('KPIs error:', error);
    res.status(500).json({ error: 'Failed to get KPIs' });
  }
});

// Get performance trends over time
router.get('/dashboard/trends', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { metric = 'ctr', period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch analytics data
    const analytics = await prisma.adAnalytics.findMany({
      where: {
        abTest: { userId: req.user!.id },
        date: { gte: startDate, lte: now },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date and calculate metric
    const dailyData: Record<string, { date: string; value: number; count: number }> = {};

    analytics.forEach((a) => {
      const dateKey = a.date.toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, value: 0, count: 0 };
      }

      let value = 0;
      switch (metric) {
        case 'ctr':
          value = a.ctr;
          break;
        case 'cpc':
          value = a.cpc;
          break;
        case 'cpm':
          value = a.cpm;
          break;
        case 'conversions':
          value = a.conversions;
          break;
        case 'spend':
          value = a.spend;
          break;
        case 'impressions':
          value = a.impressions;
          break;
        case 'clicks':
          value = a.clicks;
          break;
        default:
          value = a.ctr;
      }

      dailyData[dateKey].value += value;
      dailyData[dateKey].count += 1;
    });

    // Calculate averages
    const trendData = Object.values(dailyData).map((d) => ({
      date: d.date,
      value: d.count > 0 ? d.value / d.count : 0,
    }));

    res.json({
      metric: metric as string,
      period: period as string,
      data: trendData,
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

export default router;
