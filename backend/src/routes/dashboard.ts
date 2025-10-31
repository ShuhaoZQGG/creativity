import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSignedUrl } from '../services/storage.js';

const router = Router();

// Get dashboard data
router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Get user's creatives with their scores
    const creatives = await prisma.creative.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get AB tests with results
    const abTests = await prisma.aBTest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary statistics
    const creativesWithMetrics = await Promise.all(
      creatives.map(async (creative) => {
        const textVariant = creative.textVariant as any;
        const score = creative.score as any;

        // Find AB test results for this creative
        const relatedTest = abTests.find((test) =>
          test.creativeIds.includes(creative.id)
        );

        const results = relatedTest?.results as any;

        return {
          id: creative.id,
          headline: textVariant.headline,
          body: textVariant.body,
          cta: textVariant.cta,
          image_url: creative.imageUrls[0] ? await getSignedUrl(creative.imageUrls[0] as string) : null,
          score: score?.overall || 0,
          ctr: results?.ctr ? parseFloat(results.ctr) : null,
          cpc: results?.cpc ? parseFloat(results.cpc) : null,
          spend: results?.spend ? parseFloat(results.spend) : null,
          impressions: results?.impressions ? parseInt(results.impressions) : null,
          clicks: results?.clicks ? parseInt(results.clicks) : null,
          created_at: creative.createdAt,
        };
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
        ? creatives.reduce((sum, c) => {
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
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
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
    const dailyStats = creatives.reduce((acc: any, creative) => {
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

export default router;
