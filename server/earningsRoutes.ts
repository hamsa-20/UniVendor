import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { insertPayoutSchema } from "@shared/schema";
import { storage } from "./storage";

interface AuthRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
}

// Zod schema for payout creation
const createPayoutSchema = insertPayoutSchema.extend({
  vendorId: z.number({
    required_error: "Vendor ID is required"
  })
});

// Zod schema for payout approval/rejection
const processPayoutSchema = z.object({
  notes: z.string().optional(),
});

export function registerEarningsRoutes(router: Router) {
  // Middleware to check authentication
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Middleware to check vendor ownership
  const requireVendorOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role === "super_admin") {
      // Super admins can access all vendors
      return next();
    }

    const vendorId = parseInt(req.params.vendorId);
    if (isNaN(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID" });
    }

    const vendor = await storage.getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.id !== vendorId) {
      return res.status(403).json({ message: "You don't have permission to access this vendor" });
    }

    next();
  };

  // Middleware to check super admin role
  const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };

  // Get current vendor
  router.get("/api/vendors/current", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user.role === "super_admin") {
        return res.status(400).json({ message: "Super admin does not have an associated vendor" });
      }

      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json(vendor);
    } catch (error: any) {
      console.error("Error getting current vendor:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get vendor earnings summary
  router.get("/api/vendors/:vendorId/earnings", requireVendorOwnership, async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const dateRange = req.query.dateRange as string || "30d";
      
      // Get transactions for this vendor in the given date range
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Get payouts for this vendor
      const payouts = await storage.getPayoutsByVendorId(vendorId);
      
      // Calculate required values based on transactions and payouts
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Date filter based on requested range
      let startDate = new Date();
      if (dateRange === "7d") {
        startDate = new Date(now.getTime() - 7 * msPerDay);
      } else if (dateRange === "30d") {
        startDate = new Date(now.getTime() - 30 * msPerDay);
      } else if (dateRange === "90d") {
        startDate = new Date(now.getTime() - 90 * msPerDay);
      } else if (dateRange === "year") {
        startDate = new Date(now.getTime() - 365 * msPerDay);
      }
      
      // Comparison period for calculating change percentage
      const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      
      // Filter transactions by date
      const currentPeriodTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= startDate && new Date(t.createdAt) <= now
      );
      
      const previousPeriodTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= previousStartDate && new Date(t.createdAt) < startDate
      );
      
      // Calculate current period metrics
      const totalRevenue = currentPeriodTransactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      const totalOrders = new Set(
        currentPeriodTransactions
          .filter(t => t.type === "order_payment" && t.status === "completed")
          .map(t => t.orderId)
      ).size;
      
      // Calculate previous period metrics for comparison
      const prevTotalRevenue = previousPeriodTransactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      const prevTotalOrders = new Set(
        previousPeriodTransactions
          .filter(t => t.type === "order_payment" && t.status === "completed")
          .map(t => t.orderId)
      ).size;
      
      // Calculate change percentages
      const revenueChange = prevTotalRevenue.isZero()
        ? 100
        : totalRevenue.minus(prevTotalRevenue).dividedBy(prevTotalRevenue).times(100).toFixed(1);
      
      const ordersChange = prevTotalOrders === 0
        ? 100
        : ((totalOrders - prevTotalOrders) / prevTotalOrders * 100).toFixed(1);
      
      // Calculate available balance (completed transactions - payouts)
      const totalEarned = transactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.net), new Decimal(0));
      
      const totalPaidOut = payouts
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      
      const availableBalance = totalEarned.minus(totalPaidOut);
      
      // Calculate processing balance (recent transactions not yet available for payout)
      // Assuming funds are held for 7 days before becoming available
      const processingDate = new Date(now.getTime() - 7 * msPerDay);
      const processingBalance = transactions
        .filter(t => 
          t.type === "order_payment" && 
          t.status === "completed" && 
          new Date(t.createdAt) >= processingDate
        )
        .reduce((sum, t) => sum.plus(t.net), new Decimal(0));
      
      // Final response object
      const earningsSummary = {
        totalRevenue: totalRevenue.toNumber(),
        totalOrders,
        revenueChange: parseFloat(revenueChange),
        ordersChange: parseFloat(ordersChange),
        availableBalance: availableBalance.toNumber(),
        processingBalance: processingBalance.toNumber(),
      };
      
      res.json(earningsSummary);
    } catch (error: any) {
      console.error("Error getting vendor earnings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get vendor revenue data for chart
  router.get("/api/vendors/:vendorId/revenue", requireVendorOwnership, async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const dateRange = req.query.dateRange as string || "30d";
      const viewType = req.query.viewType as string || "daily";
      
      // Get transactions for this vendor in the given date range
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Filter by date range
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      let startDate = new Date();
      if (dateRange === "7d") {
        startDate = new Date(now.getTime() - 7 * msPerDay);
      } else if (dateRange === "30d") {
        startDate = new Date(now.getTime() - 30 * msPerDay);
      } else if (dateRange === "90d") {
        startDate = new Date(now.getTime() - 90 * msPerDay);
      } else if (dateRange === "year") {
        startDate = new Date(now.getTime() - 365 * msPerDay);
      }
      
      // Filter transactions for the selected period
      const filteredTransactions = transactions.filter(t => 
        t.type === "order_payment" && 
        t.status === "completed" && 
        new Date(t.createdAt) >= startDate && 
        new Date(t.createdAt) <= now
      );
      
      // Group by day, week, or month based on viewType
      const groupedData: { [key: string]: { revenue: Decimal, orders: number } } = {};
      
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.createdAt);
        let key: string;
        
        if (viewType === "daily") {
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
        } else if (viewType === "weekly") {
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / msPerDay);
          const weekNumber = Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${weekNumber}`;
        } else {
          // Monthly
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        
        if (!groupedData[key]) {
          groupedData[key] = { revenue: new Decimal(0), orders: 0 };
        }
        
        groupedData[key].revenue = groupedData[key].revenue.plus(transaction.amount);
        groupedData[key].orders += 1;
      });
      
      // Convert to array format for chart
      const chartData = Object.keys(groupedData).sort().map(key => {
        let displayDate = key;
        
        // Format the display date
        if (viewType === "daily") {
          // Convert YYYY-MM-DD to more readable format
          const parts = key.split("-");
          displayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (viewType === "weekly") {
          // Convert YYYY-Wnn to "Week nn"
          displayDate = "Week " + key.split("W")[1];
        } else {
          // Convert YYYY-MM to Month YYYY
          const parts = key.split("-");
          displayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
            .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        return {
          date: displayDate,
          revenue: groupedData[key].revenue.toNumber(),
          orders: groupedData[key].orders
        };
      });
      
      res.json(chartData);
    } catch (error: any) {
      console.error("Error getting vendor revenue data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get vendor transactions
  router.get("/api/vendors/:vendorId/transactions", requireVendorOwnership, async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const dateRange = req.query.dateRange as string || "30d";
      
      // Get transactions for this vendor
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Filter by date range if specified
      if (dateRange) {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        let startDate = new Date();
        if (dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * msPerDay);
        } else if (dateRange === "30d") {
          startDate = new Date(now.getTime() - 30 * msPerDay);
        } else if (dateRange === "90d") {
          startDate = new Date(now.getTime() - 90 * msPerDay);
        } else if (dateRange === "year") {
          startDate = new Date(now.getTime() - 365 * msPerDay);
        }
        
        const filteredTransactions = transactions.filter(t => 
          new Date(t.createdAt) >= startDate && new Date(t.createdAt) <= now
        );
        
        return res.json(filteredTransactions);
      }
      
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting vendor transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get vendor payouts
  router.get("/api/vendors/:vendorId/payouts", requireVendorOwnership, async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const payouts = await storage.getPayoutsByVendorId(vendorId);
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting vendor payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Request a payout
  router.post("/api/vendors/:vendorId/payouts", requireVendorOwnership, async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Validate request data
      const validatedData = createPayoutSchema.parse({
        ...req.body,
        vendorId,
      });
      
      // Check if vendor has sufficient balance
      // Get transactions for this vendor
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      const payouts = await storage.getPayoutsByVendorId(vendorId);
      
      // Calculate available balance
      const totalEarned = transactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.net), new Decimal(0));
      
      const totalPaidOut = payouts
        .filter(p => p.status === "completed" || p.status === "pending" || p.status === "processing")
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      
      const availableBalance = totalEarned.minus(totalPaidOut);
      
      // Check if amount requested is valid
      const requestedAmount = new Decimal(validatedData.amount);
      if (requestedAmount.isNegative() || requestedAmount.isZero()) {
        return res.status(400).json({ message: "Payout amount must be greater than zero" });
      }
      
      if (requestedAmount.greaterThan(availableBalance)) {
        return res.status(400).json({ 
          message: "Insufficient funds for payout",
          availableBalance: availableBalance.toString()
        });
      }
      
      // Calculate fee (typically zero for now, but could be based on amount or method in the future)
      const fee = new Decimal(0);
      const net = requestedAmount.minus(fee);
      
      // Create payout request
      const payout = await storage.createPayout({
        ...validatedData,
        fee: fee.toString(),
        net: net.toString(),
        status: "pending", // All payouts start as pending
      });
      
      res.status(201).json(payout);
    } catch (error: any) {
      console.error("Error creating payout request:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get platform earnings summary (super admin only)
  router.get("/api/platform/earnings", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const dateRange = req.query.dateRange as string || "30d";
      
      // Get all transactions
      const transactions = await storage.getAllTransactions();
      
      // Get all payouts
      const payouts = await storage.getAllPayouts();
      
      // Calculate metrics based on date range
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      // Date filter based on requested range
      let startDate = new Date();
      if (dateRange === "7d") {
        startDate = new Date(now.getTime() - 7 * msPerDay);
      } else if (dateRange === "30d") {
        startDate = new Date(now.getTime() - 30 * msPerDay);
      } else if (dateRange === "90d") {
        startDate = new Date(now.getTime() - 90 * msPerDay);
      } else if (dateRange === "year") {
        startDate = new Date(now.getTime() - 365 * msPerDay);
      }
      
      // Comparison period for calculating change percentage
      const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      
      // Filter transactions by date
      const currentPeriodTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= startDate && new Date(t.createdAt) <= now
      );
      
      const previousPeriodTransactions = transactions.filter(t => 
        new Date(t.createdAt) >= previousStartDate && new Date(t.createdAt) < startDate
      );
      
      // Calculate current period metrics
      // Total platform revenue
      const totalRevenue = currentPeriodTransactions
        .filter(t => (t.type === "order_payment" || t.type === "platform_subscription") && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      // Commission revenue (fees from transactions)
      const commissionRevenue = currentPeriodTransactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.fee), new Decimal(0));
      
      // Subscription revenue
      const subscriptionRevenue = currentPeriodTransactions
        .filter(t => t.type === "platform_subscription" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      // Previous period metrics
      const prevTotalRevenue = previousPeriodTransactions
        .filter(t => (t.type === "order_payment" || t.type === "platform_subscription") && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      const prevCommissionRevenue = previousPeriodTransactions
        .filter(t => t.type === "order_payment" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.fee), new Decimal(0));
      
      const prevSubscriptionRevenue = previousPeriodTransactions
        .filter(t => t.type === "platform_subscription" && t.status === "completed")
        .reduce((sum, t) => sum.plus(t.amount), new Decimal(0));
      
      // Calculate change percentages
      const revenueChange = prevTotalRevenue.isZero()
        ? 100
        : totalRevenue.minus(prevTotalRevenue).dividedBy(prevTotalRevenue).times(100).toFixed(1);
      
      const commissionChange = prevCommissionRevenue.isZero()
        ? 100
        : commissionRevenue.minus(prevCommissionRevenue).dividedBy(prevCommissionRevenue).times(100).toFixed(1);
      
      const subscriptionChange = prevSubscriptionRevenue.isZero()
        ? 100
        : subscriptionRevenue.minus(prevSubscriptionRevenue).dividedBy(prevSubscriptionRevenue).times(100).toFixed(1);
      
      // Calculate pending payouts total
      const pendingPayouts = payouts
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      
      // Final response object
      const earningsSummary = {
        totalRevenue: totalRevenue.toNumber(),
        commissionRevenue: commissionRevenue.toNumber(),
        subscriptionRevenue: subscriptionRevenue.toNumber(),
        pendingPayouts: pendingPayouts.toNumber(),
        revenueChange: parseFloat(revenueChange),
        commissionChange: parseFloat(commissionChange),
        subscriptionChange: parseFloat(subscriptionChange),
      };
      
      res.json(earningsSummary);
    } catch (error: any) {
      console.error("Error getting platform earnings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get platform revenue data for chart (super admin only)
  router.get("/api/platform/revenue", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const dateRange = req.query.dateRange as string || "30d";
      const viewType = req.query.viewType as string || "daily";
      
      // Get all transactions
      const transactions = await storage.getAllTransactions();
      
      // Filter by date range
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      
      let startDate = new Date();
      if (dateRange === "7d") {
        startDate = new Date(now.getTime() - 7 * msPerDay);
      } else if (dateRange === "30d") {
        startDate = new Date(now.getTime() - 30 * msPerDay);
      } else if (dateRange === "90d") {
        startDate = new Date(now.getTime() - 90 * msPerDay);
      } else if (dateRange === "year") {
        startDate = new Date(now.getTime() - 365 * msPerDay);
      }
      
      // Filter transactions for the selected period
      const filteredTransactions = transactions.filter(t => 
        (t.type === "order_payment" || t.type === "platform_subscription") && 
        t.status === "completed" && 
        new Date(t.createdAt) >= startDate && 
        new Date(t.createdAt) <= now
      );
      
      // Group by day, week, or month based on viewType
      const groupedData: { [key: string]: { revenue: Decimal, orders: number } } = {};
      
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.createdAt);
        let key: string;
        
        if (viewType === "daily") {
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
        } else if (viewType === "weekly") {
          // Get the week number
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / msPerDay);
          const weekNumber = Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${date.getFullYear()}-W${weekNumber}`;
        } else {
          // Monthly
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        
        if (!groupedData[key]) {
          groupedData[key] = { revenue: new Decimal(0), orders: 0 };
        }
        
        groupedData[key].revenue = groupedData[key].revenue.plus(transaction.amount);
        
        // Count order_payment transactions as orders
        if (transaction.type === "order_payment") {
          groupedData[key].orders += 1;
        }
      });
      
      // Convert to array format for chart
      const chartData = Object.keys(groupedData).sort().map(key => {
        let displayDate = key;
        
        // Format the display date
        if (viewType === "daily") {
          // Convert YYYY-MM-DD to more readable format
          const parts = key.split("-");
          displayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (viewType === "weekly") {
          // Convert YYYY-Wnn to "Week nn"
          displayDate = "Week " + key.split("W")[1];
        } else {
          // Convert YYYY-MM to Month YYYY
          const parts = key.split("-");
          displayDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
            .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        return {
          date: displayDate,
          revenue: groupedData[key].revenue.toNumber(),
          orders: groupedData[key].orders
        };
      });
      
      res.json(chartData);
    } catch (error: any) {
      console.error("Error getting platform revenue data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get platform transactions (super admin only)
  router.get("/api/platform/transactions", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const dateRange = req.query.dateRange as string || "30d";
      
      // Get all transactions
      const transactions = await storage.getAllTransactions();
      
      // Filter by date range if specified
      if (dateRange) {
        const now = new Date();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        let startDate = new Date();
        if (dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * msPerDay);
        } else if (dateRange === "30d") {
          startDate = new Date(now.getTime() - 30 * msPerDay);
        } else if (dateRange === "90d") {
          startDate = new Date(now.getTime() - 90 * msPerDay);
        } else if (dateRange === "year") {
          startDate = new Date(now.getTime() - 365 * msPerDay);
        }
        
        const filteredTransactions = transactions.filter(t => 
          new Date(t.createdAt) >= startDate && new Date(t.createdAt) <= now
        );
        
        return res.json(filteredTransactions);
      }
      
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting platform transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all payouts (super admin only)
  router.get("/api/platform/payouts", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const statusFilter = req.query.status as string;
      
      // Get all payouts
      const payouts = await storage.getAllPayouts();
      
      // Filter by status if specified
      if (statusFilter) {
        const filteredPayouts = payouts.filter(p => p.status === statusFilter);
        return res.json(filteredPayouts);
      }
      
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting platform payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Approve payout (super admin only)
  router.patch("/api/platform/payouts/:payoutId/approve", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const payoutId = parseInt(req.params.payoutId);
      
      // Validate data
      const validatedData = processPayoutSchema.parse(req.body);
      
      // Get the payout
      const payout = await storage.getPayout(payoutId);
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }
      
      if (payout.status !== "pending") {
        return res.status(400).json({ message: "Only pending payouts can be approved" });
      }
      
      // Update payout status
      const updatedPayout = await storage.updatePayout(payoutId, {
        status: "processing",
        notes: validatedData.notes || payout.notes,
      });
      
      // In a real system, here you would initiate the actual payout process
      // through a payment gateway or financial service
      
      res.json(updatedPayout);
    } catch (error: any) {
      console.error("Error approving payout:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Reject payout (super admin only)
  router.patch("/api/platform/payouts/:payoutId/reject", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const payoutId = parseInt(req.params.payoutId);
      
      // Validate data
      const validatedData = processPayoutSchema.parse(req.body);
      
      // Get the payout
      const payout = await storage.getPayout(payoutId);
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }
      
      if (payout.status !== "pending") {
        return res.status(400).json({ message: "Only pending payouts can be rejected" });
      }
      
      // Update payout status
      const updatedPayout = await storage.updatePayout(payoutId, {
        status: "failed",
        notes: validatedData.notes || payout.notes,
      });
      
      res.json(updatedPayout);
    } catch (error: any) {
      console.error("Error rejecting payout:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get commission settings
  router.get("/api/payments/commission-settings", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      // In a real implementation, this would be stored in the database
      // For this implementation, let's return fixed values
      const commissionSettings = {
        baseFeePercentage: "2.5",
        transactionFeeFlat: "0.30",
        thresholds: [
          { monthlyRevenue: "1000", feePercentage: "2.5" },
          { monthlyRevenue: "5000", feePercentage: "2.25" },
          { monthlyRevenue: "10000", feePercentage: "2.0" },
          { monthlyRevenue: "25000", feePercentage: "1.75" },
          { monthlyRevenue: "50000", feePercentage: "1.5" }
        ]
      };

      res.json(commissionSettings);
    } catch (error: any) {
      console.error("Error getting commission settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update commission settings (super admin only)
  router.put("/api/payments/commission-settings", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      // For this implementation, we'll just return the request data
      // In a real implementation, this would update the settings in the database
      res.json({
        ...req.body,
        updated: true
      });
    } catch (error: any) {
      console.error("Error updating commission settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
}