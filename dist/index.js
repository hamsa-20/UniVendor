var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analytics: () => analytics,
  cartItems: () => cartItems,
  carts: () => carts,
  customerAddresses: () => customerAddresses,
  customerPaymentMethods: () => customerPaymentMethods,
  customers: () => customers,
  domains: () => domains,
  insertAnalyticsSchema: () => insertAnalyticsSchema,
  insertCartItemSchema: () => insertCartItemSchema,
  insertCartSchema: () => insertCartSchema,
  insertCustomerAddressSchema: () => insertCustomerAddressSchema,
  insertCustomerPaymentMethodSchema: () => insertCustomerPaymentMethodSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertDomainSchema: () => insertDomainSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertOtpSchema: () => insertOtpSchema,
  insertPaymentMethodSchema: () => insertPaymentMethodSchema,
  insertPaymentProviderSettingsSchema: () => insertPaymentProviderSettingsSchema,
  insertPayoutSchema: () => insertPayoutSchema,
  insertPlatformSubscriptionSchema: () => insertPlatformSubscriptionSchema,
  insertProductCategorySchema: () => insertProductCategorySchema,
  insertProductSchema: () => insertProductSchema,
  insertProductVariantSchema: () => insertProductVariantSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVendorSchema: () => insertVendorSchema,
  invoices: () => invoices,
  orderItems: () => orderItems,
  orders: () => orders,
  otpCodes: () => otpCodes,
  paymentMethods: () => paymentMethods,
  paymentProviderSettings: () => paymentProviderSettings,
  payouts: () => payouts,
  platformSubscriptions: () => platformSubscriptions,
  productCategories: () => productCategories,
  productVariants: () => productVariants,
  products: () => products,
  subscriptionPlans: () => subscriptionPlans,
  transactions: () => transactions,
  users: () => users,
  vendors: () => vendors
});
import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  role: text("role").notNull().default("vendor"),
  // "super_admin" or "vendor"
  avatarUrl: text("avatar_url"),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertOtpSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  // Monthly price
  yearlyPrice: numeric("yearly_price"),
  // Optional yearly price (with discount)
  features: text("features").array(),
  productLimit: integer("product_limit").notNull(),
  storageLimit: integer("storage_limit").notNull(),
  // in GB
  customDomainLimit: integer("custom_domain_limit").notNull(),
  supportLevel: text("support_level").notNull(),
  trialDays: integer("trial_days").default(7),
  // Default 7-day trial period
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").default(false),
  // Whether this is the default plan for new vendors
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  // Stripe price ID for monthly billing
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  // Stripe price ID for yearly billing
  currency: text("currency").default("INR").notNull(),
  // Currency for the plan pricing
  createdAt: timestamp("created_at").defaultNow()
});
var insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});
var vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  subscriptionPlanId: integer("subscription_plan_id").references(() => subscriptionPlans.id),
  status: text("status").notNull().default("pending"),
  // "pending", "active", "suspended"
  storeTheme: text("store_theme").default("default"),
  customCss: text("custom_css"),
  colorPalette: text("color_palette").default("default"),
  fontSettings: jsonb("font_settings"),
  // Stores headingFont, bodyFont, fontSize, and useCustomFonts
  createdAt: timestamp("created_at").defaultNow(),
  subscriptionStatus: text("subscription_status").default("trial"),
  // "trial", "active", "overdue"
  trialEndsAt: timestamp("trial_ends_at"),
  nextBillingDate: timestamp("next_billing_date")
});
var insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true
});
var domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  // "subdomain" or "custom"
  status: text("status").notNull().default("pending"),
  // "pending", "active", "error"
  sslStatus: text("ssl_status").default("pending"),
  // "pending", "valid", "invalid"
  isPrimary: boolean("is_primary").default(false),
  verificationStatus: text("verification_status").default("pending"),
  // "pending", "verified", "failed"
  verificationToken: text("verification_token"),
  // Token for DNS TXT record verification
  verificationMethod: text("verification_method").default("dns_txt"),
  // "dns_txt", "file", "cname"
  dnsRecords: text("dns_records").array(),
  // Array of DNS records needed for domain configuration
  lastCheckedAt: timestamp("last_checked_at"),
  // Last time verification was checked
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});
var insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true
});
var productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  // Now optional for global categories
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  imageUrl: text("image_url"),
  parentId: integer("parent_id").references(() => productCategories.id),
  // Self-reference for subcategories
  level: integer("level").default(1),
  // 1 = main category, 2 = subcategory, etc.
  isActive: boolean("is_active").default(true),
  isGlobal: boolean("is_global").default(false),
  // True for super admin created global categories
  createdAt: timestamp("created_at").defaultNow()
});
var insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true
});
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  categoryId: integer("category_id").references(() => productCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  purchasePrice: numeric("purchase_price"),
  // Added purchase price
  sellingPrice: numeric("selling_price").notNull(),
  // Renamed from price to sellingPrice
  mrp: numeric("mrp"),
  // Added Maximum Retail Price
  gst: numeric("gst"),
  // Added GST percentage
  sku: text("sku"),
  barcode: text("barcode"),
  weight: numeric("weight"),
  dimensions: text("dimensions"),
  inventoryQuantity: integer("inventory_quantity").default(0),
  status: text("status").default("draft"),
  // "draft", "active", "archived"
  featuredImageUrl: text("featured_image_url"),
  images: text("images").array(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var baseProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProductSchema = baseProductSchema.extend({
  // Allow numeric fields to be numbers instead of only strings 
  purchasePrice: z.number().nullable().optional(),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  mrp: z.number().nullable().optional(),
  gst: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  inventoryQuantity: z.number().int().default(0)
});
var customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent").default("0"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
});
var customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  customerId: integer("customer_id").references(() => customers.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"),
  // "pending", "processing", "shipped", "delivered", "canceled"
  currency: text("currency").default("USD"),
  subtotal: numeric("subtotal").notNull(),
  shippingCost: numeric("shipping_cost").default("0"),
  tax: numeric("tax").default("0"),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  paymentStatus: text("payment_status").default("pending"),
  // "pending", "paid", "failed", "refunded"
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  total: numeric("total").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true
});
var analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  date: timestamp("date").notNull(),
  visitors: integer("visitors").default(0),
  pageViews: integer("page_views").default(0),
  orders: integer("orders").default(0),
  revenue: numeric("revenue").default("0"),
  conversionRate: numeric("conversion_rate").default("0"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true
});
var carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  // For guest carts
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  subtotal: numeric("subtotal").default("0"),
  tax: numeric("tax").default("0"),
  total: numeric("total").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  variant: text("variant"),
  // For products with variants (size, color, etc.)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true
});
var paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  type: text("type").notNull(),
  // "card", "bank_account", "paypal", etc.
  name: text("name").notNull(),
  // Display name for the payment method
  isDefault: boolean("is_default").default(false),
  status: text("status").default("active"),
  // "active", "inactive", "expired", "failed"
  lastFour: text("last_four"),
  // Last four digits of card or account number
  expiryMonth: text("expiry_month"),
  // For cards
  expiryYear: text("expiry_year"),
  // For cards
  brand: text("brand"),
  // For cards (Visa, Mastercard, etc.)
  gatewayId: text("gateway_id"),
  // ID of this payment method in the payment gateway
  gatewayData: jsonb("gateway_data"),
  // Additional data from payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var platformSubscriptions = pgTable("platform_subscriptions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("trialing"),
  // "trialing", "active", "canceled", "past_due", "unpaid"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  // Null for ongoing subscriptions
  trialEndsAt: timestamp("trial_ends_at"),
  // When the trial period ends
  currentPeriodStart: timestamp("current_period_start"),
  // Start of current billing period
  currentPeriodEnd: timestamp("current_period_end"),
  // End of current billing period
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  // Whether to cancel at the end of the period
  renewalDate: timestamp("renewal_date"),
  // Next renewal date (same as currentPeriodEnd typically)
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  // "monthly", "yearly"
  amount: numeric("amount"),
  // Amount charged in the current billing cycle
  currency: text("currency").default("USD"),
  // Currency of the subscription
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  stripeCustomerId: text("stripe_customer_id"),
  // Customer ID in Stripe
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Subscription ID in Stripe
  canceledAt: timestamp("canceled_at"),
  // When the subscription was canceled
  cancelReason: text("cancel_reason"),
  // Reason for cancellation
  paymentFailureCount: integer("payment_failure_count").default(0),
  // Count of payment failures
  metadata: jsonb("metadata"),
  // Additional metadata about the subscription
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPlatformSubscriptionSchema = createInsertSchema(platformSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  subscriptionId: integer("subscription_id").references(() => platformSubscriptions.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: numeric("amount").notNull(),
  tax: numeric("tax").default("0"),
  total: numeric("total").notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "paid", "overdue", "void"
  currency: text("currency").default("USD"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  pdfUrl: text("pdf_url"),
  // URL to download invoice PDF
  gatewayInvoiceId: text("gateway_invoice_id"),
  // ID in payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  // "platform_subscription", "order_payment", "refund", "payout"
  status: text("status").notNull().default("pending"),
  // "pending", "completed", "failed", "refunded"
  amount: numeric("amount").notNull(),
  currency: text("currency").default("USD"),
  fee: numeric("fee").default("0"),
  net: numeric("net").notNull(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  orderId: integer("order_id").references(() => orders.id),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayResponse: jsonb("gateway_response"),
  refundedAmount: numeric("refunded_amount").default("0"),
  refundReason: text("refund_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("USD"),
  fee: numeric("fee").default("0"),
  net: numeric("net").notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "processing", "completed", "failed"
  method: text("method").notNull(),
  // "bank_transfer", "paypal", etc.
  batchId: text("batch_id"),
  // For grouping related payouts
  gatewayPayoutId: text("gateway_payout_id"),
  gatewayResponse: jsonb("gateway_response"),
  notes: text("notes"),
  transactionIds: integer("transaction_ids").array(),
  // Array of related transaction IDs
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  completedAt: true
});
var customerPaymentMethods = pgTable("customer_payment_methods", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  type: text("type").notNull(),
  // "card", "bank_account", "paypal", etc.
  name: text("name").notNull(),
  // Display name for the payment method
  isDefault: boolean("is_default").default(false),
  status: text("status").default("active"),
  // "active", "inactive", "expired", "failed"
  lastFour: text("last_four"),
  // Last four digits of card or account number
  expiryMonth: text("expiry_month"),
  // For cards
  expiryYear: text("expiry_year"),
  // For cards
  brand: text("brand"),
  // For cards (Visa, Mastercard, etc.)
  gatewayId: text("gateway_id"),
  // ID of this payment method in the payment gateway
  gatewayData: jsonb("gateway_data"),
  // Additional data from payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertCustomerPaymentMethodSchema = createInsertSchema(customerPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var paymentProviderSettings = pgTable("payment_provider_settings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  provider: text("provider").notNull(),
  // "stripe", "paypal", etc.
  isActive: boolean("is_active").default(false),
  isTest: boolean("is_test").default(true),
  credentials: jsonb("credentials"),
  // Encrypted credentials
  webhookSecret: text("webhook_secret"),
  commissionRate: numeric("commission_rate").default("0"),
  // Platform commission rate
  additionalSettings: jsonb("additional_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPaymentProviderSettingsSchema = createInsertSchema(paymentProviderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  color: text("color").notNull(),
  // Added color field
  size: text("size").notNull(),
  // Added size field
  sku: text("sku"),
  barcode: text("barcode"),
  purchasePrice: numeric("purchase_price"),
  // Added purchase price
  sellingPrice: numeric("selling_price").notNull(),
  // Renamed from price to sellingPrice
  mrp: numeric("mrp"),
  // Added Maximum Retail Price
  gst: numeric("gst"),
  // Added GST percentage
  inventoryQuantity: integer("inventory_quantity").default(0),
  weight: numeric("weight"),
  imageUrl: text("image_url"),
  // Kept for backward compatibility
  images: text("images").array(),
  // Added array of image URLs
  position: integer("position").default(0),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var baseProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProductVariantSchema = baseProductVariantSchema.extend({
  // Allow numeric fields to be numbers instead of only strings
  purchasePrice: z.number().nullable().optional(),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  mrp: z.number().nullable().optional(),
  gst: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  inventoryQuantity: z.number().int().default(0),
  // Add support for multiple images
  images: z.array(z.string()).optional()
});

// server/storage.ts
import { or } from "drizzle-orm";
import Decimal from "decimal.js";
import session from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
console.log("DATABASE_URL:", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool2, { schema: schema_exports });

// server/storage.ts
import { eq, sql, and, gt, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pool2,
      createTableIfMissing: true
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async updateUser(id, data) {
    const [currentUser] = await db.select().from(users).where(eq(users.id, id));
    if (currentUser && currentUser.role === "super_admin" && "role" in data && data.role !== "super_admin") {
      console.warn(`Attempt to change super_admin role for user ${id} was prevented`);
      delete data.role;
    }
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  // OTP operations
  async createOtp(email, code, expiresAt) {
    const [otpCode] = await db.insert(otpCodes).values({ email, code, expiresAt, isUsed: false }).returning();
    return otpCode;
  }
  async getLatestOtp(email) {
    const now = /* @__PURE__ */ new Date();
    const [latestOtp] = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.isUsed, false),
        gt(otpCodes.expiresAt, now)
      )
    ).orderBy(desc(otpCodes.createdAt)).limit(1);
    return latestOtp;
  }
  async markOtpAsUsed(id) {
    const [updatedOtp] = await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, id)).returning();
    return updatedOtp;
  }
  // Subscription plan operations
  async getSubscriptionPlan(id) {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }
  async getSubscriptionPlans() {
    return db.select().from(subscriptionPlans);
  }
  async createSubscriptionPlan(plan) {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  async updateSubscriptionPlan(id, data) {
    const [updatedPlan] = await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id)).returning();
    return updatedPlan;
  }
  // Vendor operations
  async getVendor(id) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }
  async getVendors() {
    return db.select().from(vendors);
  }
  async getVendorByUserId(userId) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor;
  }
  async createVendor(vendor) {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }
  async updateVendor(id, data) {
    const [updatedVendor] = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return updatedVendor;
  }
  // Domain operations
  async getDomain(id) {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain;
  }
  async getDomains() {
    return db.select().from(domains);
  }
  async getDomainsByVendorId(vendorId) {
    return db.select().from(domains).where(eq(domains.vendorId, vendorId));
  }
  async getDomainByName(name) {
    const [domain] = await db.select().from(domains).where(eq(domains.name, name));
    return domain;
  }
  async createDomain(domain) {
    const [newDomain] = await db.insert(domains).values(domain).returning();
    return newDomain;
  }
  async updateDomain(id, data) {
    const [updatedDomain] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updatedDomain;
  }
  async deleteDomain(id) {
    const result = await db.delete(domains).where(eq(domains.id, id));
    return result.count > 0;
  }
  async verifyDomain(id) {
    const domain = await this.getDomain(id);
    if (!domain) return void 0;
    const data = {
      verificationStatus: "verified",
      status: "active",
      lastCheckedAt: /* @__PURE__ */ new Date()
    };
    const [updatedDomain] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updatedDomain;
  }
  async generateVerificationToken(id) {
    const token = `lelekart-verify-${Math.random().toString(36).substring(2, 15)}`;
    const data = {
      verificationToken: token,
      verificationStatus: "pending",
      lastCheckedAt: /* @__PURE__ */ new Date()
    };
    const [updatedDomain] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updatedDomain;
  }
  async checkDomainsSSL() {
    const allDomains = await this.getDomains();
    for (const domain of allDomains) {
      if (domain.status === "active" && domain.verificationStatus === "verified") {
        await db.update(domains).set({
          sslStatus: "active",
          lastCheckedAt: /* @__PURE__ */ new Date()
        }).where(eq(domains.id, domain.id));
      }
    }
  }
  // Product category operations
  async getProductCategory(id) {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category;
  }
  async getProductCategories(vendorId) {
    const categories = await db.select().from(productCategories).where(
      or(
        eq(productCategories.vendorId, vendorId),
        eq(productCategories.isGlobal, true)
      )
    ).orderBy(productCategories.level, productCategories.name);
    let categoryCounts = [];
    if (vendorId) {
      categoryCounts = await db.select({
        categoryId: products.categoryId,
        count: db.fn.count(products.id)
      }).from(products).where(and(
        eq(products.vendorId, vendorId),
        db.isNotNull(products.categoryId)
      )).groupBy(products.categoryId);
    }
    const countMap = /* @__PURE__ */ new Map();
    if (categoryCounts && categoryCounts.length > 0) {
      for (const item of categoryCounts) {
        if (item.categoryId) {
          countMap.set(item.categoryId, Number(item.count));
        }
      }
    }
    return categories.map((category) => ({
      ...category,
      productCount: countMap.get(category.id) || 0
    }));
  }
  async createProductCategory(category) {
    const [newCategory] = await db.insert(productCategories).values(category).returning();
    return newCategory;
  }
  async updateProductCategory(id, data) {
    const [updatedCategory] = await db.update(productCategories).set(data).where(eq(productCategories.id, id)).returning();
    return updatedCategory;
  }
  async getGlobalProductCategories() {
    const categories = await db.select().from(productCategories).where(eq(productCategories.isGlobal, true)).orderBy(productCategories.level, productCategories.name);
    return categories;
  }
  async getAllProductCategories() {
    const categories = await db.select().from(productCategories).orderBy(productCategories.level, productCategories.name);
    return categories;
  }
  async deleteProductCategory(id) {
    const result = await db.delete(productCategories).where(eq(productCategories.id, id));
    return result.count > 0;
  }
  // Product operations
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async getProducts(vendorId) {
    return db.select().from(products).where(eq(products.vendorId, vendorId));
  }
  async getProductsByCategory(categoryId, includeSubcategories = false) {
    if (!includeSubcategories) {
      return db.select().from(products).where(eq(products.categoryId, categoryId));
    }
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, categoryId));
    let subcategoriesQuery = db.select().from(productCategories).where(eq(productCategories.parentId, categoryId));
    const subcategories = await subcategoriesQuery;
    const categoryIds = [categoryId, ...subcategories.map((c) => c.id)];
    return db.select().from(products).where(db.inArray(products.categoryId, categoryIds));
  }
  async createProduct(product) {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  async updateProduct(id, data) {
    const [updatedProduct] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updatedProduct;
  }
  async deleteProduct(id) {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.count > 0;
  }
  // Customer operations
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  async getCustomers(vendorId) {
    return db.select().from(customers).where(eq(customers.vendorId, vendorId));
  }
  async getCustomerByEmail(vendorId, email) {
    const [customer] = await db.select().from(customers).where(eq(customers.vendorId, vendorId)).where(eq(customers.email, email));
    return customer;
  }
  async getCustomerByUserId(userId, vendorId) {
    const user = await this.getUser(userId);
    if (!user || !user.email) return void 0;
    return this.getCustomerByEmail(vendorId, user.email);
  }
  async createCustomer(customer) {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }
  async updateCustomer(id, data) {
    const [updatedCustomer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return updatedCustomer;
  }
  // Customer address operations
  async getCustomerAddress(id) {
    const [address] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, id));
    return address;
  }
  async getCustomerAddresses(customerId) {
    return db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customerId));
  }
  async createCustomerAddress(address) {
    const [newAddress] = await db.insert(customerAddresses).values(address).returning();
    return newAddress;
  }
  async updateCustomerAddress(id, data) {
    const [updatedAddress] = await db.update(customerAddresses).set(data).where(eq(customerAddresses.id, id)).returning();
    return updatedAddress;
  }
  async deleteCustomerAddress(id) {
    const result = await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
    return result.count > 0;
  }
  // Order operations
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrders(vendorId) {
    return db.select().from(orders).where(eq(orders.vendorId, vendorId));
  }
  async getOrderByNumber(orderNumber) {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }
  async createOrder(order) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  async updateOrder(id, data) {
    const [updatedOrder] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  // Order item operations
  async getOrderItem(id) {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item;
  }
  async getOrderItems(orderId) {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async createOrderItem(item) {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }
  async updateOrderItem(id, data) {
    const [updatedItem] = await db.update(orderItems).set(data).where(eq(orderItems.id, id)).returning();
    return updatedItem;
  }
  async deleteOrderItem(id) {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return result.count > 0;
  }
  // Analytics operations
  async getVendorAnalytics(vendorId) {
    return db.select().from(analytics).where(eq(analytics.vendorId, vendorId));
  }
  async createAnalyticsEntry(data) {
    const [newEntry] = await db.insert(analytics).values(data).returning();
    return newEntry;
  }
  async getTopProducts(vendorId, limit = 5) {
    const items = await db.select({
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
      price: orderItems.price
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(eq(products.vendorId, vendorId)).where(eq(orders.status, "completed"));
    const productSales = {};
    items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          sales: 0,
          revenue: 0
        };
      }
      productSales[item.productId].sales += item.quantity;
      productSales[item.productId].revenue += parseFloat(item.price.toString()) * item.quantity;
    });
    return Object.values(productSales).sort((a, b) => b.sales - a.sales).slice(0, limit).map((product) => ({
      name: product.name,
      sales: product.sales,
      revenue: `$${product.revenue.toFixed(2)}`
    }));
  }
  async getSalesByHour(vendorId) {
    const vendorOrders = await db.select({
      createdAt: orders.createdAt,
      status: orders.status
    }).from(orders).where(eq(orders.vendorId, vendorId)).where(eq(orders.status, "completed"));
    const hourMap = {};
    for (let i = 0; i < 24; i++) {
      hourMap[i] = 0;
    }
    vendorOrders.forEach((order) => {
      if (order.createdAt) {
        const hour = new Date(order.createdAt).getHours();
        hourMap[hour]++;
      }
    });
    return Object.entries(hourMap).map(([hour, count]) => {
      const hourNum = parseInt(hour);
      let hourLabel;
      if (hourNum === 0) {
        hourLabel = "12am";
      } else if (hourNum < 12) {
        hourLabel = `${hourNum}am`;
      } else if (hourNum === 12) {
        hourLabel = "12pm";
      } else {
        hourLabel = `${hourNum - 12}pm`;
      }
      return {
        hour: hourLabel,
        sales: count
      };
    }).filter((_, index) => index % 3 === 0);
  }
  async getSalesByCategory(vendorId) {
    const items = await db.select({
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      total: orderItems.total
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).innerJoin(productCategories, eq(products.categoryId, productCategories.id)).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(eq(products.vendorId, vendorId)).where(eq(orders.status, "completed"));
    const categorySales = {};
    let totalSales = 0;
    items.forEach((item) => {
      if (item.categoryId) {
        if (!categorySales[item.categoryId]) {
          categorySales[item.categoryId] = {
            name: item.categoryName || "Uncategorized",
            value: 0,
            amount: 0
          };
        }
        const amount = parseFloat(item.total.toString());
        categorySales[item.categoryId].amount += amount;
        totalSales += amount;
      }
    });
    return Object.values(categorySales).map((category) => ({
      name: category.name,
      value: Math.round(category.amount / (totalSales || 1) * 100),
      amount: `$${category.amount.toFixed(2)}`
    })).sort((a, b) => b.value - a.value);
  }
  // Platform statistics - we'll use SQL aggregation for better performance
  async getPlatformStats() {
    const [vendorCount] = await db.select({ count: sql`count(*)` }).from(vendors);
    const [domainsCount] = await db.select({ count: sql`count(*)` }).from(domains).where(eq(domains.status, "active"));
    const [revenue] = await db.select({ sum: sql`sum(cast(total as decimal))` }).from(orders);
    const [issuesCount] = await db.select({ count: sql`count(*)` }).from(domains).where(eq(domains.verificationStatus, "pending"));
    return {
      totalVendors: Number(vendorCount?.count || 0),
      activeDomains: Number(domainsCount?.count || 0),
      totalRevenue: Number(revenue?.sum || 0),
      pendingIssues: Number(issuesCount?.count || 0)
    };
  }
};
var storage = new DatabaseStorage();

// server/paymentRoutes.ts
import { z as z2 } from "zod";
import { Decimal as Decimal2 } from "decimal.js";
var createPaymentMethodSchema = insertPaymentMethodSchema.extend({
  vendorId: z2.number({
    required_error: "Vendor ID is required"
  })
});
var updatePaymentProviderSettingsSchema = insertPaymentProviderSettingsSchema.omit({
  provider: true,
  vendorId: true
});
var createTransactionSchema = insertTransactionSchema.extend({
  orderId: z2.number().optional(),
  invoiceId: z2.number().optional(),
  externalId: z2.string().optional()
});
var processRefundSchema = z2.object({
  amount: z2.string(),
  reason: z2.string().optional()
});
function registerPaymentRoutes(router) {
  const requireAuth2 = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  const requireVendorOwnership = async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role === "super_admin") {
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
  router.get("/api/payments/commission-settings", requireAuth2, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error getting commission settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/payment-methods", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const methods = await storage.getPaymentMethodsByVendorId(vendorId);
      res.json(methods);
    } catch (error) {
      console.error("Error getting payment methods:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/vendors/:vendorId/payment-methods", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const validatedData = createPaymentMethodSchema.parse({
        ...req.body,
        vendorId
      });
      const method = await storage.createPaymentMethod(validatedData);
      res.status(201).json(method);
    } catch (error) {
      console.error("Error creating payment method:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/payment-methods/:id", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this payment method" });
        }
      }
      res.json(method);
    } catch (error) {
      console.error("Error getting payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.patch("/api/payment-methods/:id", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update this payment method" });
        }
      }
      const updatedMethod = await storage.updatePaymentMethod(id, req.body);
      res.json(updatedMethod);
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.delete("/api/payment-methods/:id", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to delete this payment method" });
        }
      }
      await storage.deletePaymentMethod(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.delete("/api/vendors/:vendorId/payment-methods/:id", requireVendorOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      const vendorId = parseInt(req.params.vendorId);
      if (method.vendorId !== vendorId) {
        return res.status(403).json({ message: "You don't have permission to delete this payment method" });
      }
      await storage.deletePaymentMethod(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.patch("/api/vendors/:vendorId/payment-methods/:id/toggle-status", requireVendorOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorId = parseInt(req.params.vendorId);
      const isActive = req.body.isActive === true;
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (method.vendorId !== vendorId) {
        return res.status(403).json({ message: "You don't have permission to update this payment method" });
      }
      const updatedMethod = await storage.updatePaymentMethod(id, { isActive });
      res.json(updatedMethod);
    } catch (error) {
      console.error("Error toggling payment method status:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.patch("/api/vendors/:vendorId/payment-methods/:id/set-default", requireVendorOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorId = parseInt(req.params.vendorId);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (method.vendorId !== vendorId) {
        return res.status(403).json({ message: "You don't have permission to update this payment method" });
      }
      const updatedMethod = await storage.setDefaultPaymentMethod(id, vendorId);
      res.json(updatedMethod);
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/payment-methods/:id/set-default", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(id);
      if (!method) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || method.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update this payment method" });
        }
      }
      const updatedMethod = await storage.setDefaultPaymentMethod(id, method.vendorId);
      res.json(updatedMethod);
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/payment-providers/:provider", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const provider = req.params.provider;
      const settings = await storage.getPaymentProviderSettingsByVendorId(vendorId, provider);
      if (!settings) {
        return res.status(404).json({ message: "Payment provider settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error getting payment provider settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/vendors/:vendorId/payment-providers/:provider", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const provider = req.params.provider;
      const existingSettings = await storage.getPaymentProviderSettingsByVendorId(vendorId, provider);
      if (existingSettings) {
        const updatedSettings = await storage.updatePaymentProviderSettings(existingSettings.id, req.body);
        return res.json(updatedSettings);
      }
      const settings = await storage.createPaymentProviderSettings({
        ...req.body,
        vendorId,
        provider,
        isActive: req.body.isActive || false
      });
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error updating payment provider settings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/payment-providers/:id/toggle-active", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const isActive = req.body.isActive === true;
      const settings = await storage.getPaymentProviderSettings(id);
      if (!settings) {
        return res.status(404).json({ message: "Payment provider settings not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || settings.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update these settings" });
        }
      }
      const updatedSettings = await storage.togglePaymentProviderActive(id, isActive);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error toggling payment provider status:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/transactions", requireAuth2, async (req, res) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || validatedData.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to create this transaction" });
        }
      }
      const feePercentage = 0.025;
      const transactionFee = 0.3;
      const amount = new Decimal2(validatedData.amount);
      const feeAmount = amount.times(feePercentage).plus(transactionFee).toDecimalPlaces(2);
      const netAmount = amount.minus(feeAmount).toDecimalPlaces(2);
      const transaction = await storage.createTransaction({
        ...validatedData,
        fee: feeAmount.toString(),
        net: netAmount.toString()
      });
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/transactions", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const transactions2 = await storage.getTransactionsByVendorId(vendorId);
      res.json(transactions2);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/transactions/:id", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || transaction.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this transaction" });
        }
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error getting transaction:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/transactions/:id/refund", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || transaction.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to refund this transaction" });
        }
      }
      const validatedData = processRefundSchema.parse(req.body);
      const refundAmount = new Decimal2(validatedData.amount);
      const transactionAmount = new Decimal2(transaction.amount);
      const alreadyRefunded = new Decimal2(transaction.refundedAmount || "0");
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
    } catch (error) {
      console.error("Error processing refund:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/payouts", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const payouts2 = await storage.getPayoutsByVendorId(vendorId);
      res.json(payouts2);
    } catch (error) {
      console.error("Error getting payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/payouts/:id", requireAuth2, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payout = await storage.getPayout(id);
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || payout.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to access this payout" });
        }
      }
      res.json(payout);
    } catch (error) {
      console.error("Error getting payout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/vendors/:vendorId/request-payout", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const transactions2 = await storage.getTransactionsByVendorId(vendorId);
      let availableBalance = new Decimal2(0);
      for (const tx of transactions2) {
        if (tx.type === "payment" && tx.status === "completed" && !tx.isPaidOut) {
          availableBalance = availableBalance.plus(tx.net);
        }
      }
      const minimumPayout = new Decimal2(25);
      if (availableBalance.lt(minimumPayout)) {
        return res.status(400).json({
          message: `Minimum payout amount is $${minimumPayout}. Current available balance: $${availableBalance}`
        });
      }
      const payout = await storage.createPayout({
        vendorId,
        amount: availableBalance.toString(),
        status: "pending",
        paymentMethodId: req.body.paymentMethodId,
        notes: req.body.notes || null
      });
      for (const tx of transactions2) {
        if (tx.type === "payment" && tx.status === "completed" && !tx.isPaidOut) {
          await storage.updateTransaction(tx.id, {
            isPaidOut: true,
            payoutId: payout.id
          });
        }
      }
      res.status(201).json(payout);
    } catch (error) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.post("/api/payouts/:id/complete", requireAuth2, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error completing payout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/available-balance", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const transactions2 = await storage.getTransactionsByVendorId(vendorId);
      let availableBalance = new Decimal2(0);
      let pendingBalance = new Decimal2(0);
      for (const tx of transactions2) {
        if (tx.type === "payment") {
          if (tx.status === "completed" && !tx.isPaidOut) {
            availableBalance = availableBalance.plus(tx.net);
          } else if (tx.status === "pending") {
            pendingBalance = pendingBalance.plus(tx.net);
          }
        } else if (tx.type === "refund" && tx.status === "completed") {
          availableBalance = availableBalance.minus(tx.amount);
        }
      }
      res.json({
        availableBalance: availableBalance.toString(),
        pendingBalance: pendingBalance.toString(),
        currency: "USD"
        // Default currency
      });
    } catch (error) {
      console.error("Error getting available balance:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/transaction-analytics", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const { period = "month", startDate, endDate } = req.query;
      const transactions2 = await storage.getTransactionsByVendorId(vendorId);
      let filteredTransactions = transactions2;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredTransactions = transactions2.filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return txDate >= start && txDate <= end;
        });
      }
      const groupedData = {};
      filteredTransactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        let key;
        if (period === "day") {
          key = date.toISOString().split("T")[0];
        } else if (period === "week") {
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(date.setDate(diff));
          key = monday.toISOString().split("T")[0];
        } else {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        }
        if (!groupedData[key]) {
          groupedData[key] = { sales: new Decimal2(0), refunds: new Decimal2(0), fees: new Decimal2(0), net: new Decimal2(0), count: 0 };
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
      const result = Object.entries(groupedData).map(([date, data]) => ({
        date,
        sales: data.sales.toString(),
        refunds: data.refunds.toString(),
        fees: data.fees.toString(),
        net: data.net.toString(),
        count: data.count
      })).sort((a, b) => a.date.localeCompare(b.date));
      res.json(result);
    } catch (error) {
      console.error("Error getting transaction analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });
  router.get("/api/vendors/:vendorId/transaction-stats", requireVendorOwnership, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const transactions2 = await storage.getTransactionsByVendorId(vendorId);
      let totalSales = new Decimal2(0);
      let totalRefunds = new Decimal2(0);
      let totalFees = new Decimal2(0);
      let totalNet = new Decimal2(0);
      let transactionCount = 0;
      let refundCount = 0;
      const now = /* @__PURE__ */ new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      let monthSales = new Decimal2(0);
      let monthRefunds = new Decimal2(0);
      let monthNet = new Decimal2(0);
      let monthCount = 0;
      transactions2.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (tx.type === "payment" && tx.status === "completed") {
          totalSales = totalSales.plus(tx.amount);
          totalFees = totalFees.plus(tx.fee || 0);
          totalNet = totalNet.plus(tx.net);
          transactionCount += 1;
          if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
            monthSales = monthSales.plus(tx.amount);
            monthNet = monthNet.plus(tx.net);
            monthCount += 1;
          }
        } else if (tx.type === "refund" && tx.status === "completed") {
          totalRefunds = totalRefunds.plus(tx.amount);
          refundCount += 1;
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
        currency: "USD"
        // Default currency
      });
    } catch (error) {
      console.error("Error getting transaction stats:", error);
      res.status(500).json({ message: error.message });
    }
  });
}

// server/paypal.ts
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController
} from "@paypal/paypal-server-sdk";
var { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
var client = null;
var ordersController = null;
var oAuthAuthorizationController = null;
if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET
    },
    timeout: 0,
    environment: process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true
      },
      logResponse: {
        logHeaders: true
      }
    }
  });
  ordersController = new OrdersController(client);
  oAuthAuthorizationController = new OAuthAuthorizationController(client);
}
async function getClientToken() {
  if (!client || !oAuthAuthorizationController || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal client is not configured. Missing API credentials.");
  }
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`
    },
    { intent: "sdk_init", response_type: "client_token" }
  );
  return result.accessToken;
}
async function createPaypalOrder(req, res) {
  try {
    if (!client || !ordersController) {
      return res.status(500).json({
        error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment variables."
      });
    }
    const { amount, currency, intent } = req.body;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number."
      });
    }
    if (!currency) {
      return res.status(400).json({ error: "Invalid currency. Currency is required." });
    }
    if (!intent) {
      return res.status(400).json({ error: "Invalid intent. Intent is required." });
    }
    const collect = {
      body: {
        intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount
            }
          }
        ]
      },
      prefer: "return=minimal"
    };
    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}
async function capturePaypalOrder(req, res) {
  try {
    if (!client || !ordersController) {
      return res.status(500).json({
        error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment variables."
      });
    }
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal"
    };
    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}
async function loadPaypalDefault(req, res) {
  try {
    if (!client) {
      return res.status(500).json({
        error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment variables."
      });
    }
    const clientToken = await getClientToken();
    res.json({
      clientToken
    });
  } catch (error) {
    console.error("Failed to load PayPal setup:", error);
    res.status(500).json({ error: "Failed to initialize PayPal." });
  }
}

// server/routes.ts
import { ZodError } from "zod";

// server/auth.ts
import session2 from "express-session";
import { randomBytes } from "crypto";
import { z as z3 } from "zod";

// server/emailService.ts
import nodemailer from "nodemailer";
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn("Email credentials not set. Email functionality will be limited or disabled.");
}
var createTransporter = async () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log(`Creating email transporter with host: ${process.env.EMAIL_HOST}, user: ${process.env.EMAIL_USER}`);
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "465"),
      secure: true,
      // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  console.warn("No email credentials found. Using console transport instead.");
  return {
    sendMail: async (mailOptions) => {
      console.log("\u26A0\uFE0F Email credentials not configured. Email would have been sent:");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("Text:", mailOptions.text);
      console.log("HTML:", mailOptions.html);
      return {
        messageId: "test-message-id",
        previewURL: null
      };
    }
  };
};
var generateOtp = () => {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
};
var sendOtpEmail = async (to, otp) => {
  try {
    const transporter = await createTransporter();
    const appName = process.env.VITE_APP_NAME || "MultiVend";
    const mailOptions = {
      from: process.env.EMAIL_USER || `"${appName}" <no-reply@multivend.app>`,
      to,
      subject: `Your ${appName} Verification Code`,
      text: `Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">${appName}</h1>
            <p style="margin: 10px 0 0;">Your Verification Code</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">Use the following code to verify your email:</p>
            <div style="background-color: #eee; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #333;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    const isEtherealEmail = typeof info === "object" && info.envelope && info.envelope.from && info.envelope.from.includes("ethereal.email");
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: isEtherealEmail ? nodemailer.getTestMessageUrl(info) : void 0
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
};

// server/auth.ts
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 30,
      // 30 days for longer sessions
      sameSite: "lax",
      httpOnly: true,
      path: "/"
    }
  };
  if (process.env.NODE_ENV === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session2(sessionSettings));
  app2.use((req, res, next) => {
    req.login = (user, done) => {
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        }
        done(err);
      });
    };
    req.logout = (done) => {
      req.session.destroy((err) => {
        done(err);
      });
    };
    next();
  });
  app2.use((req, res, next) => {
    req.isAuthenticated = () => {
      return req.session.user != null;
    };
    if (req.session.user) {
      req.user = req.session.user;
    }
    next();
  });
  app2.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const emailSchema = z3.string().email();
      const validationResult = emailSchema.safeParse(email);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.createOtp(email, otp, expiresAt);
      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        return res.status(500).json({ message: "Failed to send OTP email" });
      }
      return res.status(200).json({
        message: "OTP sent to email",
        previewUrl: process.env.NODE_ENV !== "production" ? emailResult.previewUrl : void 0
      });
    } catch (err) {
      console.error("Error requesting OTP:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }
      const latestOtp = await storage.getLatestOtp(email);
      if (!latestOtp) {
        return res.status(400).json({ message: "No valid OTP found for this email" });
      }
      if (latestOtp.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      if (latestOtp.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ message: "OTP has expired" });
      }
      if (latestOtp.isUsed) {
        return res.status(400).json({ message: "OTP has already been used" });
      }
      await storage.markOtpAsUsed(latestOtp.id);
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const role = req.body.isCustomer ? "customer" : "vendor";
        user = await storage.createUser({
          email,
          role,
          isProfileComplete: false
        });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to log in" });
        }
        return res.status(200).json(user);
      });
    } catch (err) {
      console.error("Error verifying OTP:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      req.session.touch();
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        return res.status(200).json(req.user);
      });
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    if (req.session.originalUser) {
      const originalUser = req.session.originalUser;
      delete req.session.originalUser;
      req.login(originalUser, (err) => {
        if (err) {
          console.error("Error returning to original user:", err);
          return res.status(500).json({ message: "Failed to return to original account" });
        }
        return res.status(200).json({
          message: "Returned to original account",
          user: originalUser,
          impersonationEnded: true
        });
      });
    } else {
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to log out" });
        }
        return res.status(200).json({ message: "Logged out successfully" });
      });
    }
  });
  app2.post("/api/auth/impersonate/:userId", hasRole(["super_admin"]), async (req, res) => {
    try {
      const { userId } = req.params;
      const targetUser = await storage.getUser(parseInt(userId));
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      req.session.originalUser = req.user;
      const impersonatedUser = {
        ...targetUser,
        originalUserId: req.user.id,
        isImpersonated: true
      };
      req.login(impersonatedUser, (err) => {
        if (err) {
          console.error("Impersonation login error:", err);
          return res.status(500).json({ message: "Failed to impersonate user" });
        }
        return res.status(200).json({
          message: "Impersonation started",
          user: impersonatedUser,
          impersonationStarted: true
        });
      });
    } catch (error) {
      console.error("Error during impersonation:", error);
      return res.status(500).json({ message: "Failed to impersonate user" });
    }
  });
  app2.get("/api/auth/impersonation-status", isAuthenticated, (req, res) => {
    const isImpersonating = Boolean(req.session.originalUser);
    const originalUser = req.session.originalUser || null;
    return res.status(200).json({
      isImpersonating,
      originalUser: isImpersonating ? {
        id: originalUser.id,
        email: originalUser.email,
        role: originalUser.role,
        firstName: originalUser.firstName,
        lastName: originalUser.lastName
      } : null
    });
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, firstName, lastName, password, role } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password,
        role: role || "vendor",
        isProfileComplete: true
      });
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "User created but failed to log in" });
        }
        return res.status(200).json(user);
      });
    } catch (err) {
      console.error("Error during user registration:", err);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });
}
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
}
function hasRole(roles) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

// server/uploadService.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var storage2 = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
var imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"));
  }
  cb(null, true);
};
var uploadMiddleware = multer({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: imageFilter
});
function registerUploadRoutes(app2) {
  app2.post("/api/upload", uploadMiddleware.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      return res.status(200).json({
        message: "File uploaded successfully",
        url: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "Upload failed", error: String(error) });
    }
  });
  app2.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      next();
    }
  });
}

// server/s3Config.ts
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer2 from "multer";
import multerS3 from "multer-s3";
import path2 from "path";
import crypto from "crypto";
if (!process.env.AWS_ACCESS_KEY_ID) throw new Error("AWS_ACCESS_KEY_ID is required");
if (!process.env.AWS_SECRET_ACCESS_KEY) throw new Error("AWS_SECRET_ACCESS_KEY is required");
if (!process.env.AWS_REGION) throw new Error("AWS_REGION is required");
if (!process.env.AWS_BUCKET_NAME) throw new Error("AWS_BUCKET_NAME is required");
var s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
var bucketName = process.env.AWS_BUCKET_NAME;
var generatePresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};
var s3Storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  metadata: (_req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const fileExtension = path2.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});
var fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};
var upload = multer2({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB
  }
});
var productImageUpload = multer2({
  storage: s3Storage,
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for product images"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB
  }
});
var deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
};
var getKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};

// server/s3UploadService.ts
function registerS3UploadRoutes(app2) {
  app2.post("/api/s3/upload", isAuthenticated, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileData = req.file;
      return res.status(200).json({
        message: "File uploaded successfully",
        url: fileData.location,
        key: fileData.key,
        mimetype: fileData.mimetype,
        size: fileData.size
      });
    } catch (error) {
      console.error("S3 upload error:", error);
      return res.status(500).json({ message: "Upload failed", error: String(error) });
    }
  });
  app2.post("/api/s3/upload/product-image", isAuthenticated, productImageUpload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      const fileData = req.file;
      return res.status(200).json({
        message: "Product image uploaded successfully",
        url: fileData.location,
        key: fileData.key,
        mimetype: fileData.mimetype,
        size: fileData.size
      });
    } catch (error) {
      console.error("S3 product image upload error:", error);
      return res.status(500).json({ message: "Upload failed", error: String(error) });
    }
  });
  app2.post("/api/s3/upload/multiple", isAuthenticated, upload.array("files", 10), (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const filesData = req.files;
      const uploadedFiles = filesData.map((file) => ({
        url: file.location,
        key: file.key,
        mimetype: file.mimetype,
        size: file.size,
        originalname: file.originalname
      }));
      return res.status(200).json({
        message: `${uploadedFiles.length} files uploaded successfully`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error("S3 multiple files upload error:", error);
      return res.status(500).json({ message: "Upload failed", error: String(error) });
    }
  });
  app2.get("/api/s3/signed-url/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      if (!key) {
        return res.status(400).json({ message: "File key is required" });
      }
      const url = await generatePresignedUrl(key);
      return res.status(200).json({ url });
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      return res.status(500).json({ message: "Error generating signed URL", error: String(error) });
    }
  });
  app2.delete("/api/s3/files", isAuthenticated, async (req, res) => {
    try {
      const { url, key } = req.body;
      if (!url && !key) {
        return res.status(400).json({ message: "Either file URL or key is required" });
      }
      const fileKey = key || (url ? getKeyFromUrl(url) : null);
      if (!fileKey) {
        return res.status(400).json({ message: "Invalid file URL or key" });
      }
      const deleted = await deleteFileFromS3(fileKey);
      if (deleted) {
        return res.status(200).json({ message: "File deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete file" });
      }
    } catch (error) {
      console.error("S3 file deletion error:", error);
      return res.status(500).json({ message: "File deletion failed", error: String(error) });
    }
  });
}

// server/checkoutRoutes.ts
import { z as z4 } from "zod";

// server/utils/orderNumberGenerator.ts
function generateOrderNumber() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const randomPart = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
  return `MV${randomPart}${datePart}`;
}

// server/checkoutRoutes.ts
function registerCheckoutRoutes(app2) {
  app2.get("/api/cart", async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (userId) {
        const cart = await storage.getCartByUserId(userId);
        return res.status(200).json(cart);
      } else if (sessionId) {
        const cart = await storage.getCartBySessionId(sessionId);
        return res.status(200).json(cart);
      } else {
        return res.status(400).json({ message: "No user or session ID available" });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      return res.status(500).json({ message: "Failed to fetch cart" });
    }
  });
  app2.post("/api/cart/add", async (req, res) => {
    try {
      const schema = z4.object({
        productId: z4.number(),
        quantity: z4.number().positive(),
        variant: z4.string().optional(),
        vendorId: z4.number()
      });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      const cart = await storage.addToCart(userId, sessionId, validation.data);
      return res.status(200).json(cart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      return res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  app2.put("/api/cart/items/:itemId", async (req, res) => {
    try {
      const schema = z4.object({
        quantity: z4.number().positive()
      });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      const cart = await storage.updateCartItemQuantity(userId, sessionId, itemId, validation.data.quantity);
      return res.status(200).json(cart);
    } catch (error) {
      console.error("Error updating cart item:", error);
      return res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      const cart = await storage.removeFromCart(userId, sessionId, itemId);
      return res.status(200).json(cart);
    } catch (error) {
      console.error("Error removing cart item:", error);
      return res.status(500).json({ message: "Failed to remove cart item" });
    }
  });
  app2.delete("/api/cart", async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      await storage.clearCart(userId, sessionId);
      return res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      return res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  app2.post("/api/checkout", async (req, res) => {
    try {
      const schema = z4.object({
        shippingAddress: z4.object({
          addressLine1: z4.string(),
          addressLine2: z4.string().optional(),
          city: z4.string(),
          state: z4.string(),
          postalCode: z4.string(),
          country: z4.string()
        }),
        paymentMethod: z4.string(),
        // 'cod', 'paypal', 'stripe', etc.
        vendorId: z4.number(),
        notes: z4.string().optional()
      });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      const cart = userId ? await storage.getCartByUserId(userId) : await storage.getCartBySessionId(sessionId);
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      let customerId = null;
      if (userId) {
        const customer = await storage.getCustomerByUserId(userId, validation.data.vendorId);
        if (customer) {
          customerId = customer.id;
        } else {
          const customerData = {
            email: req.user?.email || "",
            firstName: req.user?.firstName || null,
            lastName: req.user?.lastName || null,
            phone: req.user?.phone || null,
            vendorId: validation.data.vendorId,
            totalOrders: 0,
            totalSpent: "0.00"
          };
          const newCustomer = await storage.createCustomer(customerData);
          customerId = newCustomer.id;
        }
      }
      const orderNumber = generateOrderNumber();
      const order = await storage.createOrder({
        vendorId: validation.data.vendorId,
        customerId,
        orderNumber,
        subtotal: cart.subtotal || "0.00",
        tax: cart.tax || "0.00",
        total: cart.total || "0.00",
        status: "pending",
        paymentMethod: validation.data.paymentMethod,
        paymentStatus: validation.data.paymentMethod === "cod" ? "pending" : "unpaid",
        shippingAddress: `${validation.data.shippingAddress.addressLine1}, ${validation.data.shippingAddress.city}, ${validation.data.shippingAddress.state}`,
        currency: "INR",
        // Default to INR, can make dynamic later
        notes: validation.data.notes || null
      });
      for (const item of cart.items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          variantInfo: item.variant || null
        });
      }
      await storage.clearCart(userId, sessionId);
      return res.status(201).json(order);
    } catch (error) {
      console.error("Error processing checkout:", error);
      return res.status(500).json({ message: "Checkout failed" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(orderId);
      return res.status(200).json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const vendorId = req.query.vendorId ? parseInt(req.query.vendorId) : null;
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id, vendorId);
      if (!customer) {
        return res.status(200).json([]);
      }
      const orders2 = await storage.getOrders(vendorId);
      const customerOrders = orders2.filter((order) => order.customerId === customer.id);
      const ordersWithItems = await Promise.all(
        customerOrders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );
      return res.status(200).json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
}

// server/addressRoutes.ts
var authMiddleware = (req, res, next) => {
  isAuthenticated(req, res, () => {
    next();
  });
};
function registerAddressRoutes(app2) {
  app2.get("/api/addresses", authMiddleware, async (req, res) => {
    const authReq = req;
    try {
      const userId = authReq.user?.id;
      const vendorId = parseInt(req.query.vendorId);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      const customer = await storage.getCustomerByUserId(userId, vendorId);
      if (!customer) {
        return res.status(200).json([]);
      }
      const addresses = await storage.getCustomerAddresses(customer.id);
      return res.status(200).json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });
  app2.post("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const vendorId = parseInt(req.body.vendorId);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      const validation = insertCustomerAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      let customer = await storage.getCustomerByUserId(userId, vendorId);
      if (!customer) {
        customer = await storage.createCustomer({
          email: req.user?.email || "",
          firstName: req.user?.firstName || null,
          lastName: req.user?.lastName || null,
          phone: req.user?.phone || null,
          vendorId,
          totalOrders: 0,
          totalSpent: "0.00"
        });
      }
      const existingAddresses = await storage.getCustomerAddresses(customer.id);
      const isDefault = existingAddresses.length === 0 ? true : validation.data.isDefault;
      if (isDefault) {
        for (const address2 of existingAddresses) {
          if (address2.isDefault) {
            await storage.updateCustomerAddress(address2.id, { isDefault: false });
          }
        }
      }
      const address = await storage.createCustomerAddress({
        ...validation.data,
        customerId: customer.id,
        isDefault
      });
      return res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      return res.status(500).json({ message: "Failed to create address" });
    }
  });
  app2.put("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      const customer = await storage.getCustomerByUserId(req.user?.id, req.body.vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      const validation = insertCustomerAddressSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      if (validation.data.isDefault) {
        const addresses = await storage.getCustomerAddresses(customer.id);
        for (const addr of addresses) {
          if (addr.id !== addressId && addr.isDefault) {
            await storage.updateCustomerAddress(addr.id, { isDefault: false });
          }
        }
      }
      const updatedAddress = await storage.updateCustomerAddress(addressId, validation.data);
      return res.status(200).json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      return res.status(500).json({ message: "Failed to update address" });
    }
  });
  app2.delete("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      const vendorId = parseInt(req.query.vendorId);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      const customer = await storage.getCustomerByUserId(req.user?.id, vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to delete this address" });
      }
      if (address.isDefault) {
        const addresses = await storage.getCustomerAddresses(customer.id);
        const otherAddress = addresses.find((a) => a.id !== addressId);
        if (otherAddress) {
          await storage.updateCustomerAddress(otherAddress.id, { isDefault: true });
        }
      }
      await storage.deleteCustomerAddress(addressId);
      return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      return res.status(500).json({ message: "Failed to delete address" });
    }
  });
  app2.post("/api/addresses/:id/set-default", isAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      const vendorId = parseInt(req.body.vendorId);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      const customer = await storage.getCustomerByUserId(req.user?.id, vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      const addresses = await storage.getCustomerAddresses(customer.id);
      for (const addr of addresses) {
        if (addr.id !== addressId && addr.isDefault) {
          await storage.updateCustomerAddress(addr.id, { isDefault: false });
        }
      }
      const updatedAddress = await storage.updateCustomerAddress(addressId, { isDefault: true });
      return res.status(200).json(updatedAddress);
    } catch (error) {
      console.error("Error setting default address:", error);
      return res.status(500).json({ message: "Failed to set default address" });
    }
  });
}

// server/subscriptionRoutes.ts
import Stripe from "stripe";
import { z as z5 } from "zod";
var stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16"
  });
} else {
  console.warn("STRIPE_SECRET_KEY not set. Stripe functionality will be unavailable.");
}
var requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
var changePlanSchema = z5.object({
  planId: z5.number()
});
var changeBillingCycleSchema = z5.object({
  billingCycle: z5.enum(["monthly", "yearly"])
});
var cancelSubscriptionSchema = z5.object({
  cancelAtPeriodEnd: z5.boolean(),
  cancelReason: z5.string().optional()
});
function registerSubscriptionRoutes(app2) {
  app2.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });
  app2.get("/api/vendor/subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      if (!vendorId) {
        return res.status(404).json({ message: "Vendor account not found" });
      }
      const subscription = await storage.getVendorSubscription(vendorId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching vendor subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription details" });
    }
  });
  app2.post("/api/vendor/subscription/start-trial", requireAuth, async (req, res) => {
    try {
      const { planId } = changePlanSchema.parse(req.body);
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      if (!vendorId) {
        return res.status(404).json({ message: "Vendor account not found" });
      }
      const existingSubscription = await storage.getVendorSubscription(vendorId);
      if (existingSubscription) {
        return res.status(400).json({ message: "Vendor already has a subscription" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      const trialEndsAt = /* @__PURE__ */ new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);
      const subscription = await storage.createVendorSubscription({
        vendorId,
        planId,
        status: "trialing",
        startDate: /* @__PURE__ */ new Date(),
        trialEndsAt,
        billingCycle: "monthly",
        // Default to monthly
        amount: plan.price,
        currency: "USD",
        renewalDate: trialEndsAt
        // Renewal will be after trial
      });
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error starting trial subscription:", error);
      res.status(500).json({ message: "Failed to start trial subscription" });
    }
  });
  app2.post("/api/vendor/subscription/change-plan", requireAuth, async (req, res) => {
    try {
      const { planId } = changePlanSchema.parse(req.body);
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      if (!vendorId) {
        return res.status(404).json({ message: "Vendor account not found" });
      }
      const currentSubscription = await storage.getVendorSubscription(vendorId);
      if (!currentSubscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      const newPlan = await storage.getSubscriptionPlanById(planId);
      if (!newPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (stripe && currentSubscription.stripeSubscriptionId) {
        try {
          const stripePriceId = currentSubscription.billingCycle === "yearly" ? newPlan.stripePriceIdYearly : newPlan.stripePriceIdMonthly;
          if (!stripePriceId) {
            return res.status(400).json({
              message: `No Stripe price ID found for ${currentSubscription.billingCycle} billing cycle`
            });
          }
          await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
            items: [{
              id: currentSubscription.stripeItemId || "",
              price: stripePriceId
            }]
          });
        } catch (stripeErr) {
          console.error("Stripe subscription update error:", stripeErr);
          return res.status(500).json({
            message: "Failed to update subscription with payment provider",
            error: stripeErr.message
          });
        }
      }
      const amount = currentSubscription.billingCycle === "yearly" ? newPlan.yearlyPrice || newPlan.price : newPlan.price;
      const updatedSubscription = await storage.updateVendorSubscription(currentSubscription.id, {
        planId,
        amount
      });
      res.json(updatedSubscription);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ message: "Failed to change subscription plan" });
    }
  });
  app2.post("/api/vendor/subscription/change-billing-cycle", requireAuth, async (req, res) => {
    try {
      const { billingCycle } = changeBillingCycleSchema.parse(req.body);
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      if (!vendorId) {
        return res.status(404).json({ message: "Vendor account not found" });
      }
      const subscription = await storage.getVendorSubscription(vendorId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      const plan = await storage.getSubscriptionPlanById(subscription.planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      if (subscription.billingCycle === billingCycle) {
        return res.status(400).json({
          message: `Subscription is already on ${billingCycle} billing cycle`
        });
      }
      if (stripe && subscription.stripeSubscriptionId) {
        try {
          const stripePriceId = billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
          if (!stripePriceId) {
            return res.status(400).json({
              message: `No Stripe price ID found for ${billingCycle} billing cycle`
            });
          }
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [{
              id: subscription.stripeItemId || "",
              price: stripePriceId
            }]
          });
        } catch (stripeErr) {
          console.error("Stripe subscription update error:", stripeErr);
          return res.status(500).json({
            message: "Failed to update billing cycle with payment provider",
            error: stripeErr.message
          });
        }
      }
      const amount = billingCycle === "yearly" ? plan.yearlyPrice || plan.price : plan.price;
      const updatedSubscription = await storage.updateVendorSubscription(subscription.id, {
        billingCycle,
        amount
      });
      res.json(updatedSubscription);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error changing billing cycle:", error);
      res.status(500).json({ message: "Failed to change billing cycle" });
    }
  });
  app2.post("/api/vendor/subscription/cancel", requireAuth, async (req, res) => {
    try {
      const { cancelAtPeriodEnd, cancelReason } = cancelSubscriptionSchema.parse(req.body);
      const userId = req.user.id;
      const vendorId = await storage.getVendorIdByUserId(userId);
      if (!vendorId) {
        return res.status(404).json({ message: "Vendor account not found" });
      }
      const subscription = await storage.getVendorSubscription(vendorId);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      if (subscription.status === "canceled" || subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ message: "Subscription is already canceled" });
      }
      if (stripe && subscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: cancelAtPeriodEnd
          });
        } catch (stripeErr) {
          console.error("Stripe subscription cancellation error:", stripeErr);
          return res.status(500).json({
            message: "Failed to cancel subscription with payment provider",
            error: stripeErr.message
          });
        }
      }
      const updatedSubscription = await storage.updateVendorSubscription(subscription.id, {
        cancelAtPeriodEnd,
        cancelReason: cancelReason || null,
        ...cancelAtPeriodEnd ? {} : { status: "canceled", endDate: /* @__PURE__ */ new Date() }
      });
      res.json(updatedSubscription);
    } catch (error) {
      if (error instanceof z5.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  return app2;
}

// server/routes.ts
function handleValidationError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }
  if (err && typeof err === "object" && "code" in err) {
    if (err.code === "22P02") {
      return res.status(400).json({
        message: "Invalid numeric value provided",
        details: err.message || "Please check all numeric fields"
      });
    }
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
async function registerRoutes(app2) {
  setupAuth(app2);
  registerS3UploadRoutes(app2);
  registerUploadRoutes(app2);
  app2.get("/api/users", hasRole(["super_admin"]), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      return res.status(200).json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (id !== req.user.id && req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: You can only access your own user data" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (id !== req.user.id && req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: You can only update your own user data" });
      }
      const userData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertUserSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Failed to update session:", err);
        }
      });
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.post("/api/users/complete-profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, isProfileComplete, vendor } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userData = {
        firstName,
        lastName,
        isProfileComplete
      };
      const updatedUser = await storage.updateUser(req.user.id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      let vendorRecord = null;
      if (vendor && vendor.companyName && vendor.subdomainName) {
        const vendorData = insertVendorSchema.parse({
          userId: req.user.id,
          companyName: vendor.companyName,
          status: "active"
        });
        vendorRecord = await storage.createVendor(vendorData);
        if (vendorRecord) {
          const domainData = insertDomainSchema.parse({
            vendorId: vendorRecord.id,
            name: `${vendor.subdomainName}.multivend.com`,
            type: "subdomain",
            status: "pending",
            isPrimary: true
          });
          await storage.createDomain(domainData);
        }
      }
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Failed to update session:", err);
        }
      });
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({
        ...userWithoutPassword,
        vendor: vendorRecord
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      return res.status(200).json(plans);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      return res.status(200).json(plan);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/subscription-plans", async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(planData);
      return res.status(201).json(plan);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/subscription-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const planData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertSubscriptionPlanSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedPlan = await storage.updateSubscriptionPlan(id, planData);
      if (!updatedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      return res.status(200).json(updatedPlan);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.delete("/api/subscription-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      const deleted = await storage.deleteSubscriptionPlan(id);
      if (!deleted) {
        return res.status(409).json({
          message: "Cannot delete this subscription plan as it is currently in use by one or more vendors",
          error: "PLAN_IN_USE"
        });
      }
      return res.status(200).json({ message: "Subscription plan deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/migrate", async (req, res) => {
    try {
      await pool.query(`
        ALTER TABLE vendors 
        ADD COLUMN IF NOT EXISTS color_palette text DEFAULT 'default'
      `);
      await pool.query(`
        ALTER TABLE vendors 
        ADD COLUMN IF NOT EXISTS font_settings jsonb
      `);
      return res.status(200).json({ message: "Migration completed successfully" });
    } catch (err) {
      console.error("Migration error:", err);
      return res.status(500).json({ message: "Migration failed", error: err.message });
    }
  });
  app2.get("/api/vendors", async (_req, res) => {
    try {
      const vendors2 = await storage.getVendors();
      const vendorsWithDetails = await Promise.all(vendors2.map(async (vendor) => {
        const user = await storage.getUser(vendor.userId);
        const subscriptionPlan = vendor.subscriptionPlanId ? await storage.getSubscriptionPlan(vendor.subscriptionPlanId) : null;
        const domains2 = await storage.getDomainsByVendorId(vendor.id);
        return {
          ...vendor,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl
          } : null,
          subscriptionPlan,
          domains: domains2
        };
      }));
      return res.status(200).json(vendorsWithDetails);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const user = await storage.getUser(vendor.userId);
      const subscriptionPlan = vendor.subscriptionPlanId ? await storage.getSubscriptionPlan(vendor.subscriptionPlanId) : null;
      const domains2 = await storage.getDomainsByVendorId(vendor.id);
      return res.status(200).json({
        ...vendor,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        } : null,
        subscriptionPlan,
        domains: domains2
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/vendors", async (req, res) => {
    try {
      const vendorData = insertVendorSchema.parse(req.body);
      const user = await storage.getUser(vendorData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (vendorData.subscriptionPlanId) {
        const plan = await storage.getSubscriptionPlan(vendorData.subscriptionPlanId);
        if (!plan) {
          return res.status(404).json({ message: "Subscription plan not found" });
        }
      }
      const vendor = await storage.createVendor(vendorData);
      if (req.body.createSubdomain && req.body.subdomainName) {
        const domainData = insertDomainSchema.parse({
          vendorId: vendor.id,
          name: `${req.body.subdomainName}.multivend.com`,
          type: "subdomain",
          status: "pending",
          isPrimary: true
        });
        await storage.createDomain(domainData);
      }
      return res.status(201).json(vendor);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertVendorSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedVendor = await storage.updateVendor(id, vendorData);
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      return res.status(200).json(updatedVendor);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.get("/api/domains", async (_req, res) => {
    try {
      const domains2 = await storage.getDomains();
      const domainsWithVendors = await Promise.all(domains2.map(async (domain) => {
        const vendor = await storage.getVendor(domain.vendorId);
        return {
          ...domain,
          vendor: vendor ? {
            id: vendor.id,
            companyName: vendor.companyName,
            logoUrl: vendor.logoUrl
          } : null
        };
      }));
      return res.status(200).json(domainsWithVendors);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/domains", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const domains2 = await storage.getDomainsByVendorId(vendorId);
      return res.status(200).json(domains2);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      const vendor = await storage.getVendor(domain.vendorId);
      return res.status(200).json({
        ...domain,
        vendor: vendor ? {
          id: vendor.id,
          companyName: vendor.companyName,
          logoUrl: vendor.logoUrl
        } : null
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/domains", async (req, res) => {
    try {
      const domainData = insertDomainSchema.parse(req.body);
      const vendor = await storage.getVendor(domainData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const existingDomain = await storage.getDomainByName(domainData.name);
      if (existingDomain) {
        return res.status(409).json({ message: "Domain name already in use" });
      }
      if (domainData.type === "custom" && vendor.subscriptionPlanId) {
        const plan = await storage.getSubscriptionPlan(vendor.subscriptionPlanId);
        if (plan) {
          const existingCustomDomains = (await storage.getDomainsByVendorId(vendor.id)).filter((d) => d.type === "custom").length;
          if (existingCustomDomains >= plan.customDomainLimit) {
            return res.status(403).json({
              message: `Your plan allows a maximum of ${plan.customDomainLimit} custom domains`
            });
          }
        }
      }
      const domain = await storage.createDomain(domainData);
      return res.status(201).json(domain);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domainData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertDomainSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedDomain = await storage.updateDomain(id, domainData);
      if (!updatedDomain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      return res.status(200).json(updatedDomain);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.delete("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      const success = await storage.deleteDomain(id);
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete domain" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/domains/:id/generate-token", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      const updatedDomain = await storage.generateVerificationToken(id);
      return res.status(200).json(updatedDomain);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      const verifiedDomain = await storage.verifyDomain(id);
      return res.status(200).json(verifiedDomain);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/domains/:id/dns-records", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      if (domain.type !== "custom") {
        return res.status(200).json([]);
      }
      if (domain.dnsRecords && domain.dnsRecords.length > 0) {
        return res.status(200).json(domain.dnsRecords);
      }
      const verificationToken = domain.verificationToken || `multivend-verify-${Math.random().toString(36).substring(2, 15)}`;
      const dnsRecords = [
        { type: "TXT", name: `_multivend-verification.${domain.name}`, value: verificationToken },
        { type: "CNAME", name: domain.name, value: "stores.multivend.com" },
        { type: "CNAME", name: `www.${domain.name}`, value: "stores.multivend.com" }
      ];
      await storage.updateDomain(id, {
        verificationToken,
        dnsRecords
      });
      return res.status(200).json(dnsRecords);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/domains/check-ssl", hasRole(["super_admin"]), async (req, res) => {
    try {
      await storage.checkDomainsSSL();
      return res.status(200).json({ message: "SSL status check completed" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/products", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
      const includeSubcategories = req.query.includeSubcategories === "true";
      let products2;
      if (categoryId) {
        products2 = await storage.getProductsByCategory(categoryId, includeSubcategories);
        products2 = products2.filter((p) => p.vendorId === vendorId);
      } else {
        products2 = await storage.getProducts(vendorId);
      }
      return res.status(200).json(products2 || []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      if (req.params.id === "new") {
        return res.status(200).json({ id: null, isNew: true });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      let category = null;
      if (product.categoryId) {
        category = await storage.getProductCategory(product.categoryId);
      }
      return res.status(200).json({
        ...product,
        category
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      let vendor;
      if (req.isAuthenticated() && req.user && req.user.isImpersonated) {
        vendor = await storage.getVendorByUserId(req.user.id);
        if (vendor) {
          productData.vendorId = vendor.id;
        }
      }
      if (!vendor) {
        vendor = await storage.getVendor(productData.vendorId);
      }
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      if (productData.categoryId) {
        const category = await storage.getProductCategory(productData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        if (category.vendorId !== productData.vendorId) {
          return res.status(403).json({ message: "Category does not belong to this vendor" });
        }
      }
      if (vendor.subscriptionPlanId) {
        const plan = await storage.getSubscriptionPlan(vendor.subscriptionPlanId);
        if (plan) {
          const existingProducts = (await storage.getProducts(vendor.id)).length;
          if (existingProducts >= plan.productLimit) {
            return res.status(403).json({
              message: `Your plan allows a maximum of ${plan.productLimit} products`
            });
          }
        }
      }
      const product = await storage.createProduct(productData);
      return res.status(201).json(product);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertProductSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (productData.categoryId && productData.categoryId !== product.categoryId) {
        const category = await storage.getProductCategory(productData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        if (category.vendorId !== product.vendorId) {
          return res.status(403).json({ message: "Category does not belong to this vendor" });
        }
      }
      const updatedProduct = await storage.updateProduct(id, productData);
      return res.status(200).json(updatedProduct);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const success = await storage.deleteProduct(id);
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete product" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/products/:productId/variants", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const variants = await storage.getProductVariantsByProductId(productId);
      return res.status(200).json(variants);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/product-variants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variant = await storage.getProductVariant(id);
      if (!variant) {
        return res.status(404).json({ message: "Product variant not found" });
      }
      return res.status(200).json(variant);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/products/:productId/variants", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const variants = req.body;
      if (!Array.isArray(variants)) {
        return res.status(400).json({ message: "Variants must be an array" });
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const vendor = await storage.getVendor(product.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      if (req.isAuthenticated() && req.user && req.user.isImpersonated) {
        const userVendor = await storage.getVendorByUserId(req.user.id);
        if (userVendor && product.vendorId !== userVendor.id) {
          return res.status(403).json({ message: "You don't have permission to update variants for this product" });
        }
      }
      const processedVariants = [];
      for (const variant of variants) {
        try {
          if (variant.id) {
            const variantData = {
              ...variant,
              productId
            };
            const variantId = typeof variant.id === "number" && variant.id > 0 ? variant.id : null;
            if (variantId) {
              insertProductVariantSchema.parse(variantData);
              const updatedVariant = await storage.updateProductVariant(variantId, variantData);
              if (updatedVariant) {
                processedVariants.push(updatedVariant);
              }
            } else {
              const newVariantData = {
                ...variant,
                productId
              };
              delete newVariantData.id;
              insertProductVariantSchema.parse(newVariantData);
              const newVariant = await storage.createProductVariant(newVariantData);
              processedVariants.push(newVariant);
            }
          } else {
            const variantData = {
              ...variant,
              productId
            };
            insertProductVariantSchema.parse(variantData);
            const newVariant = await storage.createProductVariant(variantData);
            processedVariants.push(newVariant);
          }
        } catch (variantErr) {
          console.error("Error processing variant:", variantErr);
        }
      }
      return res.status(200).json(processedVariants);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/product-variants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variant = await storage.getProductVariant(id);
      if (!variant) {
        return res.status(404).json({ message: "Product variant not found" });
      }
      const variantData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertProductVariantSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedVariant = await storage.updateProductVariant(id, variantData);
      if (!updatedVariant) {
        return res.status(404).json({ message: "Product variant not found" });
      }
      return res.status(200).json(updatedVariant);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.delete("/api/product-variants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variant = await storage.getProductVariant(id);
      if (!variant) {
        return res.status(404).json({ message: "Product variant not found" });
      }
      const success = await storage.deleteProductVariant(id);
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete product variant" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/product-categories", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const categories = await storage.getProductCategories(vendorId);
      return res.status(200).json(categories || []);
    } catch (err) {
      console.error("Error fetching product categories:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/global-product-categories", async (req, res) => {
    try {
      const categories = await storage.getGlobalProductCategories();
      return res.status(200).json(categories || []);
    } catch (error) {
      console.error("Error fetching global product categories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/global-categories", async (req, res) => {
    try {
      const categories = await storage.getGlobalProductCategories();
      return res.status(200).json(categories || []);
    } catch (error) {
      console.error("Error fetching global categories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/global-categories/:parentId/subcategories", async (req, res) => {
    try {
      const parentId = parseInt(req.params.parentId);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "Invalid parent category ID" });
      }
      const subcategories = await storage.getProductSubcategories(null, parentId, true);
      return res.status(200).json(subcategories || []);
    } catch (error) {
      console.error("Error fetching global subcategories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/all-product-categories", async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const categories = await storage.getAllProductCategories();
      return res.status(200).json(categories || []);
    } catch (error) {
      console.error("Error fetching all product categories:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/category/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const domainInfo = req.domainInfo;
      if (!domainInfo || !domainInfo.vendorId) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const vendorId = domainInfo.vendorId;
      const vendorCategories = await storage.getProductCategories(vendorId);
      const globalCategories = await storage.getGlobalProductCategories();
      const allCategories = [...vendorCategories, ...globalCategories];
      const category = allCategories.find((c) => c.slug === slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const subcategories = allCategories.filter((c) => c.parentId === category.id);
      if (category.isGlobal) {
        const vendorSubcategories = vendorCategories.filter(
          (c) => c.parentId === category.id && !c.isGlobal
        );
        const uniqueSubcategories = /* @__PURE__ */ new Map();
        [...subcategories, ...vendorSubcategories].forEach((cat) => {
          uniqueSubcategories.set(cat.id, cat);
        });
        const combinedSubcategories = Array.from(uniqueSubcategories.values());
        subcategories.length = 0;
        subcategories.push(...combinedSubcategories);
      }
      const includeSubcategories = subcategories.length > 0;
      const products2 = await storage.getProductsByCategory(category.id, includeSubcategories);
      const vendorProducts = products2.filter((p) => p.vendorId === vendorId);
      return res.status(200).json({
        category,
        subcategories,
        products: vendorProducts
      });
    } catch (err) {
      console.error("Error fetching category:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/product-categories", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      if (categoryData.vendorId) {
        const vendor = await storage.getVendor(categoryData.vendorId);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }
      }
      if (categoryData.isGlobal === true && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Only super admins can create global categories" });
      }
      const category = await storage.createProductCategory(categoryData);
      return res.status(201).json(category);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertProductCategorySchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const updatedCategory = await storage.updateProductCategory(id, categoryData);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      return res.status(200).json(updatedCategory);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.delete("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProductCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const products2 = await storage.getProductsByCategory(id);
      if (products2.length > 0) {
        for (const product of products2) {
          await storage.updateProduct(product.id, { categoryId: null });
        }
      }
      const success = await storage.deleteProductCategory(id);
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete category" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/orders", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const orders2 = await storage.getOrders(vendorId);
      const includeItems = req.query.includeItems === "true";
      if (includeItems) {
        const ordersWithItems = await Promise.all(orders2.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        }));
        return res.status(200).json(ordersWithItems);
      }
      return res.status(200).json(orders2);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      let customer = null;
      if (order.customerId) {
        customer = await storage.getCustomer(order.customerId);
      }
      return res.status(200).json({
        ...order,
        items,
        customer
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const vendor = await storage.getVendor(orderData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      if (orderData.customerId) {
        const customer = await storage.getCustomer(orderData.customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.vendorId !== orderData.vendorId) {
          return res.status(403).json({ message: "Customer does not belong to this vendor" });
        }
      }
      if (!orderData.orderNumber) {
        const timestamp2 = Date.now().toString().slice(-6);
        const vendorPrefix = vendor.companyName.slice(0, 3).toUpperCase();
        orderData.orderNumber = `${vendorPrefix}-${timestamp2}`;
      }
      const order = await storage.createOrder(orderData);
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const itemData of req.body.items) {
          const orderItem = insertOrderItemSchema.parse({
            ...itemData,
            orderId: order.id
          });
          await storage.createOrderItem(orderItem);
        }
      }
      const items = await storage.getOrderItems(order.id);
      return res.status(201).json({
        ...order,
        items
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertOrderSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const updatedOrder = await storage.updateOrder(id, orderData);
      if (req.body.items && Array.isArray(req.body.items)) {
        const existingItems = await storage.getOrderItems(id);
        for (const itemData of req.body.items) {
          if (itemData.id) {
            const existingItem = existingItems.find((item) => item.id === itemData.id);
            if (existingItem) {
              const updatedItemData = Object.keys(itemData).reduce((acc, key) => {
                if (key in insertOrderItemSchema.shape) {
                  acc[key] = itemData[key];
                }
                return acc;
              }, {});
              await storage.updateOrderItem(itemData.id, updatedItemData);
            }
          } else {
            const orderItem = insertOrderItemSchema.parse({
              ...itemData,
              orderId: id
            });
            await storage.createOrderItem(orderItem);
          }
        }
      }
      const items = await storage.getOrderItems(id);
      return res.status(200).json({
        ...updatedOrder,
        items
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.get("/api/vendors/:vendorId/customers", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const customers2 = await storage.getCustomers(vendorId);
      return res.status(200).json(customers2);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const vendor = await storage.getVendor(customerData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const existingCustomer = await storage.getCustomerByEmail(customerData.vendorId, customerData.email);
      if (existingCustomer) {
        return res.status(409).json({ message: "Customer with this email already exists" });
      }
      const customer = await storage.createCustomer(customerData);
      return res.status(201).json(customer);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });
  app2.get("/api/vendors/:vendorId/analytics", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const analytics2 = await storage.getVendorAnalytics(vendorId);
      return res.status(200).json(analytics2);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/analytics/top-products", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const topProducts = await storage.getTopProducts(vendorId, limit);
      return res.status(200).json(topProducts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/analytics/sales-by-hour", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const salesByHour = await storage.getSalesByHour(vendorId);
      return res.status(200).json(salesByHour);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:vendorId/analytics/sales-by-category", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const salesByCategory = await storage.getSalesByCategory(vendorId);
      return res.status(200).json(salesByCategory);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/platform-stats", async (_req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      return res.status(200).json(stats);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/store/current", (req, res) => {
    try {
      if (!req.isVendorStore || !req.vendor || !req.domain) {
        return res.status(404).json({
          message: "Not a vendor store domain",
          isVendorStore: false
        });
      }
      return res.status(200).json({
        isVendorStore: true,
        vendor: req.vendor,
        domain: req.domain
      });
    } catch (err) {
      console.error("Error fetching store information:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/vendors/:id/products", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: "Invalid vendor ID" });
      }
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const isStorefront = req.query.storefront === "true";
      const products2 = await storage.getProducts(vendorId);
      const filteredProducts = isStorefront ? products2.filter((product) => product.status === "active") : products2;
      return res.status(200).json(filteredProducts);
    } catch (err) {
      console.error("Error fetching vendor products:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/domains", async (req, res) => {
    try {
      const domains2 = await storage.getAllDomains();
      return res.status(200).json(domains2);
    } catch (err) {
      console.error("Error fetching domains:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  registerCheckoutRoutes(app2);
  registerAddressRoutes(app2);
  registerSubscriptionRoutes(app2);
  registerPaymentRoutes(app2);
  app2.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });
  app2.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });
  app2.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/middleware/domainMiddleware.ts
function getHostname(host) {
  return host.split(":")[0];
}
var domainMiddleware = async (req, res, next) => {
  if (req.path.startsWith("/api") && !req.path.startsWith("/api/store")) {
    return next();
  }
  const host = req.headers.host || "";
  await handleDomainRouting(host, req, res, next);
};
async function handleDomainRouting(host, req, res, next) {
  try {
    const hostname = getHostname(host);
    if (process.env.NODE_ENV === "development") {
      if (hostname === "localhost" || hostname === "0.0.0.0" || hostname.includes(".repl.co")) {
        const testDomain = req.headers["x-test-domain"] || req.query.domain || req.query.test_domain;
        if (testDomain) {
          console.log(`Testing with domain: ${testDomain}`);
          let domain2 = await storage.getDomainByName(testDomain);
          if (!domain2 && typeof testDomain === "string") {
            const domainParts = testDomain.split(".");
            if (domainParts.length >= 3) {
              const subdomainName = `${domainParts[0]}.multivend.com`;
              domain2 = await storage.getDomainByName(subdomainName);
              console.log(`Trying subdomain: ${subdomainName}`);
            } else if (domainParts.length === 1) {
              const subdomainName = `${testDomain}.multivend.com`;
              domain2 = await storage.getDomainByName(subdomainName);
              console.log(`Trying subdomain with suffix: ${subdomainName}`);
            }
          }
          if (domain2) {
            console.log(`Found domain: ${domain2.name}`);
            const vendor = await storage.getVendor(domain2.vendorId);
            if (vendor) {
              console.log(`Found vendor: ${vendor.companyName}`);
              req.domain = {
                id: domain2.id,
                name: domain2.name,
                vendorId: domain2.vendorId,
                type: domain2.type,
                status: domain2.status,
                isPrimary: domain2.isPrimary === null ? false : domain2.isPrimary
              };
              req.vendor = {
                id: vendor.id,
                companyName: vendor.companyName,
                storeTheme: vendor.storeTheme || "default",
                customCss: vendor.customCss === null ? void 0 : vendor.customCss,
                logoUrl: vendor.logoUrl === null ? void 0 : vendor.logoUrl
              };
              req.isVendorStore = true;
              return next();
            }
          }
        }
        req.isVendorStore = false;
        return next();
      }
    }
    const domain = await storage.getDomainByName(hostname);
    if (domain && domain.status === "active") {
      const vendor = await storage.getVendor(domain.vendorId);
      if (vendor) {
        req.domain = {
          id: domain.id,
          name: domain.name,
          vendorId: domain.vendorId,
          type: domain.type,
          status: domain.status,
          isPrimary: domain.isPrimary === null ? false : domain.isPrimary
        };
        req.vendor = {
          id: vendor.id,
          companyName: vendor.companyName,
          storeTheme: vendor.storeTheme || "default",
          customCss: vendor.customCss === null ? void 0 : vendor.customCss,
          logoUrl: vendor.logoUrl === null ? void 0 : vendor.logoUrl
        };
        req.isVendorStore = true;
      } else {
        req.isVendorStore = false;
      }
    } else {
      req.isVendorStore = false;
    }
    next();
  } catch (error) {
    console.error("Error in domain middleware:", error);
    req.isVendorStore = false;
    next();
  }
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(domainMiddleware);
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error: ${err.stack || err.message || err}`);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const startServer = (port) => {
    server.listen(port, () => {
      log(`serving on port ${port}`);
    }).on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        log(`Port ${port} is in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  };
  startServer(5e3);
})();
