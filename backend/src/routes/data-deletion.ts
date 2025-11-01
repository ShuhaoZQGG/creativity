import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const router = Router();

/**
 * Data Deletion Request Endpoint
 *
 * This endpoint handles:
 * 1. Manual deletion requests from users via the web form
 * 2. Automated deletion callbacks from Meta/Facebook
 *
 * Meta's Deletion Request Callback:
 * When a user deletes your app from their Facebook settings, Meta sends a signed request
 * to this endpoint. You must:
 * - Verify the signature
 * - Delete the user's data
 * - Return a confirmation URL with a unique deletion ID
 */

// POST /api/data-deletion - Manual deletion request from web form
router.post('/', async (req, res) => {
  try {
    const { email, facebook_user_id, reason } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists for privacy
      return res.json({
        status: 'submitted',
        message: 'If an account with this email exists, it will be deleted within 30 days.',
      });
    }

    // Create deletion request record (for tracking and delayed deletion)
    const deletionId = crypto.randomBytes(16).toString('hex');

    // In a real implementation, you would:
    // 1. Create a deletion_request record in database
    // 2. Send confirmation email to user
    // 3. Schedule actual deletion after 30 days (grace period)
    // 4. Allow user to cancel within grace period

    // For now, we'll perform immediate deletion
    await deleteUserData(user.id);

    // Log the deletion request
    console.log(`Data deletion request: User ${user.id}, Email: ${email}, Reason: ${reason || 'Not provided'}`);

    res.json({
      status: 'submitted',
      deletion_id: deletionId,
      message: 'Your data deletion request has been submitted and will be processed within 30 days.',
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

// POST /api/data-deletion/callback - Meta's automated deletion callback
router.post('/callback', async (req, res) => {
  try {
    const signedRequest = req.body.signed_request;

    if (!signedRequest) {
      return res.status(400).json({ error: 'Missing signed_request parameter' });
    }

    // Parse and verify Meta's signed request
    const { user_id, deletion_id } = parseSignedRequest(signedRequest);

    if (!user_id) {
      return res.status(400).json({ error: 'Invalid signed request' });
    }

    // Find user by Facebook user ID
    const user = await prisma.user.findFirst({
      where: {
        // Assuming you store Facebook user ID in a field
        // Adjust this based on your actual schema
        id: user_id, // or metaUserId if you have such a field
      },
    });

    if (user) {
      // Delete user data
      await deleteUserData(user.id);
      console.log(`Data deleted via Meta callback: User ${user.id}, Facebook ID: ${user_id}`);
    }

    // Generate unique confirmation URL
    const confirmationCode = deletion_id || crypto.randomBytes(16).toString('hex');
    const statusUrl = `${process.env.FRONTEND_URL || 'https://your-app.com'}/data-deletion-status?id=${confirmationCode}`;

    // Meta expects this response format
    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Meta deletion callback error:', error);
    res.status(500).json({ error: 'Failed to process deletion callback' });
  }
});

// GET /api/data-deletion/status/:id - Check deletion status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, check deletion_request table
    // For now, return a generic success message
    res.json({
      status: 'completed',
      message: 'Data deletion has been completed.',
      deletion_id: id,
    });
  } catch (error) {
    console.error('Deletion status check error:', error);
    res.status(500).json({ error: 'Failed to check deletion status' });
  }
});

/**
 * Delete all user data from the database
 */
async function deleteUserData(userId: string): Promise<void> {
  try {
    // Delete in order to respect foreign key constraints

    // 1. Delete ad analytics
    await prisma.adAnalytics.deleteMany({
      where: {
        abTest: {
          userId: userId
        }
      },
    });

    // 2. Delete A/B test variants
    await prisma.aBTestVariant.deleteMany({
      where: {
        abTest: {
          userId: userId
        }
      },
    });

    // 3. Delete A/B tests
    await prisma.aBTest.deleteMany({
      where: { userId },
    });

    // 4. Delete creatives and their images
    const creatives = await prisma.creative.findMany({
      where: { userId },
      select: { imageUrls: true },
    });

    // Delete images from S3 (if you have a storage service)
    // for (const creative of creatives) {
    //   for (const imageUrl of creative.imageUrls as string[]) {
    //     await deleteFromS3(imageUrl);
    //   }
    // }

    await prisma.creative.deleteMany({
      where: { userId },
    });

    // 5. Delete user account
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`Successfully deleted all data for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting user data for ${userId}:`, error);
    throw error;
  }
}

/**
 * Parse and verify Meta's signed request
 *
 * Meta sends signed requests in the format: <signature>.<payload>
 * The signature is HMAC-SHA256 of the payload using your app secret
 */
function parseSignedRequest(signedRequest: string): { user_id: string | null; deletion_id: string | null } {
  try {
    const [encodedSig, payload] = signedRequest.split('.');

    if (!encodedSig || !payload) {
      return { user_id: null, deletion_id: null };
    }

    // Decode payload
    const payloadBuffer = Buffer.from(payload, 'base64');
    const data = JSON.parse(payloadBuffer.toString());

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.META_APP_SECRET || '')
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const actualSig = encodedSig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    if (expectedSig !== actualSig) {
      console.error('Invalid signature in signed request');
      return { user_id: null, deletion_id: null };
    }

    return {
      user_id: data.user_id || null,
      deletion_id: data.deletion_id || null,
    };
  } catch (error) {
    console.error('Error parsing signed request:', error);
    return { user_id: null, deletion_id: null };
  }
}

export default router;
