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
  paymentProviderSettings, type PaymentProviderSettings, type InsertPaymentProviderSettings
} from "@shared/schema";
import session from "express-session";
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
    // Initialize in-memory session store
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
  }

  private initializeDefaultData() {
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
    
    // Create super admin user
    const adminUser: Partial<InsertUser> = {
      email: "admin@multivend.com",
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      isProfileComplete: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    };
    
    this.createUser(adminUser);
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
    const userOtps = Array.from(this.otpCodes.values())
      .filter(otp => otp.email === email && !otp.isUsed && otp.expiresAt > new Date());
    
    if (userOtps.length === 0) return undefined;
    
    // Find the most recent OTP
    return userOtps.reduce((latest, current) => 
      latest.createdAt > current.createdAt ? latest : current
    );
  }

  async markOtpAsUsed(id: number): Promise<OtpCode | undefined> {
    const otp = this.otpCodes.get(id);
    if (!otp) return undefined;
    
    const updatedOtp = { ...otp, isUsed: true };
    this.otpCodes.set(id, updatedOtp);
    return updatedOtp;
  }

  // Subscription plan operations
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanId++;
    const plan: SubscriptionPlan = { ...planData, id, createdAt: new Date() };
    this.subscriptionPlans.set(id, plan);
    return plan;
  }

  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const plan = await this.getSubscriptionPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...data };
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(vendor => vendor.userId === userId);
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const id = this.vendorId++;
    const vendor: Vendor = { 
      ...vendorData, 
      id, 
      createdAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const vendor = await this.getVendor(id);
    if (!vendor) return undefined;
    
    const updatedVendor = { ...vendor, ...data };
    this.vendors.set(id, updatedVendor);
    return updatedVendor;
  }

  // Domain operations
  async getDomain(id: number): Promise<Domain | undefined> {
    return this.domains.get(id);
  }

  async getDomains(): Promise<Domain[]> {
    return Array.from(this.domains.values());
  }

  async getDomainsByVendorId(vendorId: number): Promise<Domain[]> {
    return Array.from(this.domains.values()).filter(domain => domain.vendorId === vendorId);
  }

  async getDomainByName(name: string): Promise<Domain | undefined> {
    return Array.from(this.domains.values()).find(domain => domain.name === name);
  }

  async createDomain(domainData: InsertDomain): Promise<Domain> {
    const id = this.domainId++;
    
    // Generate a verification token if it's a custom domain
    let verificationToken = null;
    let dnsRecords = [];
    
    if (domainData.type === "custom") {
      // Generate a random verification token for domain ownership verification
      verificationToken = `multivend-verify-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create DNS record instructions based on domain name
      const domainName = domainData.name;
      dnsRecords = [
        { type: "TXT", name: `_multivend-verification.${domainName}`, value: verificationToken },
        { type: "CNAME", name: domainName, value: "stores.multivend.com" },
        { type: "CNAME", name: `www.${domainName}`, value: "stores.multivend.com" }
      ];
    }
    
    const domain: Domain = { 
      ...domainData, 
      id, 
      verificationToken,
      dnsRecords: dnsRecords.length > 0 ? dnsRecords : undefined,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
    };
    
    this.domains.set(id, domain);
    return domain;
  }

  async updateDomain(id: number, data: Partial<InsertDomain>): Promise<Domain | undefined> {
    const domain = await this.getDomain(id);
    if (!domain) return undefined;
    
    const updatedDomain = { ...domain, ...data };
    
    // If changing from subdomain to custom domain, generate verification token and DNS records
    if (domain.type !== "custom" && data.type === "custom" && !domain.verificationToken) {
      const verificationToken = `multivend-verify-${Math.random().toString(36).substring(2, 15)}`;
      const domainName = data.name || domain.name;
      
      const dnsRecords = [
        { type: "TXT", name: `_multivend-verification.${domainName}`, value: verificationToken },
        { type: "CNAME", name: domainName, value: "stores.multivend.com" },
        { type: "CNAME", name: `www.${domainName}`, value: "stores.multivend.com" }
      ];
      
      updatedDomain.verificationToken = verificationToken;
      updatedDomain.dnsRecords = dnsRecords;
      updatedDomain.verificationStatus = "pending";
    }
    
    this.domains.set(id, updatedDomain);
    return updatedDomain;
  }

  async verifyDomain(id: number): Promise<Domain | undefined> {
    const domain = await this.getDomain(id);
    if (!domain) return undefined;
    
    // In a real implementation, this would check DNS records
    // For this prototype, we'll just simulate verification
    
    domain.verificationStatus = "verified";
    domain.status = "active";
    domain.lastCheckedAt = new Date();
    
    this.domains.set(id, domain);
    return domain;
  }
  
  async generateVerificationToken(id: number): Promise<Domain | undefined> {
    const domain = await this.getDomain(id);
    if (!domain) return undefined;
    
    // Generate a random verification token
    const token = `multivend-verify-${Math.random().toString(36).substring(2, 15)}`;
    
    domain.verificationToken = token;
    domain.verificationStatus = "pending";
    domain.lastCheckedAt = new Date();
    
    this.domains.set(id, domain);
    return domain;
  }
  
  async checkDomainsSSL(): Promise<void> {
    // In a real implementation, this would check SSL certificates
    // For this prototype, we'll simulate SSL status updates for active domains
    
    const domains = await this.getDomains();
    
    for (const domain of domains) {
      if (domain.status === "active" && domain.verificationStatus === "verified") {
        domain.sslStatus = "valid";
        domain.lastCheckedAt = new Date();
        this.domains.set(domain.id, domain);
      }
    }
  }

  async deleteDomain(id: number): Promise<boolean> {
    return this.domains.delete(id);
  }

  // Product category operations
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    return this.productCategories.get(id);
  }

  async getProductCategories(vendorId: number): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values()).filter(category => category.vendorId === vendorId);
  }

  async createProductCategory(categoryData: InsertProductCategory): Promise<ProductCategory> {
    const id = this.productCategoryId++;
    const category: ProductCategory = { ...categoryData, id, createdAt: new Date() };
    this.productCategories.set(id, category);
    return category;
  }

  async updateProductCategory(id: number, data: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const category = await this.getProductCategory(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...data };
    this.productCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    return this.productCategories.delete(id);
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(vendorId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.vendorId === vendorId);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.categoryId === categoryId);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { 
      ...productData, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...data, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart operations
  async getCartByUserId(userId: number): Promise<any> {
    return this.carts.get(userId) || {
      id: 1,
      items: [],
      subtotal: "0.00",
      total: "0.00",
      vendorId: 1
    };
  }

  async addToCart(userId: number, item: any): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    const existingItemIndex = cart.items.findIndex((i: any) => i.productId === item.productId);

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item with generated ID if it doesn't exist
      const itemId = Math.floor(Math.random() * 10000);
      cart.items.push({ ...item, id: itemId });
    }

    // Recalculate cart totals
    let subtotal = cart.items.reduce(
      (total: number, item: any) => total + parseFloat(item.price) * item.quantity,
      0
    );

    cart.subtotal = subtotal.toFixed(2);
    cart.total = subtotal.toFixed(2); // Add tax calculation as needed

    this.carts.set(userId, cart);
    return cart;
  }

  async updateCartItemQuantity(userId: number, itemId: number, quantity: number): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    const itemIndex = cart.items.findIndex((i: any) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error("Cart item not found");
    }

    // Update item quantity
    cart.items[itemIndex].quantity = quantity;

    // Recalculate cart totals
    let subtotal = cart.items.reduce(
      (total: number, item: any) => total + parseFloat(item.price) * item.quantity,
      0
    );

    cart.subtotal = subtotal.toFixed(2);
    cart.total = subtotal.toFixed(2);

    this.carts.set(userId, cart);
    return cart;
  }

  async removeFromCart(userId: number, itemId: number): Promise<any> {
    const cart = await this.getCartByUserId(userId);
    const itemIndex = cart.items.findIndex((i: any) => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error("Cart item not found");
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate cart totals
    let subtotal = cart.items.reduce(
      (total: number, item: any) => total + parseFloat(item.price) * item.quantity,
      0
    );

    cart.subtotal = subtotal.toFixed(2);
    cart.total = subtotal.toFixed(2);

    this.carts.set(userId, cart);
    return cart;
  }

  async clearCart(userId: number): Promise<boolean> {
    const emptyCart = {
      id: 1,
      items: [],
      subtotal: "0.00",
      total: "0.00",
      vendorId: 1
    };
    
    this.carts.set(userId, emptyCart);
    return true;
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomers(vendorId: number): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.vendorId === vendorId);
  }

  async getCustomerByEmail(email: string, vendorId: number): Promise<Customer | undefined> {
    return Array.from(this.customers.values())
      .find(customer => customer.vendorId === vendorId && customer.email === email);
  }
  
  async getCustomerByUserId(userId: number, vendorId: number): Promise<Customer | undefined> {
    // Find user by ID
    const user = this.users.get(userId);
    if (!user || !user.email) return undefined;
    
    // Find customer by email and vendor ID
    return Array.from(this.customers.values())
      .find(customer => customer.vendorId === vendorId && customer.email === user.email);
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const id = this.customerId++;
    const customer: Customer = { ...customerData, id, createdAt: new Date() };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...data };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Customer address operations
  async getCustomerAddress(id: number): Promise<CustomerAddress | undefined> {
    return this.customerAddresses.get(id);
  }

  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return Array.from(this.customerAddresses.values())
      .filter(address => address.customerId === customerId);
  }

  async createCustomerAddress(addressData: InsertCustomerAddress): Promise<CustomerAddress> {
    const id = this.customerAddressId++;
    const address: CustomerAddress = { ...addressData, id, createdAt: new Date() };
    this.customerAddresses.set(id, address);
    return address;
  }

  async updateCustomerAddress(id: number, data: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined> {
    const address = await this.getCustomerAddress(id);
    if (!address) return undefined;
    
    const updatedAddress = { ...address, ...data };
    this.customerAddresses.set(id, updatedAddress);
    return updatedAddress;
  }

  async deleteCustomerAddress(id: number): Promise<boolean> {
    return this.customerAddresses.delete(id);
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(vendorId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.vendorId === vendorId);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.orderNumber === orderNumber);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...data, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const item: OrderItem = { ...itemData, id, createdAt: new Date() };
    this.orderItems.set(id, item);
    return item;
  }

  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const item = await this.getOrderItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data };
    this.orderItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Analytics operations
  async getVendorAnalytics(vendorId: number): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytics => analytics.vendorId === vendorId);
  }

  async createAnalyticsEntry(data: InsertAnalytics): Promise<Analytics> {
    const id = this.analyticsId++;
    const entry: Analytics = { ...data, id, createdAt: new Date() };
    this.analytics.set(id, entry);
    return entry;
  }

  // Payment methods operations
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id));
    return method;
  }

  async getPaymentMethodsByVendorId(vendorId: number): Promise<PaymentMethod[]> {
    return db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.vendorId, vendorId));
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    // If this is marked as default, unmark any other default methods for this vendor
    if (method.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(paymentMethods.vendorId, method.vendorId),
            eq(paymentMethods.isDefault, true)
          )
        );
    }

    const [createdMethod] = await db
      .insert(paymentMethods)
      .values({
        ...method,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdMethod;
  }

  async updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    // If this is being set as default, unmark any other default methods for this vendor
    if (data.isDefault) {
      const [currentMethod] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, id));

      if (currentMethod && !currentMethod.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(paymentMethods.vendorId, currentMethod.vendorId),
              eq(paymentMethods.isDefault, true),
              ne(paymentMethods.id, id)
            )
          );
      }
    }

    const [updatedMethod] = await db
      .update(paymentMethods)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(paymentMethods.id, id))
      .returning();
    return updatedMethod;
  }

  async deletePaymentMethod(id: number): Promise<boolean> {
    const result = await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id));
    return result.count > 0;
  }

  async setDefaultPaymentMethod(id: number, vendorId: number): Promise<PaymentMethod | undefined> {
    // Unmark any other default methods for this vendor
    await db
      .update(paymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethods.vendorId, vendorId),
          eq(paymentMethods.isDefault, true),
          ne(paymentMethods.id, id)
        )
      );

    // Mark this method as default
    const [updatedMethod] = await db
      .update(paymentMethods)
      .set({
        isDefault: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.vendorId, vendorId)
        )
      )
      .returning();
    return updatedMethod;
  }

  // Platform subscription operations
  async getPlatformSubscription(id: number): Promise<PlatformSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(platformSubscriptions)
      .where(eq(platformSubscriptions.id, id));
    return subscription;
  }

  async getPlatformSubscriptionByVendorId(vendorId: number): Promise<PlatformSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(platformSubscriptions)
      .where(
        and(
          eq(platformSubscriptions.vendorId, vendorId),
          eq(platformSubscriptions.status, "active")
        )
      );
    return subscription;
  }

  async createPlatformSubscription(subscription: InsertPlatformSubscription): Promise<PlatformSubscription> {
    const [createdSubscription] = await db
      .insert(platformSubscriptions)
      .values({
        ...subscription,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdSubscription;
  }

  async updatePlatformSubscription(id: number, data: Partial<InsertPlatformSubscription>): Promise<PlatformSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(platformSubscriptions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(platformSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelPlatformSubscription(id: number, reason: string): Promise<PlatformSubscription | undefined> {
    const [canceledSubscription] = await db
      .update(platformSubscriptions)
      .set({
        status: "canceled",
        cancelReason: reason,
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(platformSubscriptions.id, id))
      .returning();
    return canceledSubscription;
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoicesByVendorId(vendorId: number): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.vendorId, vendorId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [createdInvoice] = await db
      .insert(invoices)
      .values({
        ...invoice,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdInvoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async markInvoiceAsPaid(id: number): Promise<Invoice | undefined> {
    const [paidInvoice] = await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    return paidInvoice;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByVendorId(vendorId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.vendorId, vendorId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByOrderId(orderId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.orderId, orderId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByInvoiceId(invoiceId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.invoiceId, invoiceId))
      .orderBy(desc(transactions.createdAt));
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [createdTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdTransaction;
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async processRefund(transactionId: number, amount: string, reason: string): Promise<Transaction | undefined> {
    // Get the original transaction
    const [originalTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));

    if (!originalTransaction) return undefined;

    // Update the original transaction to mark refund amount
    const refundedAmount = new Decimal(originalTransaction.refundedAmount || "0").plus(amount);
    
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        refundedAmount: refundedAmount.toString(),
        status: refundedAmount.equals(originalTransaction.amount) ? "refunded" : "partial_refund",
        refundReason: reason || originalTransaction.refundReason,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // Create a new refund transaction
    await db
      .insert(transactions)
      .values({
        type: "refund",
        status: "completed",
        amount: amount.toString(),
        currency: originalTransaction.currency || "USD",
        fee: "0",
        net: amount.toString(),
        vendorId: originalTransaction.vendorId,
        orderId: originalTransaction.orderId,
        invoiceId: originalTransaction.invoiceId,
        paymentMethodId: originalTransaction.paymentMethodId,
        metadata: { 
          originalTransactionId: originalTransaction.id,
          refundReason: reason
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
    return updatedTransaction;
  }

  // Payout operations
  async getPayout(id: number): Promise<Payout | undefined> {
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, id));
    return payout;
  }

  async getPayoutsByVendorId(vendorId: number): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.vendorId, vendorId))
      .orderBy(desc(payouts.createdAt));
  }
  
  async getAllPayouts(): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .orderBy(desc(payouts.createdAt));
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [createdPayout] = await db
      .insert(payouts)
      .values({
        ...payout,
        createdAt: new Date()
      })
      .returning();
    return createdPayout;
  }

  async updatePayout(id: number, data: Partial<InsertPayout>): Promise<Payout | undefined> {
    const [updatedPayout] = await db
      .update(payouts)
      .set(data)
      .where(eq(payouts.id, id))
      .returning();
    return updatedPayout;
  }

  async completePayout(id: number): Promise<Payout | undefined> {
    const [completedPayout] = await db
      .update(payouts)
      .set({
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(payouts.id, id))
      .returning();
    return completedPayout;
  }

  // Customer payment methods operations
  async getCustomerPaymentMethod(id: number): Promise<CustomerPaymentMethod | undefined> {
    const [method] = await db
      .select()
      .from(customerPaymentMethods)
      .where(eq(customerPaymentMethods.id, id));
    return method;
  }

  async getCustomerPaymentMethodsByCustomerId(customerId: number): Promise<CustomerPaymentMethod[]> {
    return db
      .select()
      .from(customerPaymentMethods)
      .where(eq(customerPaymentMethods.customerId, customerId));
  }

  async createCustomerPaymentMethod(method: InsertCustomerPaymentMethod): Promise<CustomerPaymentMethod> {
    // If this is marked as default, unmark any other default methods for this customer
    if (method.isDefault) {
      await db
        .update(customerPaymentMethods)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(customerPaymentMethods.customerId, method.customerId),
            eq(customerPaymentMethods.isDefault, true)
          )
        );
    }

    const [createdMethod] = await db
      .insert(customerPaymentMethods)
      .values({
        ...method,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdMethod;
  }

  async updateCustomerPaymentMethod(id: number, data: Partial<InsertCustomerPaymentMethod>): Promise<CustomerPaymentMethod | undefined> {
    // If this is being set as default, unmark any other default methods for this customer
    if (data.isDefault) {
      const [currentMethod] = await db
        .select()
        .from(customerPaymentMethods)
        .where(eq(customerPaymentMethods.id, id));

      if (currentMethod && !currentMethod.isDefault) {
        await db
          .update(customerPaymentMethods)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(customerPaymentMethods.customerId, currentMethod.customerId),
              eq(customerPaymentMethods.isDefault, true),
              ne(customerPaymentMethods.id, id)
            )
          );
      }
    }

    const [updatedMethod] = await db
      .update(customerPaymentMethods)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(customerPaymentMethods.id, id))
      .returning();
    return updatedMethod;
  }

  async deleteCustomerPaymentMethod(id: number): Promise<boolean> {
    const result = await db
      .delete(customerPaymentMethods)
      .where(eq(customerPaymentMethods.id, id));
    return result.count > 0;
  }

  async setDefaultCustomerPaymentMethod(id: number, customerId: number): Promise<CustomerPaymentMethod | undefined> {
    // Unmark any other default methods for this customer
    await db
      .update(customerPaymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(customerPaymentMethods.customerId, customerId),
          eq(customerPaymentMethods.isDefault, true),
          ne(customerPaymentMethods.id, id)
        )
      );

    // Mark this method as default
    const [updatedMethod] = await db
      .update(customerPaymentMethods)
      .set({
        isDefault: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(customerPaymentMethods.id, id),
          eq(customerPaymentMethods.customerId, customerId)
        )
      )
      .returning();
    return updatedMethod;
  }

  // Payment provider settings operations
  async getPaymentProviderSettings(id: number): Promise<PaymentProviderSettings | undefined> {
    const [settings] = await db
      .select()
      .from(paymentProviderSettings)
      .where(eq(paymentProviderSettings.id, id));
    return settings;
  }

  async getPaymentProviderSettingsByVendorId(vendorId: number, provider: string): Promise<PaymentProviderSettings | undefined> {
    const [settings] = await db
      .select()
      .from(paymentProviderSettings)
      .where(
        and(
          eq(paymentProviderSettings.vendorId, vendorId),
          eq(paymentProviderSettings.provider, provider)
        )
      );
    return settings;
  }

  async createPaymentProviderSettings(settings: InsertPaymentProviderSettings): Promise<PaymentProviderSettings> {
    const [createdSettings] = await db
      .insert(paymentProviderSettings)
      .values({
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdSettings;
  }

  async updatePaymentProviderSettings(id: number, data: Partial<InsertPaymentProviderSettings>): Promise<PaymentProviderSettings | undefined> {
    const [updatedSettings] = await db
      .update(paymentProviderSettings)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(paymentProviderSettings.id, id))
      .returning();
    return updatedSettings;
  }

  async togglePaymentProviderActive(id: number, isActive: boolean): Promise<PaymentProviderSettings | undefined> {
    const [updatedSettings] = await db
      .update(paymentProviderSettings)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(paymentProviderSettings.id, id))
      .returning();
    return updatedSettings;
  }

  // Platform statistics
  async getPlatformStats(): Promise<{
    totalVendors: number;
    activeDomains: number;
    totalRevenue: number;
    pendingIssues: number;
  }> {
    const vendors = await this.getVendors();
    const domains = await this.getDomains();
    const activeDomains = domains.filter(domain => domain.status === "active").length;
    
    let totalRevenue = 0;
    // Sum up revenue from all vendors
    for (const vendor of vendors) {
      const vendorOrders = await this.getOrders(vendor.id);
      for (const order of vendorOrders) {
        if (order.paymentStatus === "paid") {
          totalRevenue += Number(order.total);
        }
      }
    }
    
    // Count pending issues (like domains with issues, suspended vendors, etc.)
    const domainsWithIssues = domains.filter(domain => 
      domain.status === "error" || domain.sslStatus === "invalid").length;
    const suspendedVendors = vendors.filter(vendor => vendor.status === "suspended").length;
    const overdueVendors = vendors.filter(vendor => vendor.subscriptionStatus === "overdue").length;
    
    const pendingIssues = domainsWithIssues + suspendedVendors + overdueVendors;
    
    return {
      totalVendors: vendors.length,
      activeDomains,
      totalRevenue,
      pendingIssues
    };
  }
}

import { db } from './db';
import { eq, sql, and, gt, desc } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize a Postgres-backed session store
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    // Get the current user to check if it's a super_admin
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    // If the user is a super_admin, prevent changing the role to protect their privileges
    if (currentUser && currentUser.role === 'super_admin' && 'role' in data && data.role !== 'super_admin') {
      console.warn(`Attempt to change super_admin role for user ${id} was prevented`);
      delete data.role; // Remove the role field to prevent the change
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // OTP operations
  async createOtp(email: string, code: string, expiresAt: Date): Promise<OtpCode> {
    const [otpCode] = await db
      .insert(otpCodes)
      .values({ email, code, expiresAt, isUsed: false })
      .returning();
    return otpCode;
  }

  async getLatestOtp(email: string): Promise<OtpCode | undefined> {
    const now = new Date();
    const [latestOtp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, now)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return latestOtp;
  }

  async markOtpAsUsed(id: number): Promise<OtpCode | undefined> {
    const [updatedOtp] = await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, id))
      .returning();
    return updatedOtp;
  }

  // Subscription plan operations
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Vendor operations
  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id));
    return vendor;
  }

  async getVendors(): Promise<Vendor[]> {
    return db.select().from(vendors);
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, userId));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values(vendor)
      .returning();
    return newVendor;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [updatedVendor] = await db
      .update(vendors)
      .set(data)
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  // Domain operations
  async getDomain(id: number): Promise<Domain | undefined> {
    const [domain] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, id));
    return domain;
  }

  async getDomains(): Promise<Domain[]> {
    return db.select().from(domains);
  }

  async getDomainsByVendorId(vendorId: number): Promise<Domain[]> {
    return db
      .select()
      .from(domains)
      .where(eq(domains.vendorId, vendorId));
  }

  async getDomainByName(name: string): Promise<Domain | undefined> {
    const [domain] = await db
      .select()
      .from(domains)
      .where(eq(domains.name, name));
    return domain;
  }

  async createDomain(domain: InsertDomain): Promise<Domain> {
    const [newDomain] = await db
      .insert(domains)
      .values(domain)
      .returning();
    return newDomain;
  }

  async updateDomain(id: number, data: Partial<InsertDomain>): Promise<Domain | undefined> {
    const [updatedDomain] = await db
      .update(domains)
      .set(data)
      .where(eq(domains.id, id))
      .returning();
    return updatedDomain;
  }

  async deleteDomain(id: number): Promise<boolean> {
    const result = await db
      .delete(domains)
      .where(eq(domains.id, id));
    return result.count > 0;
  }
  
  async verifyDomain(id: number): Promise<Domain | undefined> {
    // Get the domain
    const domain = await this.getDomain(id);
    if (!domain) return undefined;
    
    // In a real implementation, this would check DNS records for the verification token
    // For now, we'll simulate a successful verification by setting the status to verified
    
    const data = {
      verificationStatus: 'verified',
      status: 'active',
      lastCheckedAt: new Date()
    };
    
    const [updatedDomain] = await db
      .update(domains)
      .set(data)
      .where(eq(domains.id, id))
      .returning();
      
    return updatedDomain;
  }
  
  async generateVerificationToken(id: number): Promise<Domain | undefined> {
    // Generate a random verification token for the domain
    const token = `lelekart-verify-${Math.random().toString(36).substring(2, 15)}`;
    
    const data = {
      verificationToken: token,
      verificationStatus: 'pending',
      lastCheckedAt: new Date()
    };
    
    const [updatedDomain] = await db
      .update(domains)
      .set(data)
      .where(eq(domains.id, id))
      .returning();
      
    return updatedDomain;
  }
  
  async checkDomainsSSL(): Promise<void> {
    // In a real implementation, this would check SSL certificates
    // For this prototype, we'll simulate SSL status updates for active domains
    
    const allDomains = await this.getDomains();
    
    for (const domain of allDomains) {
      if (domain.status === 'active' && domain.verificationStatus === 'verified') {
        await db
          .update(domains)
          .set({ 
            sslStatus: 'active',
            lastCheckedAt: new Date()
          })
          .where(eq(domains.id, domain.id));
      }
    }
  }

  // Product category operations
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));
    return category;
  }

  async getProductCategories(vendorId: number): Promise<ProductCategory[]> {
    return db
      .select()
      .from(productCategories)
      .where(eq(productCategories.vendorId, vendorId));
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db
      .insert(productCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateProductCategory(id: number, data: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const [updatedCategory] = await db
      .update(productCategories)
      .set(data)
      .where(eq(productCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(productCategories)
      .where(eq(productCategories.id, id));
    return result.count > 0;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProducts(vendorId: number): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return result.count > 0;
  }

  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async getCustomers(vendorId: number): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.vendorId, vendorId));
  }

  async getCustomerByEmail(vendorId: number, email: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.vendorId, vendorId))
      .where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Customer address operations
  async getCustomerAddress(id: number): Promise<CustomerAddress | undefined> {
    const [address] = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.id, id));
    return address;
  }

  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [newAddress] = await db
      .insert(customerAddresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async updateCustomerAddress(id: number, data: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined> {
    const [updatedAddress] = await db
      .update(customerAddresses)
      .set(data)
      .where(eq(customerAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteCustomerAddress(id: number): Promise<boolean> {
    const result = await db
      .delete(customerAddresses)
      .where(eq(customerAddresses.id, id));
    return result.count > 0;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrders(vendorId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.vendorId, vendorId));
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order item operations
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [item] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    return item;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedItem] = await db
      .update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db
      .delete(orderItems)
      .where(eq(orderItems.id, id));
    return result.count > 0;
  }

  // Analytics operations
  async getVendorAnalytics(vendorId: number): Promise<Analytics[]> {
    return db
      .select()
      .from(analytics)
      .where(eq(analytics.vendorId, vendorId));
  }

  async createAnalyticsEntry(data: InsertAnalytics): Promise<Analytics> {
    const [newEntry] = await db
      .insert(analytics)
      .values(data)
      .returning();
    return newEntry;
  }

  // Platform statistics - we'll use SQL aggregation for better performance
  async getPlatformStats(): Promise<{ totalVendors: number; activeDomains: number; totalRevenue: number; pendingIssues: number; }> {
    // Get total vendors
    const [vendorCount] = await db
      .select({ count: sql`count(*)` })
      .from(vendors);
    
    // Get active domains
    const [domainsCount] = await db
      .select({ count: sql`count(*)` })
      .from(domains)
      .where(eq(domains.status, 'active'));
    
    // Get total revenue (sum of all orders)
    const [revenue] = await db
      .select({ sum: sql`sum(cast(total as decimal))` })
      .from(orders);
    
    // Get count of pending issues (domains with verification issues)
    const [issuesCount] = await db
      .select({ count: sql`count(*)` })
      .from(domains)
      .where(eq(domains.verificationStatus, 'pending'));
    
    return {
      totalVendors: Number(vendorCount?.count || 0),
      activeDomains: Number(domainsCount?.count || 0),
      totalRevenue: Number(revenue?.sum || 0),
      pendingIssues: Number(issuesCount?.count || 0)
    };
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
