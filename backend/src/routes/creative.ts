import { Router } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { generateAdText, generateImage, scoreAdCreative, generateImageVariation } from '../services/ai.js';
import { uploadImageFromUrl, getSignedUrl, uploadImage } from '../services/storage.js';
import { analyzeWebsite } from '../services/websiteScraper.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

// Upload base image for creative generation
router.post('/upload-base-image', requireAuth, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('[Upload] Received image upload');
    console.log('[Upload] File size:', req.file.size, 'bytes');
    console.log('[Upload] Content type:', req.file.mimetype);

    const userId = req.user!.id;

    // Upload to S3
    const s3Key = await uploadImage(req.file.buffer, userId, req.file.mimetype);
    console.log('[Upload] Uploaded to S3:', s3Key);

    // Generate signed URL for the response
    const signedUrl = await getSignedUrl(s3Key);

    res.json({
      success: true,
      s3Key,
      imageUrl: signedUrl,
    });
  } catch (error) {
    console.error('Upload base image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Analyze website for brand style
router.post('/analyze-website', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { website_url } = req.body;

    if (!website_url) {
      return res.status(400).json({ error: 'website_url is required' });
    }

    console.log('[API] Analyzing website:', website_url);
    const userId = req.user!.id;

    const analysis = await analyzeWebsite(website_url, userId);

    // Generate signed URL for screenshot
    const screenshotUrl = await getSignedUrl(analysis.screenshotUrl);

    res.json({
      success: true,
      analysis: {
        ...analysis,
        screenshotUrl, // Override with signed URL
      },
    });
  } catch (error: any) {
    console.error('Analyze website error:', error);
    res.status(500).json({
      error: 'Failed to analyze website',
      message: error.message,
    });
  }
});

// Generate ad creatives
router.post('/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      brand_name,
      product_description,
      target_audience,
      tone = 'friendly',
      num_variants = 3,
      input_image_url,
      website_url,
      base_image_s3_key,
      website_analysis_data,
    } = req.body;

    console.log('[Creative] Generate request received');
    console.log('[Creative] User ID:', req.user!.id);
    console.log('[Creative] Brand:', brand_name);
    console.log('[Creative] Variants requested:', num_variants);
    console.log('[Creative] Base image provided:', !!base_image_s3_key);
    console.log('[Creative] Website analysis provided:', !!website_analysis_data);

    if (!brand_name || !product_description || !target_audience) {
      return res.status(400).json({
        error: 'brand_name, product_description, and target_audience are required',
      });
    }

    const userId = req.user!.id;

    // Generate text variants
    console.log('[Creative] Step 1: Generating text variants...');
    const textVariants = await generateAdText({
      brandName: brand_name,
      productDescription: product_description,
      targetAudience: target_audience,
      tone,
      numVariants: num_variants,
      websiteAnalysis: website_analysis_data,
    });
    console.log('[Creative] Text variants generated:', textVariants.length);

    // Generate creatives for each text variant
    console.log('[Creative] Step 2: Generating images and creatives...');
    const creatives = await Promise.all(
      textVariants.map(async (textVariant, index) => {
        console.log(`[Creative] Processing variant ${index + 1}/${textVariants.length}`);
        console.log(`[Creative] Headline: ${textVariant.headline}`);

        let s3Key: string;

        if (base_image_s3_key) {
          // Use base image - generate variation
          console.log(`[Creative] Using base image for variant ${index + 1}...`);
          const baseImageUrl = await getSignedUrl(base_image_s3_key);
          const imagePrompt = `${product_description} for ${target_audience}, ${brand_name} brand style. ${textVariant.headline}`;

          console.log(`[Creative] Generating image variation for variant ${index + 1}...`);
          const generatedImageUrl = await generateImageVariation(baseImageUrl, imagePrompt);
          console.log(`[Creative] Image variation generated for variant ${index + 1}`);

          // Upload to S3 (returns S3 key)
          console.log(`[Creative] Uploading to S3 for variant ${index + 1}...`);
          s3Key = await uploadImageFromUrl(generatedImageUrl, userId);
          console.log(`[Creative] Uploaded to S3: ${s3Key}`);
        } else {
          // Generate image from scratch
          const imagePrompt = `${product_description} for ${target_audience}, ${brand_name} brand style`;
          console.log(`[Creative] Generating image for variant ${index + 1}...`);
          const generatedImageUrl = await generateImage(imagePrompt);
          console.log(`[Creative] Image generated for variant ${index + 1}`);

          // Upload to S3 (returns S3 key)
          console.log(`[Creative] Uploading to S3 for variant ${index + 1}...`);
          s3Key = await uploadImageFromUrl(generatedImageUrl, userId);
          console.log(`[Creative] Uploaded to S3: ${s3Key}`);
        }

        // Score the creative
        console.log(`[Creative] Scoring variant ${index + 1}...`);
        const score = await scoreAdCreative(
          textVariant.headline,
          textVariant.body,
          textVariant.cta
        );
        console.log(`[Creative] Score for variant ${index + 1}:`, score.overall);

        // Save to database (store S3 key, not URL)
        console.log(`[Creative] Saving to database for variant ${index + 1}...`);
        const creative = await prisma.creative.create({
          data: {
            userId,
            inputContext: {
              brand_name,
              product_description,
              target_audience,
              tone,
              website_url,
              base_image_s3_key,
            },
            textVariant: {
              headline: textVariant.headline,
              body: textVariant.body,
              cta: textVariant.cta,
            },
            imageUrls: [s3Key],
            videoUrls: [],
            score,
          },
        });
        console.log(`[Creative] Saved to database: ${creative.id}`);

        // Generate signed URL for the response (expires in 7 days)
        const signedImageUrl = await getSignedUrl(s3Key);

        return {
          id: creative.id,
          headline: textVariant.headline,
          body: textVariant.body,
          cta: textVariant.cta,
          image_url: signedImageUrl,
          score,
        };
      })
    );

    console.log('[Creative] All creatives generated successfully:', creatives.length);

    res.json({
      status: 'success',
      creatives,
    });
  } catch (error) {
    console.error('Generate creative error:', error);
    res.status(500).json({ error: 'Failed to generate creatives' });
  }
});

// Re-score a creative
router.post('/score', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { creative_id } = req.body;

    if (!creative_id) {
      return res.status(400).json({ error: 'creative_id is required' });
    }

    const creative = await prisma.creative.findUnique({
      where: { id: creative_id },
    });

    if (!creative || creative.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Creative not found' });
    }

    const textVariant = creative.textVariant as any;
    const newScore = await scoreAdCreative(
      textVariant.headline,
      textVariant.body,
      textVariant.cta
    );

    await prisma.creative.update({
      where: { id: creative_id },
      data: { score: newScore },
    });

    res.json({
      creative_id,
      new_score: newScore,
    });
  } catch (error) {
    console.error('Score creative error:', error);
    res.status(500).json({ error: 'Failed to score creative' });
  }
});

// Get user's creatives with pagination, filtering, and sorting
router.get('/creatives', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId: req.user!.id };

    // Add search filter (search in headline, body, brand_name)
    if (search) {
      where.OR = [
        {
          textVariant: {
            path: ['headline'],
            string_contains: search as string,
          },
        },
        {
          textVariant: {
            path: ['body'],
            string_contains: search as string,
          },
        },
        {
          inputContext: {
            path: ['brand_name'],
            string_contains: search as string,
          },
        },
      ];
    }

    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'score') {
      orderBy.score = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.creative.count({ where });

    // Get creatives
    const creatives = await prisma.creative.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Generate signed URLs for all image keys
    const creativesWithSignedUrls = await Promise.all(
      creatives.map(async creative => ({
        ...creative,
        imageUrls: await Promise.all((creative.imageUrls as string[]).map(s3Key => getSignedUrl(s3Key))),
        videoUrls: await Promise.all((creative.videoUrls as string[]).map(s3Key => getSignedUrl(s3Key))),
      }))
    );

    res.json({
      creatives: creativesWithSignedUrls,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get creatives error:', error);
    res.status(500).json({ error: 'Failed to get creatives' });
  }
});

// Get single creative
router.get('/creatives/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const creative = await prisma.creative.findUnique({
      where: { id: req.params.id },
    });

    if (!creative || creative.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Creative not found' });
    }

    // Generate signed URLs for image and video keys
    const creativeWithSignedUrls = {
      ...creative,
      imageUrls: await Promise.all((creative.imageUrls as string[]).map(s3Key => getSignedUrl(s3Key))),
      videoUrls: await Promise.all((creative.videoUrls as string[]).map(s3Key => getSignedUrl(s3Key))),
    };

    res.json({ creative: creativeWithSignedUrls });
  } catch (error) {
    console.error('Get creative error:', error);
    res.status(500).json({ error: 'Failed to get creative' });
  }
});

// Delete a creative
router.delete('/creatives/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const creative = await prisma.creative.findUnique({
      where: { id: req.params.id },
    });

    if (!creative || creative.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Creative not found' });
    }

    await prisma.creative.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Creative deleted successfully' });
  } catch (error) {
    console.error('Delete creative error:', error);
    res.status(500).json({ error: 'Failed to delete creative' });
  }
});

export default router;
