import { Request, Response, NextFunction, Router } from 'express';
import { storage } from './storage';
import Stripe from 'stripe';
import { z } from 'zod';

interface AuthRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
  login(user: any, callback: (err: any) => void): void;
  logout(callback: (err: any) => void): void;
}

// Initialize Stripe if API key is available
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
} else {
  console.warn('STRIPE_SECRET_KEY not set. Stripe functionality will be unavailable.');
}

// Auth middleware for subscription routes
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Schema for changing plan
const changePlanSchema = z.object({
  planId: z.number(),
});

// Schema for changing billing cycle
const changeBillingCycleSchema = z.object({
  billingCycle: z.enum(['monthly', 'yearly']),
});

// Schema for cancellation
const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean(),
  cancelReason: z.string().optional(),
});

/**
 * Register subscription-related routes
 */
export default function registerSubscriptionRoutes(app: Router) {
  // Get available subscription plans
  app.get('/api/subscription-plans', async (req: Request, res: Response) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Get current vendor subscription
  app.get('/api/vendor/subscription', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      
      if (!vendorId) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      const subscription = await storage.getVendorSubscription(vendorId);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      res.json(subscription);
    } catch (error: any) {
      console.error('Error fetching vendor subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription details' });
    }
  });

  // Start a trial subscription
  app.post('/api/vendor/subscription/start-trial', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { planId } = changePlanSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get the vendor ID
      const vendorId = await storage.getVendorIdByUserId(userId);
      
      if (!vendorId) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Check if vendor already has a subscription
      const existingSubscription = await storage.getVendorSubscription(vendorId);
      
      if (existingSubscription) {
        return res.status(400).json({ message: 'Vendor already has a subscription' });
      }

      // Get the plan
      const plan = await storage.getSubscriptionPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // Calculate trial end date
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);

      // Create a subscription record
      const subscription = await storage.createVendorSubscription({
        vendorId,
        planId,
        status: 'trialing',
        startDate: new Date(),
        trialEndsAt,
        billingCycle: 'monthly', // Default to monthly
        amount: plan.price,
        currency: 'USD',
        renewalDate: trialEndsAt, // Renewal will be after trial
      });

      res.status(201).json(subscription);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      
      console.error('Error starting trial subscription:', error);
      res.status(500).json({ message: 'Failed to start trial subscription' });
    }
  });

  // Change subscription plan
  app.post('/api/vendor/subscription/change-plan', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { planId } = changePlanSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get the vendor ID
      const vendorId = await storage.getVendorIdByUserId(userId);
      
      if (!vendorId) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const currentSubscription = await storage.getVendorSubscription(vendorId);
      
      if (!currentSubscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // Get the new plan
      const newPlan = await storage.getSubscriptionPlanById(planId);
      
      if (!newPlan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // If we have Stripe integration
      if (stripe && currentSubscription.stripeSubscriptionId) {
        try {
          // Get the price ID based on billing cycle
          const stripePriceId = currentSubscription.billingCycle === 'yearly' 
            ? newPlan.stripePriceIdYearly 
            : newPlan.stripePriceIdMonthly;
          
          if (!stripePriceId) {
            return res.status(400).json({ 
              message: `No Stripe price ID found for ${currentSubscription.billingCycle} billing cycle` 
            });
          }

          // Update the subscription in Stripe
          await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
            items: [{
              id: currentSubscription.stripeItemId || '',
              price: stripePriceId,
            }],
          });
          
        } catch (stripeErr: any) {
          console.error('Stripe subscription update error:', stripeErr);
          return res.status(500).json({ 
            message: 'Failed to update subscription with payment provider',
            error: stripeErr.message
          });
        }
      }

      // Update the subscription in our database
      const amount = currentSubscription.billingCycle === 'yearly' 
        ? newPlan.yearlyPrice || newPlan.price 
        : newPlan.price;

      const updatedSubscription = await storage.updateVendorSubscription(currentSubscription.id, {
        planId,
        amount,
      });

      res.json(updatedSubscription);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      
      console.error('Error changing subscription plan:', error);
      res.status(500).json({ message: 'Failed to change subscription plan' });
    }
  });

  // Change billing cycle (monthly/yearly)
  app.post('/api/vendor/subscription/change-billing-cycle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { billingCycle } = changeBillingCycleSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get the vendor ID
      const vendorId = await storage.getVendorIdByUserId(userId);
      
      if (!vendorId) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await storage.getVendorSubscription(vendorId);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // Get the plan
      const plan = await storage.getSubscriptionPlanById(subscription.planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // If already on the requested billing cycle, return early
      if (subscription.billingCycle === billingCycle) {
        return res.status(400).json({ 
          message: `Subscription is already on ${billingCycle} billing cycle` 
        });
      }

      // If we have Stripe integration
      if (stripe && subscription.stripeSubscriptionId) {
        try {
          // Get the price ID based on new billing cycle
          const stripePriceId = billingCycle === 'yearly' 
            ? plan.stripePriceIdYearly 
            : plan.stripePriceIdMonthly;
          
          if (!stripePriceId) {
            return res.status(400).json({ 
              message: `No Stripe price ID found for ${billingCycle} billing cycle` 
            });
          }

          // Update the subscription in Stripe
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{
              id: subscription.stripeItemId || '',
              price: stripePriceId,
            }],
          });
          
        } catch (stripeErr: any) {
          console.error('Stripe subscription update error:', stripeErr);
          return res.status(500).json({ 
            message: 'Failed to update billing cycle with payment provider',
            error: stripeErr.message
          });
        }
      }

      // Determine the new amount based on billing cycle
      const amount = billingCycle === 'yearly' 
        ? plan.yearlyPrice || plan.price
        : plan.price;

      // Update the subscription in our database
      const updatedSubscription = await storage.updateVendorSubscription(subscription.id, {
        billingCycle,
        amount,
      });

      res.json(updatedSubscription);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      
      console.error('Error changing billing cycle:', error);
      res.status(500).json({ message: 'Failed to change billing cycle' });
    }
  });

  // Cancel subscription
  app.post('/api/vendor/subscription/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { cancelAtPeriodEnd, cancelReason } = cancelSubscriptionSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get the vendor ID
      const vendorId = await storage.getVendorIdByUserId(userId);
      
      if (!vendorId) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await storage.getVendorSubscription(vendorId);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // If subscription is already canceled, return early
      if (subscription.status === 'canceled' || subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ message: 'Subscription is already canceled' });
      }

      // If we have Stripe integration
      if (stripe && subscription.stripeSubscriptionId) {
        try {
          // Update the subscription in Stripe
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: cancelAtPeriodEnd,
          });
          
        } catch (stripeErr: any) {
          console.error('Stripe subscription cancellation error:', stripeErr);
          return res.status(500).json({ 
            message: 'Failed to cancel subscription with payment provider',
            error: stripeErr.message
          });
        }
      }

      // Update the subscription in our database
      const updatedSubscription = await storage.updateVendorSubscription(subscription.id, {
        cancelAtPeriodEnd,
        cancelReason: cancelReason || null,
        ...(cancelAtPeriodEnd ? {} : { status: 'canceled', endDate: new Date() }),
      });

      res.json(updatedSubscription);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  return app;
}