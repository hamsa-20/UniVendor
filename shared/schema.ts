import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, foreignKey, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (for both super admin and vendor users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("vendor"), // "super_admin" or "vendor"
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true
});

// Subscription plans for vendors
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  features: text("features").array(),
  productLimit: integer("product_limit").notNull(),
  storageLimit: integer("storage_limit").notNull(), // in GB
  customDomainLimit: integer("custom_domain_limit").notNull(),
  supportLevel: text("support_level").notNull(),
  isActive: boolean("is_active").notNull().default(true),
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
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
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
  price: numeric("price").notNull(),
  compareAtPrice: numeric("compare_at_price"),
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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
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

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
