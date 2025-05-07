import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Decimal } from "decimal.js";
import {
  insertPaymentMethodSchema,
  insertPaymentProviderSettingsSchema,
  insertTransactionSchema
} from "@shared/schema";
import { storage } from "./storage";

// Define custom Request type with user property
interface AuthRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
  login(user: any, callback: (err: any) => void): void;
  logout(callback: (err: any) => void): void;
}

// Zod schema for payment method creation
const createPaymentMethodSchema = insertPaymentMethodSchema.extend({
  vendorId: z.number({
    required_error: "Vendor ID is required"
  })
});

// Zod schema for payment provider settings
const updatePaymentProviderSettingsSchema = insertPaymentProviderSettingsSchema.omit({
  provider: true,
  vendorId: true
});

// Zod schema for transaction creation
const createTransactionSchema = insertTransactionSchema.extend({
  orderId: z.number().optional(),
  invoiceId: z.number().optional(),
  externalId: z.string().optional()
});

// Zod schema for refund processing
const processRefundSchema = z.object({
  amount: z.string(),
  reason: z.string().optional()
});

export function registerPaymentRoutes(router: Router) {
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

    const vendor = await storage.getVendor(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.userId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to access this vendor" });
    }

    next();
  };

  // Get commission settings for platform
  router.get("/api/payments/commission-settings", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      // In a real implementation, this would be stored in the database
      // For simplicity, we'll return fixed values
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

  // Payment Methods Routes

  // Get all payment methods for a vendor
  router.get("/api/vendors/:vendorId/payment-methods", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const methods = await storage.getPaymentMethodsByVendorId(vendorId);
      res.json(methods);
    } catch (error: any) {
      console.error("Error getting payment methods:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new payment method
  router.post("/api/vendors/:vendorId/payment-methods", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Validate request data
      const validatedData = createPaymentMethodSchema.parse({
        ...req.body,
        vendorId
      });

      const method = await storage.createPaymentMethod(validatedData);
      res.status(201).json(method);
    } catch (error: any) {
      console.error("Error creating payment method:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific payment method
  router.get("/api/payment-methods/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this payment method" });
        }
      }

      res.json(method);
    } catch (error: any) {
      console.error("Error getting payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update a payment method
  router.patch("/api/payment-methods/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update this payment method" });
        }
      }

      const updatedMethod = await storage.updatePaymentMethod(id, req.body);
      res.json(updatedMethod);
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a payment method
  router.delete("/api/payment-methods/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to delete this payment method" });
        }
      }

      await storage.deletePaymentMethod(id);
      res.status(204).end();
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Set a payment method as default
  router.post("/api/payment-methods/:id/set-default", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update this payment method" });
        }
      }

      const updatedMethod = await storage.setDefaultPaymentMethod(id, method.vendorId);
      res.json(updatedMethod);
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Provider Settings Routes

  // Get payment provider settings for a vendor
  router.get("/api/vendors/:vendorId/payment-providers/:provider", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const provider = req.params.provider;
      const settings = await storage.getPaymentProviderSettingsByVendorId(vendorId, provider);
      
      if (!settings) {
        return res.status(404).json({ message: "Payment provider settings not found" });
      }

      res.json(settings);
    } catch (error: any) {
      console.error("Error getting payment provider settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create or update payment provider settings
  router.post("/api/vendors/:vendorId/payment-providers/:provider", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const provider = req.params.provider;
      
      // Check if settings already exist
      const existingSettings = await storage.getPaymentProviderSettingsByVendorId(vendorId, provider);
      
      if (existingSettings) {
        // Update existing settings
        const updatedSettings = await storage.updatePaymentProviderSettings(existingSettings.id, req.body);
        return res.json(updatedSettings);
      }
      
      // Create new settings
      const settings = await storage.createPaymentProviderSettings({
        ...req.body,
        vendorId,
        provider,
        isActive: req.body.isActive || false
      });
      
      res.status(201).json(settings);
    } catch (error: any) {
      console.error("Error updating payment provider settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle payment provider active status
  router.post("/api/payment-providers/:id/toggle-active", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const isActive = req.body.isActive === true;
      const settings = await storage.getPaymentProviderSettings(id);
      
      if (!settings) {
        return res.status(404).json({ message: "Payment provider settings not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || settings.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update these settings" });
        }
      }

      const updatedSettings = await storage.togglePaymentProviderActive(id, isActive);
      res.json(updatedSettings);
    } catch (error: any) {
      console.error("Error toggling payment provider status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction Routes

  // Create a new transaction
  router.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      
      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || validatedData.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to create this transaction" });
        }
      }
      
      // Calculate fee based on commission settings
      // In a real implementation, get the fee percentage from the database based on vendor revenue
      const feePercentage = 0.025; // 2.5%
      const transactionFee = 0.30; // $0.30 flat fee
      
      const amount = new Decimal(validatedData.amount);
      const feeAmount = amount.times(feePercentage).plus(transactionFee).toDecimalPlaces(2);
      const netAmount = amount.minus(feeAmount).toDecimalPlaces(2);
      
      const transaction = await storage.createTransaction({
        ...validatedData,
        fee: feeAmount.toString(),
        net: netAmount.toString()
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Get transactions by vendor
  router.get("/api/vendors/:vendorId/transactions", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific transaction
  router.get("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || transaction.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this transaction" });
        }
      }

      res.json(transaction);
    } catch (error: any) {
      console.error("Error getting transaction:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Process a refund
  router.post("/api/transactions/:id/refund", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || transaction.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to refund this transaction" });
        }
      }

      // Validate refund data
      const validatedData = processRefundSchema.parse(req.body);
      
      // Check if amount is valid
      const refundAmount = new Decimal(validatedData.amount);
      const transactionAmount = new Decimal(transaction.amount);
      const alreadyRefunded = new Decimal(transaction.refundedAmount || "0");
      
      if (refundAmount.lte(0)) {
        return res.status(400).json({ message: "Refund amount must be greater than zero" });
      }
      
      if (refundAmount.plus(alreadyRefunded).gt(transactionAmount)) {
        return res.status(400).json({ message: "Refund amount exceeds available amount" });
      }
      
      const updatedTransaction = await storage.processRefund(
        id, 
        validatedData.amount, 
        validatedData.reason || "Customer requested refund"
      );
      
      res.json(updatedTransaction);
    } catch (error: any) {
      console.error("Error processing refund:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Payout Routes

  // Get payouts by vendor
  router.get("/api/vendors/:vendorId/payouts", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const payouts = await storage.getPayoutsByVendorId(vendorId);
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific payout
  router.get("/api/payouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payout = await storage.getPayout(id);
      
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }

      // Check permission
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || payout.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this payout" });
        }
      }

      res.json(payout);
    } catch (error: any) {
      console.error("Error getting payout:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Request a payout (vendor only)
  router.post("/api/vendors/:vendorId/request-payout", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Check available balance
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Calculate available balance (transactions that are not already paid out)
      let availableBalance = new Decimal(0);
      for (const tx of transactions) {
        if (tx.type === "payment" && tx.status === "completed" && !tx.isPaidOut) {
          availableBalance = availableBalance.plus(tx.net);
        }
      }
      
      // Check minimum payout amount
      const minimumPayout = new Decimal(25); // $25 minimum payout
      if (availableBalance.lt(minimumPayout)) {
        return res.status(400).json({ 
          message: `Minimum payout amount is $${minimumPayout}. Current available balance: $${availableBalance}` 
        });
      }
      
      // Create payout request
      const payout = await storage.createPayout({
        vendorId,
        amount: availableBalance.toString(),
        status: "pending",
        paymentMethodId: req.body.paymentMethodId,
        notes: req.body.notes || null
      });
      
      // Mark transactions as paid out
      for (const tx of transactions) {
        if (tx.type === "payment" && tx.status === "completed" && !tx.isPaidOut) {
          await storage.updateTransaction(tx.id, { 
            isPaidOut: true,
            payoutId: payout.id 
          });
        }
      }
      
      res.status(201).json(payout);
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Complete a payout (admin only)
  router.post("/api/payouts/:id/complete", requireAuth, async (req, res) => {
    try {
      // Only super admins can complete payouts
      if (req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Only admins can complete payouts" });
      }
      
      const id = parseInt(req.params.id);
      const payout = await storage.getPayout(id);
      
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }
      
      if (payout.status !== "pending") {
        return res.status(400).json({ message: `Cannot complete payout with status ${payout.status}` });
      }
      
      const completedPayout = await storage.completePayout(id);
      res.json(completedPayout);
    } catch (error: any) {
      console.error("Error completing payout:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get available balance for a vendor
  router.get("/api/vendors/:vendorId/available-balance", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Get all transactions for this vendor
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Calculate available balance
      let availableBalance = new Decimal(0);
      let pendingBalance = new Decimal(0);
      
      for (const tx of transactions) {
        if (tx.type === "payment") {
          if (tx.status === "completed" && !tx.isPaidOut) {
            availableBalance = availableBalance.plus(tx.net);
          } else if (tx.status === "pending") {
            pendingBalance = pendingBalance.plus(tx.net);
          }
        } else if (tx.type === "refund" && tx.status === "completed") {
          // Subtract refunds from available balance
          availableBalance = availableBalance.minus(tx.amount);
        }
      }
      
      res.json({
        availableBalance: availableBalance.toString(),
        pendingBalance: pendingBalance.toString(),
        currency: "USD" // Default currency
      });
    } catch (error: any) {
      console.error("Error getting available balance:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get transaction history for vendor analytics
  router.get("/api/vendors/:vendorId/transaction-analytics", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const { period = "month", startDate, endDate } = req.query;
      
      // Get all transactions for this vendor
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Filter by date if provided
      let filteredTransactions = transactions;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredTransactions = transactions.filter(tx => {
          const txDate = new Date(tx.createdAt!);
          return txDate >= start && txDate <= end;
        });
      }
      
      // Group by day, week, or month
      const groupedData: { [key: string]: { sales: Decimal, refunds: Decimal, fees: Decimal, net: Decimal, count: number } } = {};
      
      filteredTransactions.forEach(tx => {
        const date = new Date(tx.createdAt!);
        let key: string;
        
        if (period === "day") {
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
        } else if (period === "week") {
          // Get the Monday of the week
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
          const monday = new Date(date.setDate(diff));
          key = monday.toISOString().split("T")[0];
        } else {
          // Month
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        }
        
        if (!groupedData[key]) {
          groupedData[key] = { sales: new Decimal(0), refunds: new Decimal(0), fees: new Decimal(0), net: new Decimal(0), count: 0 };
        }
        
        if (tx.type === "payment" && tx.status === "completed") {
          groupedData[key].sales = groupedData[key].sales.plus(tx.amount);
          groupedData[key].fees = groupedData[key].fees.plus(tx.fee || 0);
          groupedData[key].net = groupedData[key].net.plus(tx.net);
          groupedData[key].count += 1;
        } else if (tx.type === "refund" && tx.status === "completed") {
          groupedData[key].refunds = groupedData[key].refunds.plus(tx.amount);
        }
      });
      
      // Convert to array and sort by date
      const result = Object.entries(groupedData).map(([date, data]) => ({
        date,
        sales: data.sales.toString(),
        refunds: data.refunds.toString(),
        fees: data.fees.toString(),
        net: data.net.toString(),
        count: data.count
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      res.json(result);
    } catch (error: any) {
      console.error("Error getting transaction analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get transaction statistics for dashboard
  router.get("/api/vendors/:vendorId/transaction-stats", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Get all transactions for this vendor
      const transactions = await storage.getTransactionsByVendorId(vendorId);
      
      // Calculate stats
      let totalSales = new Decimal(0);
      let totalRefunds = new Decimal(0);
      let totalFees = new Decimal(0);
      let totalNet = new Decimal(0);
      let transactionCount = 0;
      let refundCount = 0;
      
      // Calculate this month's stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      let monthSales = new Decimal(0);
      let monthRefunds = new Decimal(0);
      let monthNet = new Decimal(0);
      let monthCount = 0;
      
      transactions.forEach(tx => {
        const txDate = new Date(tx.createdAt!);
        
        if (tx.type === "payment" && tx.status === "completed") {
          totalSales = totalSales.plus(tx.amount);
          totalFees = totalFees.plus(tx.fee || 0);
          totalNet = totalNet.plus(tx.net);
          transactionCount += 1;
          
          // Check if this month
          if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
            monthSales = monthSales.plus(tx.amount);
            monthNet = monthNet.plus(tx.net);
            monthCount += 1;
          }
        } else if (tx.type === "refund" && tx.status === "completed") {
          totalRefunds = totalRefunds.plus(tx.amount);
          refundCount += 1;
          
          // Check if this month
          if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
            monthRefunds = monthRefunds.plus(tx.amount);
          }
        }
      });
      
      res.json({
        totalStats: {
          sales: totalSales.toString(),
          refunds: totalRefunds.toString(),
          fees: totalFees.toString(),
          net: totalNet.toString(),
          transactionCount,
          refundCount,
          refundRate: transactionCount > 0 ? refundCount / transactionCount : 0
        },
        monthStats: {
          sales: monthSales.toString(),
          refunds: monthRefunds.toString(),
          net: monthNet.toString(),
          transactionCount: monthCount
        },
        currency: "USD" // Default currency
      });
    } catch (error: any) {
      console.error("Error getting transaction stats:", error);
      res.status(500).json({ message: error.message });
    }
  });
}