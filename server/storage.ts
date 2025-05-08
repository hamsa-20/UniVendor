import {
  users, type User, type InsertUser,
  otpCodes, type OtpCode, type InsertOtpCode,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  vendors, type Vendor, type InsertVendor,
  domains, type Domain, type InsertDomain,
  productCategories, type ProductCategory, type InsertProductCategory,
  products, type Product, type InsertProduct,
  customers, type Customer, type InsertCustomer,
  customerAddresses, type CustomerAddress, type InsertCustomerAddress,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  analytics, type Analytics, type InsertAnalytics,
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  platformSubscriptions, type PlatformSubscription, type InsertPlatformSubscription,
  invoices, type Invoice, type InsertInvoice,
  transactions, type Transaction, type InsertTransaction,
  payouts, type Payout, type InsertPayout,
  customerPaymentMethods, type CustomerPaymentMethod, type InsertCustomerPaymentMethod,
  paymentProviderSettings, type PaymentProviderSettings, type InsertPaymentProviderSettings,
  commissionSettings, type CommissionSettings, type InsertCommissionSettings
} from "@shared/schema";
import session from "express-session";
import { createSessionStore } from "./sessionStore";
import createMemoryStore from "memorystore";

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Cart operations
  getCartByUserId(userId: number): Promise<any>;
  addToCart(userId: number, item: any): Promise<any>;
  updateCartItemQuantity(userId: number, itemId: number, quantity: number): Promise<any>;
  removeFromCart(userId: number, itemId: number): Promise<any>;
  clearCart(userId: number): Promise<boolean>;
  
  // OTP operations
  createOtp(email: string, code: string, expiresAt: Date): Promise<OtpCode>;
  getLatestOtp(email: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<OtpCode | undefined>;

  // Subscription plan operations
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;

  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendors(): Promise<Vendor[]>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined>;

  // Domain operations
  getDomain(id: number): Promise<Domain | undefined>;
  getDomains(): Promise<Domain[]>;
  getDomainsByVendorId(vendorId: number): Promise<Domain[]>;
  getDomainByName(name: string): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, data: Partial<InsertDomain>): Promise<Domain | undefined>;
  deleteDomain(id: number): Promise<boolean>;
  verifyDomain(id: number): Promise<Domain | undefined>;
  generateVerificationToken(id: number): Promise<Domain | undefined>;
  checkDomainsSSL(): Promise<void>;

  // Product category operations
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  getProductCategories(vendorId: number): Promise<ProductCategory[]>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, data: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(vendorId: number): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomers(vendorId: number): Promise<Customer[]>;
  getCustomerByEmail(email: string, vendorId: number): Promise<Customer | undefined>;
  getCustomerByUserId(userId: number, vendorId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Customer address operations
  getCustomerAddress(id: number): Promise<CustomerAddress | undefined>;
  getCustomerAddresses(customerId: number): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: number, data: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined>;
  deleteCustomerAddress(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(vendorId: number): Promise<Order[]>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Analytics operations
  getVendorAnalytics(vendorId: number): Promise<Analytics[]>;
  createAnalyticsEntry(data: InsertAnalytics): Promise<Analytics>;
  
  // Platform statistics
  getPlatformStats(): Promise<{
    totalVendors: number;
    activeDomains: number;
    totalRevenue: number;
    pendingIssues: number;
  }>;

  // Payment methods operations
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  getPaymentMethodsByVendorId(vendorId: number): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  setDefaultPaymentMethod(id: number, vendorId: number): Promise<PaymentMethod | undefined>;

  // Platform subscription operations
  getPlatformSubscription(id: number): Promise<PlatformSubscription | undefined>;
  getPlatformSubscriptionByVendorId(vendorId: number): Promise<PlatformSubscription | undefined>;
  createPlatformSubscription(subscription: InsertPlatformSubscription): Promise<PlatformSubscription>;
  updatePlatformSubscription(id: number, data: Partial<InsertPlatformSubscription>): Promise<PlatformSubscription | undefined>;
  cancelPlatformSubscription(id: number, reason: string): Promise<PlatformSubscription | undefined>;

  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesByVendorId(vendorId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  markInvoiceAsPaid(id: number): Promise<Invoice | undefined>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByVendorId(vendorId: number): Promise<Transaction[]>;
  getTransactionsByOrderId(orderId: number): Promise<Transaction[]>;
  getTransactionsByInvoiceId(invoiceId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  processRefund(transactionId: number, amount: string, reason: string): Promise<Transaction | undefined>;

  // Payout operations
  getPayout(id: number): Promise<Payout | undefined>;
  getPayoutsByVendorId(vendorId: number): Promise<Payout[]>;
  getAllPayouts(): Promise<Payout[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: number, data: Partial<InsertPayout>): Promise<Payout | undefined>;
  completePayout(id: number): Promise<Payout | undefined>;

  // Customer payment methods operations
  getCustomerPaymentMethod(id: number): Promise<CustomerPaymentMethod | undefined>;
  getCustomerPaymentMethodsByCustomerId(customerId: number): Promise<CustomerPaymentMethod[]>;
  createCustomerPaymentMethod(method: InsertCustomerPaymentMethod): Promise<CustomerPaymentMethod>;
  updateCustomerPaymentMethod(id: number, data: Partial<InsertCustomerPaymentMethod>): Promise<CustomerPaymentMethod | undefined>;
  deleteCustomerPaymentMethod(id: number): Promise<boolean>;
  setDefaultCustomerPaymentMethod(id: number, customerId: number): Promise<CustomerPaymentMethod | undefined>;

  // Payment provider settings operations
  getPaymentProviderSettings(id: number): Promise<PaymentProviderSettings | undefined>;
  getPaymentProviderSettingsByVendorId(vendorId: number, provider: string): Promise<PaymentProviderSettings | undefined>;
  createPaymentProviderSettings(settings: InsertPaymentProviderSettings): Promise<PaymentProviderSettings>;
  updatePaymentProviderSettings(id: number, data: Partial<InsertPaymentProviderSettings>): Promise<PaymentProviderSettings | undefined>;
  togglePaymentProviderActive(id: number, isActive: boolean): Promise<PaymentProviderSettings | undefined>;
  
  // Commission settings operations
  getCommissionSettings(): Promise<CommissionSettings | undefined>;
  updateCommissionSettings(data: Partial<InsertCommissionSettings>): Promise<CommissionSettings>;
}

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private users: Map<number, User>;
  private otpCodes: Map<number, OtpCode>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private vendors: Map<number, Vendor>;
  private domains: Map<number, Domain>;
  private productCategories: Map<number, ProductCategory>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private customerAddresses: Map<number, CustomerAddress>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private analytics: Map<number, Analytics>;
  private paymentMethods: Map<number, PaymentMethod>;
  private platformSubscriptions: Map<number, PlatformSubscription>;
  private invoices: Map<number, Invoice>;
  private transactions: Map<number, Transaction>;
  private payouts: Map<number, Payout>;
  private customerPaymentMethods: Map<number, CustomerPaymentMethod>;
  private paymentProviderSettings: Map<number, PaymentProviderSettings>;
  private carts: Map<number, any>; // User ID -> Cart
  private commissionSettings: CommissionSettings | undefined;

  private userId: number = 1;
  private otpId: number = 1;
  private subscriptionPlanId: number = 1;
  private vendorId: number = 1;
  private domainId: number = 1;
  private productCategoryId: number = 1;
  private productId: number = 1;
  private customerId: number = 1;
  private customerAddressId: number = 1;
  private orderId: number = 1;
  private orderItemId: number = 1;
  private analyticsId: number = 1;
  private paymentMethodId: number = 1;
  private platformSubscriptionId: number = 1;
  private invoiceId: number = 1;
  private transactionId: number = 1;
  private payoutId: number = 1;
  private customerPaymentMethodId: number = 1;
  private paymentProviderSettingsId: number = 1;

  constructor() {
    // Initialize memory-based session store by default
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    this.users = new Map();
    this.otpCodes = new Map();
    this.subscriptionPlans = new Map();
    this.vendors = new Map();
    this.domains = new Map();
    this.productCategories = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.customerAddresses = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.analytics = new Map();
    this.paymentMethods = new Map();
    this.platformSubscriptions = new Map();
    this.invoices = new Map();
    this.transactions = new Map();
    this.payouts = new Map();
    this.customerPaymentMethods = new Map();
    this.paymentProviderSettings = new Map();
    this.carts = new Map();

    // Initialize with default subscription plans
    this.initializeDefaultData();
    
    // Add a listener for process exit to save session data
    process.on('SIGINT', () => {
      console.log('Saving session data before shutdown...');
      // Additional cleanup if needed
    });
  }

  private initializeDefaultData() {
    // Initialize default commission settings
    this.commissionSettings = {
      id: 1,
      baseFeePercentage: "5.0",
      transactionFeeFlat: "0.30",
      thresholds: [
        { threshold: "1000", percentage: "4.5" },
        { threshold: "5000", percentage: "4.0" },
        { threshold: "10000", percentage: "3.5" },
        { threshold: "25000", percentage: "3.0" },
        { threshold: "50000", percentage: "2.5" }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create default subscription plans
    const freePlan: InsertSubscriptionPlan = {
      name: "Free",
      description: "Basic solution for small businesses or individuals just starting out.",
      price: "0",
      features: ["1 subdomain", "Up to 50 products", "Basic analytics", "Email support"],
      productLimit: 50,
      storageLimit: 1,
      customDomainLimit: 0,
      supportLevel: "email",
      isActive: true
    };
    
    const basicPlan: InsertSubscriptionPlan = {
      name: "Basic",
      description: "For growing businesses looking to expand their online presence.",
      price: "29",
      features: ["1 custom domain", "Up to 500 products", "Advanced analytics", "Priority email support", "Basic customization"],
      productLimit: 500,
      storageLimit: 5,
      customDomainLimit: 1,
      supportLevel: "priority_email",
      isActive: true
    };
    
    const proPlan: InsertSubscriptionPlan = {
      name: "Pro",
      description: "Complete solution for established businesses with comprehensive needs.",
      price: "79",
      features: ["3 custom domains", "Unlimited products", "Full analytics suite", "Phone & email support", "Advanced customization"],
      productLimit: 10000,
      storageLimit: 20,
      customDomainLimit: 3,
      supportLevel: "phone_email",
      isActive: true
    };
    
    const enterprisePlan: InsertSubscriptionPlan = {
      name: "Enterprise",
      description: "Custom solution for large businesses with complex requirements.",
      price: "199",
      features: ["10 custom domains", "Unlimited products", "Enterprise analytics", "Dedicated support", "Custom development"],
      productLimit: 100000,
      storageLimit: 100,
      customDomainLimit: 10,
      supportLevel: "dedicated",
      isActive: true
    };
    
    this.createSubscriptionPlan(freePlan);
    this.createSubscriptionPlan(basicPlan);
    this.createSubscriptionPlan(proPlan);
    this.createSubscriptionPlan(enterprisePlan);
    
    // Create super admin users
    const primaryAdmin: Partial<InsertUser> = {
      email: "kaushlendra.k12@fms.edu",
      firstName: "Kaushlendra",
      lastName: "Kumar",
      role: "super_admin",
      isProfileComplete: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2369&q=80"
    };
    
    const secondaryAdmin: Partial<InsertUser> = {
      email: "admin@lelekart.com",
      firstName: "Admin",
      lastName: "User",
      role: "super_admin",
      isProfileComplete: true,
      avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2680&q=80"
    };
    
    this.createUser(primaryAdmin);
    this.createUser(secondaryAdmin);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Cart operations
  async getCartByUserId(userId: number): Promise<any> {
    return this.carts.get(userId) || { items: [] };
  }

  async addToCart(userId: number, item: any): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    const existingItemIndex = cart.items.findIndex((i: any) => i.productId === item.productId);
    
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    
    this.carts.set(userId, cart);
    return cart;
  }

  async updateCartItemQuantity(userId: number, itemId: number, quantity: number): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    const item = cart.items.find((i: any) => i.id === itemId);
    
    if (item) {
      item.quantity = quantity;
    }
    
    this.carts.set(userId, cart);
    return cart;
  }

  async removeFromCart(userId: number, itemId: number): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    cart.items = cart.items.filter((i: any) => i.id !== itemId);
    
    this.carts.set(userId, cart);
    return cart;
  }

  async clearCart(userId: number): Promise<boolean> {
    this.carts.set(userId, { items: [] });
    return true;
  }

  // OTP operations
  async createOtp(email: string, code: string, expiresAt: Date): Promise<OtpCode> {
    const id = this.otpId++;
    const otpCode: OtpCode = {
      id,
      email,
      code,
      expiresAt,
      isUsed: false,
      createdAt: new Date()
    };
    this.otpCodes.set(id, otpCode);
    return otpCode;
  }

  async getLatestOtp(email: string): Promise<OtpCode | undefined> {
    const now = new Date();
    
    return Array.from(this.otpCodes.values())
      .filter(otp => otp.email === email && !otp.isUsed && otp.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async markOtpAsUsed(id: number): Promise<OtpCode | undefined> {
    const otp = this.otpCodes.get(id);
    if (!otp) return undefined;
    
    const updatedOtp = { ...otp, isUsed: true };
    this.otpCodes.set(id, updatedOtp);
    return updatedOtp;
  }

  // Implement other methods as needed...

  // Subscription plan operations
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanId++;
    const newPlan: SubscriptionPlan = { ...plan, id, createdAt: new Date() };
    this.subscriptionPlans.set(id, newPlan);
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = await this.getSubscriptionPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...data };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Commission settings operations
  async getCommissionSettings(): Promise<CommissionSettings | undefined> {
    return this.commissionSettings;
  }

  async updateCommissionSettings(data: Partial<InsertCommissionSettings>): Promise<CommissionSettings> {
    if (!this.commissionSettings) {
      throw new Error("Commission settings not initialized");
    }
    
    this.commissionSettings = { 
      ...this.commissionSettings, 
      ...data, 
      updatedAt: new Date() 
    };
    
    return this.commissionSettings;
  }
}

// Create a DatabaseStorage class that extends MemStorage
// This will use the in-memory storage for application data
// But use PostgreSQL for session persistence
export class DatabaseStorage extends MemStorage {
  constructor() {
    super(); // Initialize the memory storage
    
    // Replace the session store with our PostgreSQL-backed one
    this.sessionStore = createSessionStore();
    
    console.log('DatabaseStorage initialized with PostgreSQL session store');
  }
}

// Export an instance of the storage
export const storage = new DatabaseStorage();