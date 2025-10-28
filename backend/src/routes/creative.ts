import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { generateAdText, generateImage, scoreAdCreative } from '../services/ai.js';
import { uploadImageFromUrl, getSignedUrl } from '../services/storage.js';

const router = Router();

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
    } = req.body;

    console.log('[Creative] Generate request received');
    console.log('[Creative] User ID:', req.user!.id);
    console.log('[Creative] Brand:', brand_name);
    console.log('[Creative] Variants requested:', num_variants);

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
    });
    console.log('[Creative] Text variants generated:', textVariants.length);

    // Generate creatives for each text variant
    console.log('[Creative] Step 2: Generating images and creatives...');
    const creatives = await Promise.all(
      textVariants.map(async (textVariant, index) => {
        console.log(`[Creative] Processing variant ${index + 1}/${textVariants.length}`);
        console.log(`[Creative] Headline: ${textVariant.headline}`);

        // Generate image
        const imagePrompt = `${product_description} for ${target_audience}, ${brand_name} brand style`;
        console.log(`[Creative] Generating image for variant ${index + 1}...`);
        const generatedImageUrl = await generateImage(imagePrompt);
        console.log(`[Creative] Image generated for variant ${index + 1}`);

        // Upload to S3 (returns S3 key)
        console.log(`[Creative] Uploading to S3 for variant ${index + 1}...`);
        const s3Key = await uploadImageFromUrl(generatedImageUrl, userId);
        console.log(`[Creative] Uploaded to S3: ${s3Key}`);

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
        const signedImageUrl = getSignedUrl(s3Key);

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

// Get user's creatives
router.get('/creatives', requireAuth, async (req: AuthRequest, res) => {
  try {
    const creatives = await prisma.creative.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    // Generate signed URLs for all image keys
    const creativesWithSignedUrls = creatives.map(creative => ({
      ...creative,
      imageUrls: (creative.imageUrls as string[]).map(s3Key => getSignedUrl(s3Key)),
      videoUrls: (creative.videoUrls as string[]).map(s3Key => getSignedUrl(s3Key)),
    }));

    res.json({ creatives: creativesWithSignedUrls });
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
      imageUrls: (creative.imageUrls as string[]).map(s3Key => getSignedUrl(s3Key)),
      videoUrls: (creative.videoUrls as string[]).map(s3Key => getSignedUrl(s3Key)),
    };

    res.json({ creative: creativeWithSignedUrls });
  } catch (error) {
    console.error('Get creative error:', error);
    res.status(500).json({ error: 'Failed to get creative' });
  }
});

export default router;
