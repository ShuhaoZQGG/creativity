import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { createCustomer, createCheckoutSession, stripe } from '../services/stripe.js';

const router = Router();

// Pricing plans (these should be created in Stripe dashboard)
const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    name: 'Pro',
    price: 49,
  },
  business: {
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
    name: 'Business',
    price: 99,
  },
};

// Create checkout session
router.post('/create-checkout-session', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { billing: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.billing?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      customerId = await createCustomer(user.email, user.name || undefined);

      await prisma.billing.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    const checkoutUrl = await createCheckoutSession(
      customerId,
      selectedPlan.priceId,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=true`,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?canceled=true`
    );

    res.json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Update billing record
        await prisma.billing.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: 'active',
          },
        });

        // Update user subscription tier
        const billing = await prisma.billing.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billing) {
          await prisma.user.update({
            where: { id: billing.userId },
            data: { subscriptionTier: 'pro' },
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        await prisma.billing.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'canceled' },
        });

        const billing = await prisma.billing.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (billing) {
          await prisma.user.update({
            where: { id: billing.userId },
            data: { subscriptionTier: 'free' },
          });
        }

        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Get billing info
router.get('/info', requireAuth, async (req: AuthRequest, res) => {
  try {
    const billing = await prisma.billing.findUnique({
      where: { userId: req.user!.id },
    });

    res.json({ billing });
  } catch (error) {
    console.error('Get billing info error:', error);
    res.status(500).json({ error: 'Failed to get billing info' });
  }
});

export default router;
