import { Request, Response, NextFunction, Router, Express } from 'express';
import { db } from './db';
import { platformSubscriptions, subscriptionPlans, vendors } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { isAuthenticated } from './auth';

/**
 * Register subscription-related routes
 */
export default function registerSubscriptionRoutes(app: Express) {
  // Get all subscription plans (public route)
  app.get('/api/subscription-plans', async (req: Request, res: Response) => {
    try {
      const plans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlans.isActive, true),
        orderBy: (subscription) => subscription.price
      });
      
      return res.status(200).json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Get a specific subscription plan
  app.get('/api/subscription-plans/:id', async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      const plan = await db.query.subscriptionPlans.findFirst({
        where: and(
          eq(subscriptionPlans.id, planId),
          eq(subscriptionPlans.isActive, true)
        )
      });

      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      return res.status(200).json(plan);
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return res.status(500).json({ message: 'Failed to fetch subscription plan' });
    }
  });

  // Get current vendor's subscription
  app.get('/api/vendor/subscription', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Find the vendor for this user
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, req.user.id)
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await db.query.platformSubscriptions.findFirst({
        where: eq(platformSubscriptions.vendorId, vendor.id),
        orderBy: (sub) => sub.createdAt,
        orderByDesc: true,
        with: {
          plan: true
        }
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No subscription found' });
      }

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching vendor subscription:', error);
      return res.status(500).json({ message: 'Failed to fetch subscription details' });
    }
  });

  // Start a trial subscription
  app.post('/api/vendor/subscription/start-trial', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      // Find the vendor for this user
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, req.user.id)
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Check if vendor already has an active subscription
      const existingSubscription = await db.query.platformSubscriptions.findFirst({
        where: and(
          eq(platformSubscriptions.vendorId, vendor.id),
          eq(platformSubscriptions.status, 'active')
        )
      });

      if (existingSubscription) {
        return res.status(400).json({ message: 'Vendor already has an active subscription' });
      }

      // Get the plan
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });

      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      const now = new Date();
      const trialDays = plan.trialDays || 7;
      const trialEndsAt = DateTime.fromJSDate(now).plus({ days: trialDays }).toJSDate();

      // Create the trial subscription
      const [subscription] = await db.insert(platformSubscriptions).values({
        vendorId: vendor.id,
        planId: plan.id,
        status: 'trialing',
        startDate: now,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
        renewalDate: trialEndsAt,
        billingCycle: 'monthly', // Default to monthly billing for trials
      }).returning();

      // Update vendor status to reflect they're on a trial
      await db.update(vendors)
        .set({
          subscriptionStatus: 'trial',
          subscriptionPlanId: plan.id,
          trialEndsAt,
          nextBillingDate: trialEndsAt
        })
        .where(eq(vendors.id, vendor.id));

      return res.status(201).json(subscription);
    } catch (error) {
      console.error('Error starting trial subscription:', error);
      return res.status(500).json({ message: 'Failed to start trial subscription' });
    }
  });

  // Cancel a subscription
  app.post('/api/vendor/subscription/cancel', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { cancelAtPeriodEnd, cancelReason } = req.body;

      // Find the vendor for this user
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, req.user.id)
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await db.query.platformSubscriptions.findFirst({
        where: and(
          eq(platformSubscriptions.vendorId, vendor.id),
          eq(platformSubscriptions.status, 'active')
        )
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // If there's a Stripe subscription, handle cancellation there
      if (subscription.stripeSubscriptionId) {
        // TODO: Implement Stripe cancellation
        // For now, we'll just update the local records
      }

      // Update the subscription
      if (cancelAtPeriodEnd) {
        // Cancel at the end of the current period
        const [updatedSubscription] = await db.update(platformSubscriptions)
          .set({
            cancelAtPeriodEnd: true,
            cancelReason
          })
          .where(eq(platformSubscriptions.id, subscription.id))
          .returning();

        return res.status(200).json(updatedSubscription);
      } else {
        // Cancel immediately
        const now = new Date();
        const [updatedSubscription] = await db.update(platformSubscriptions)
          .set({
            status: 'canceled',
            canceledAt: now,
            cancelReason,
            endDate: now
          })
          .where(eq(platformSubscriptions.id, subscription.id))
          .returning();

        // Update vendor status
        await db.update(vendors)
          .set({
            subscriptionStatus: 'inactive'
          })
          .where(eq(vendors.id, vendor.id));

        return res.status(200).json(updatedSubscription);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Change billing cycle (monthly/yearly)
  app.post('/api/vendor/subscription/change-billing-cycle', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { billingCycle } = req.body;
      
      if (!billingCycle || (billingCycle !== 'monthly' && billingCycle !== 'yearly')) {
        return res.status(400).json({ message: 'Valid billing cycle (monthly/yearly) is required' });
      }

      // Find the vendor for this user
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, req.user.id)
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await db.query.platformSubscriptions.findFirst({
        where: and(
          eq(platformSubscriptions.vendorId, vendor.id),
          eq(platformSubscriptions.status, 'active')
        ),
        with: {
          plan: true
        }
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // If the billing cycle is the same, no changes needed
      if (subscription.billingCycle === billingCycle) {
        return res.status(200).json(subscription);
      }

      // TODO: For Stripe integration, create a new subscription with the new billing cycle
      // For now, just update the local records

      const [updatedSubscription] = await db.update(platformSubscriptions)
        .set({
          billingCycle,
          // Calculate new amount based on the plan's price
          amount: billingCycle === 'monthly' 
            ? subscription.plan.price 
            : subscription.plan.yearlyPrice
        })
        .where(eq(platformSubscriptions.id, subscription.id))
        .returning();

      return res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error('Error changing billing cycle:', error);
      return res.status(500).json({ message: 'Failed to change billing cycle' });
    }
  });

  // Change subscription plan
  app.post('/api/vendor/subscription/change-plan', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      // Find the vendor for this user
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, req.user.id)
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }

      // Get current subscription
      const subscription = await db.query.platformSubscriptions.findFirst({
        where: and(
          eq(platformSubscriptions.vendorId, vendor.id),
          eq(platformSubscriptions.status, 'active')
        )
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // Get the new plan
      const newPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });

      if (!newPlan) {
        return res.status(404).json({ message: 'New subscription plan not found' });
      }

      // If the plan is the same, no changes needed
      if (subscription.planId === newPlan.id) {
        return res.status(200).json(subscription);
      }

      // TODO: For Stripe integration, update the subscription with the new plan
      // For now, just update the local records

      const amount = subscription.billingCycle === 'monthly' 
        ? newPlan.price 
        : newPlan.yearlyPrice;

      const [updatedSubscription] = await db.update(platformSubscriptions)
        .set({
          planId: newPlan.id,
          amount
        })
        .where(eq(platformSubscriptions.id, subscription.id))
        .returning();

      // Update vendor's subscription plan ID
      await db.update(vendors)
        .set({
          subscriptionPlanId: newPlan.id
        })
        .where(eq(vendors.id, vendor.id));

      return res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      return res.status(500).json({ message: 'Failed to change subscription plan' });
    }
  });
}