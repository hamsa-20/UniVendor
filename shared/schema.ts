import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, foreignKey, numeric, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (for both super admin and vendor users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  role: text("role").notNull().default("vendor"), // "super_admin" or "vendor"
  avatarUrl: text("avatar_url"),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true
});

// OTP model for passwordless authentication
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true
});

// Subscription plans for vendors
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price").notNull(), // Monthly price
  yearlyPrice: numeric("yearly_price"), // Optional yearly price (with discount)
  features: text("features").array(),
  productLimit: integer("product_limit").notNull(),
  storageLimit: integer("storage_limit").notNull(), // in GB
  customDomainLimit: integer("custom_domain_limit").notNull(),
  supportLevel: text("support_level").notNull(),
  trialDays: integer("trial_days").default(7), // Default 7-day trial period
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").default(false), // Whether this is the default plan for new vendors
  stripePriceIdMonthly: text("stripe_price_id_monthly"), // Stripe price ID for monthly billing
  stripePriceIdYearly: text("stripe_price_id_yearly"), // Stripe price ID for yearly billing
  currency: text("currency").default("INR").notNull(), // Currency for the plan pricing
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});

// Vendors (extends user model for vendor-specific details)
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  subscriptionPlanId: integer("subscription_plan_id").references(() => subscriptionPlans.id),
  status: text("status").notNull().default("pending"), // "pending", "active", "suspended"
  storeTheme: text("store_theme").default("default"),
  customCss: text("custom_css"),
  colorPalette: text("color_palette").default("default"),
  fontSettings: jsonb("font_settings"), // Stores headingFont, bodyFont, fontSize, and useCustomFonts
  createdAt: timestamp("created_at").defaultNow(),
  subscriptionStatus: text("subscription_status").default("trial"), // "trial", "active", "overdue"
  trialEndsAt: timestamp("trial_ends_at"),
  nextBillingDate: timestamp("next_billing_date"),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true
});

// Domains for vendor stores
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "subdomain" or "custom"
  status: text("status").notNull().default("pending"), // "pending", "active", "error"
  sslStatus: text("ssl_status").default("pending"), // "pending", "valid", "invalid"
  isPrimary: boolean("is_primary").default(false),
  verificationStatus: text("verification_status").default("pending"), // "pending", "verified", "failed"
  verificationToken: text("verification_token"), // Token for DNS TXT record verification
  verificationMethod: text("verification_method").default("dns_txt"), // "dns_txt", "file", "cname"
  dnsRecords: text("dns_records").array(), // Array of DNS records needed for domain configuration
  lastCheckedAt: timestamp("last_checked_at"), // Last time verification was checked
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true
});

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id), // Now optional for global categories
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  imageUrl: text("image_url"),
  parentId: integer("parent_id").references(() => productCategories.id), // Self-reference for subcategories
  level: integer("level").default(1), // 1 = main category, 2 = subcategory, etc.
  isActive: boolean("is_active").default(true),
  isGlobal: boolean("is_global").default(false), // True for super admin created global categories
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  categoryId: integer("category_id").references(() => productCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  purchasePrice: numeric("purchase_price"), // Added purchase price
  sellingPrice: numeric("selling_price").notNull(), // Renamed from price to sellingPrice
  mrp: numeric("mrp"), // Added Maximum Retail Price
  gst: numeric("gst"), // Added GST percentage
  sku: text("sku"),
  barcode: text("barcode"),
  weight: numeric("weight"),
  dimensions: text("dimensions"),
  inventoryQuantity: integer("inventory_quantity").default(0),
  status: text("status").default("draft"), // "draft", "active", "archived"
  featuredImageUrl: text("featured_image_url"),
  images: text("images").array(),
  tags: text("tags").array(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create a base schema from Drizzle's schema generator
const baseProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create a custom insert schema that properly handles numeric fields as numbers
export const insertProductSchema = baseProductSchema.extend({
  // Allow numeric fields to be numbers instead of only strings 
  purchasePrice: z.number().nullable().optional(),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  mrp: z.number().nullable().optional(),
  gst: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  inventoryQuantity: z.number().int().default(0),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
});

// Customer addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  customerId: integer("customer_id").references(() => customers.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // "pending", "processing", "shipped", "delivered", "canceled"
  currency: text("currency").default("USD"),
  subtotal: numeric("subtotal").notNull(),
  shippingCost: numeric("shipping_cost").default("0"),
  tax: numeric("tax").default("0"),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "failed", "refunded"
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Order items (products in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  total: numeric("total").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true
});

// Analytics data
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  date: timestamp("date").notNull(),
  visitors: integer("visitors").default(0),
  pageViews: integer("page_views").default(0),
  orders: integer("orders").default(0),
  revenue: numeric("revenue").default("0"),
  conversionRate: numeric("conversion_rate").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true
});

// Relations code is commented out for now
// It will be used in the application code for joins, but we'll skip it for the schema migration
// since drizzle-kit doesn't support it properly
/*
export const usersRelations = relations(users, ({ one, many }) => ({
  // Relations here
}));
*/

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Shopping cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"), // For guest carts
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  subtotal: numeric("subtotal").default("0"),
  tax: numeric("tax").default("0"),
  total: numeric("total").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  variant: text("variant"), // For products with variants (size, color, etc.)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true
});

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Payment methods for vendors
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  type: text("type").notNull(), // "card", "bank_account", "paypal", etc.
  name: text("name").notNull(), // Display name for the payment method
  isDefault: boolean("is_default").default(false),
  status: text("status").default("active"), // "active", "inactive", "expired", "failed"
  lastFour: text("last_four"), // Last four digits of card or account number
  expiryMonth: text("expiry_month"), // For cards
  expiryYear: text("expiry_year"), // For cards
  brand: text("brand"), // For cards (Visa, Mastercard, etc.)
  gatewayId: text("gateway_id"), // ID of this payment method in the payment gateway
  gatewayData: jsonb("gateway_data"), // Additional data from payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Platform subscription payments (for vendors' subscription to the platform)
export const platformSubscriptions = pgTable("platform_subscriptions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("trialing"), // "trialing", "active", "canceled", "past_due", "unpaid"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Null for ongoing subscriptions
  trialEndsAt: timestamp("trial_ends_at"), // When the trial period ends
  currentPeriodStart: timestamp("current_period_start"), // Start of current billing period
  currentPeriodEnd: timestamp("current_period_end"), // End of current billing period
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false), // Whether to cancel at the end of the period
  renewalDate: timestamp("renewal_date"), // Next renewal date (same as currentPeriodEnd typically)
  billingCycle: text("billing_cycle").notNull().default("monthly"), // "monthly", "yearly"
  amount: numeric("amount"), // Amount charged in the current billing cycle
  currency: text("currency").default("USD"), // Currency of the subscription
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  stripeCustomerId: text("stripe_customer_id"), // Customer ID in Stripe
  stripeSubscriptionId: text("stripe_subscription_id"), // Subscription ID in Stripe
  canceledAt: timestamp("canceled_at"), // When the subscription was canceled
  cancelReason: text("cancel_reason"), // Reason for cancellation
  paymentFailureCount: integer("payment_failure_count").default(0), // Count of payment failures
  metadata: jsonb("metadata"), // Additional metadata about the subscription
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSubscriptionSchema = createInsertSchema(platformSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Invoices for platform subscriptions
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  subscriptionId: integer("subscription_id").references(() => platformSubscriptions.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: numeric("amount").notNull(),
  tax: numeric("tax").default("0"),
  total: numeric("total").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "paid", "overdue", "void"
  currency: text("currency").default("USD"),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  pdfUrl: text("pdf_url"), // URL to download invoice PDF
  gatewayInvoiceId: text("gateway_invoice_id"), // ID in payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Payment transactions (for both platform subscriptions and customer orders)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "platform_subscription", "order_payment", "refund", "payout"
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed", "refunded"
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Payouts to vendors
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("USD"),
  fee: numeric("fee").default("0"),
  net: numeric("net").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  method: text("method").notNull(), // "bank_transfer", "paypal", etc.
  batchId: text("batch_id"), // For grouping related payouts
  gatewayPayoutId: text("gateway_payout_id"),
  gatewayResponse: jsonb("gateway_response"),
  notes: text("notes"),
  transactionIds: integer("transaction_ids").array(), // Array of related transaction IDs
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  completedAt: true
});

// Customer payment methods
export const customerPaymentMethods = pgTable("customer_payment_methods", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  type: text("type").notNull(), // "card", "bank_account", "paypal", etc.
  name: text("name").notNull(), // Display name for the payment method
  isDefault: boolean("is_default").default(false),
  status: text("status").default("active"), // "active", "inactive", "expired", "failed"
  lastFour: text("last_four"), // Last four digits of card or account number
  expiryMonth: text("expiry_month"), // For cards
  expiryYear: text("expiry_year"), // For cards
  brand: text("brand"), // For cards (Visa, Mastercard, etc.)
  gatewayId: text("gateway_id"), // ID of this payment method in the payment gateway
  gatewayData: jsonb("gateway_data"), // Additional data from payment gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerPaymentMethodSchema = createInsertSchema(customerPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Payment provider settings for vendors
export const paymentProviderSettings = pgTable("payment_provider_settings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  provider: text("provider").notNull(), // "stripe", "paypal", etc.
  isActive: boolean("is_active").default(false),
  isTest: boolean("is_test").default(true),
  credentials: jsonb("credentials"), // Encrypted credentials
  webhookSecret: text("webhook_secret"),
  commissionRate: numeric("commission_rate").default("0"), // Platform commission rate
  additionalSettings: jsonb("additional_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentProviderSettingsSchema = createInsertSchema(paymentProviderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type PlatformSubscription = typeof platformSubscriptions.$inferSelect;
export type InsertPlatformSubscription = z.infer<typeof insertPlatformSubscriptionSchema>;

// Combined subscription info type with related plan data
export interface SubscriptionInfo extends PlatformSubscription {
  plan: SubscriptionPlan;
}

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

export type CustomerPaymentMethod = typeof customerPaymentMethods.$inferSelect;
export type InsertCustomerPaymentMethod = z.infer<typeof insertCustomerPaymentMethodSchema>;



// Product variants (e.g., Small Blue T-shirt)
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  color: text("color").notNull(), // Added color field
  size: text("size").notNull(), // Added size field
  sku: text("sku"),
  barcode: text("barcode"),
  purchasePrice: numeric("purchase_price"), // Added purchase price
  sellingPrice: numeric("selling_price").notNull(), // Renamed from price to sellingPrice
  mrp: numeric("mrp"), // Added Maximum Retail Price
  gst: numeric("gst"), // Added GST percentage
  inventoryQuantity: integer("inventory_quantity").default(0),
  weight: numeric("weight"),
  imageUrl: text("image_url"), // Kept for backward compatibility
  images: text("images").array(), // Added array of image URLs
  position: integer("position").default(0),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create a base schema from Drizzle's schema generator
const baseProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create a custom insert schema that properly handles numeric fields as numbers
export const insertProductVariantSchema = baseProductVariantSchema.extend({
  // Allow numeric fields to be numbers instead of only strings
  purchasePrice: z.number().nullable().optional(),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  mrp: z.number().nullable().optional(),
  gst: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  inventoryQuantity: z.number().int().default(0),
  // Add support for multiple images
  images: z.array(z.string()).optional(),
});



export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type PaymentProviderSettings = typeof paymentProviderSettings.$inferSelect;
export type InsertPaymentProviderSettings = z.infer<typeof insertPaymentProviderSettingsSchema>;