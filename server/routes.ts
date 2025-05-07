import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertVendorSchema, 
  insertSubscriptionPlanSchema, 
  insertDomainSchema, 
  insertProductCategorySchema, 
  insertProductSchema, 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertOrderItemSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { setupAuth, isAuthenticated, hasRole } from "./auth";

// Helper function to handle validation errors
function handleValidationError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: err.errors 
    });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with OTP
  setupAuth(app);

  // User endpoints
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow users to get their own data or super_admin can get anyone
      if (id !== req.user.id && req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: You can only access your own user data" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow users to update their own data or super_admin can update anyone
      if (id !== req.user.id && req.user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: You can only update your own user data" });
      }
      
      // Partial validation, only validate fields that are present
      const userData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertUserSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertUserSchema._type>);
      
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      // Update session user data with the updated information
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

  // Special endpoint for profile completion (including vendor creation)
  app.post("/api/users/complete-profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, isProfileComplete, vendor } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Update the user's profile information
      const userData = {
        firstName,
        lastName,
        isProfileComplete
      };
      
      const updatedUser = await storage.updateUser(req.user.id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create vendor record if vendor data is provided
      let vendorRecord = null;
      if (vendor && vendor.companyName && vendor.subdomainName) {
        // Set up vendor data with the user ID
        const vendorData = insertVendorSchema.parse({
          userId: req.user.id,
          companyName: vendor.companyName,
          status: "active"
        });
        
        vendorRecord = await storage.createVendor(vendorData);
        
        // Create a subdomain for the vendor
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
      
      // Update session with the new user data
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Failed to update session:", err);
        }
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        ...userWithoutPassword,
        vendor: vendorRecord
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Subscription plan endpoints
  app.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      return res.status(200).json(plans);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
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

  app.post("/api/subscription-plans", async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(planData);
      return res.status(201).json(plan);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/subscription-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const planData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertSubscriptionPlanSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertSubscriptionPlanSchema._type>);
      
      const updatedPlan = await storage.updateSubscriptionPlan(id, planData);
      
      if (!updatedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      return res.status(200).json(updatedPlan);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Vendor endpoints
  app.get("/api/vendors", async (_req, res) => {
    try {
      const vendors = await storage.getVendors();
      
      // Fetch related information for each vendor
      const vendorsWithDetails = await Promise.all(vendors.map(async (vendor) => {
        const user = await storage.getUser(vendor.userId);
        const subscriptionPlan = vendor.subscriptionPlanId 
          ? await storage.getSubscriptionPlan(vendor.subscriptionPlanId)
          : null;
        const domains = await storage.getDomainsByVendorId(vendor.id);
        
        return {
          ...vendor,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl
          } : null,
          subscriptionPlan: subscriptionPlan,
          domains: domains
        };
      }));
      
      return res.status(200).json(vendorsWithDetails);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Fetch related information
      const user = await storage.getUser(vendor.userId);
      const subscriptionPlan = vendor.subscriptionPlanId 
        ? await storage.getSubscriptionPlan(vendor.subscriptionPlanId)
        : null;
      const domains = await storage.getDomainsByVendorId(vendor.id);
      
      return res.status(200).json({
        ...vendor,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl
        } : null,
        subscriptionPlan: subscriptionPlan,
        domains: domains
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const vendorData = insertVendorSchema.parse(req.body);
      
      // Ensure the user exists
      const user = await storage.getUser(vendorData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Ensure the subscription plan exists if provided
      if (vendorData.subscriptionPlanId) {
        const plan = await storage.getSubscriptionPlan(vendorData.subscriptionPlanId);
        if (!plan) {
          return res.status(404).json({ message: "Subscription plan not found" });
        }
      }
      
      const vendor = await storage.createVendor(vendorData);
      
      // If type is subdomain, create a default subdomain
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

  app.patch("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const vendorData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertVendorSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertVendorSchema._type>);
      
      const updatedVendor = await storage.updateVendor(id, vendorData);
      
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      return res.status(200).json(updatedVendor);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Domain endpoints
  app.get("/api/domains", async (_req, res) => {
    try {
      const domains = await storage.getDomains();
      
      // Fetch vendor information for each domain
      const domainsWithVendors = await Promise.all(domains.map(async (domain) => {
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

  app.get("/api/vendors/:vendorId/domains", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const domains = await storage.getDomainsByVendorId(vendorId);
      return res.status(200).json(domains);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/domains/:id", async (req, res) => {
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

  app.post("/api/domains", async (req, res) => {
    try {
      const domainData = insertDomainSchema.parse(req.body);
      
      // Ensure the vendor exists
      const vendor = await storage.getVendor(domainData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Check if the domain already exists
      const existingDomain = await storage.getDomainByName(domainData.name);
      if (existingDomain) {
        return res.status(409).json({ message: "Domain name already in use" });
      }
      
      // For custom domains, check if the vendor has reached their limit
      if (domainData.type === "custom" && vendor.subscriptionPlanId) {
        const plan = await storage.getSubscriptionPlan(vendor.subscriptionPlanId);
        if (plan) {
          const existingCustomDomains = (await storage.getDomainsByVendorId(vendor.id))
            .filter(d => d.type === "custom").length;
          
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

  app.patch("/api/domains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const domainData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertDomainSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertDomainSchema._type>);
      
      const updatedDomain = await storage.updateDomain(id, domainData);
      
      if (!updatedDomain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      return res.status(200).json(updatedDomain);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/domains/:id", async (req, res) => {
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

  // Domain verification endpoints
  app.post("/api/domains/:id/generate-token", async (req, res) => {
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

  app.post("/api/domains/:id/verify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      // In a production environment, this would check the actual DNS records
      // For this demo, we'll simulate verification by directly marking it as verified
      const verifiedDomain = await storage.verifyDomain(id);
      
      return res.status(200).json(verifiedDomain);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/domains/:id/dns-records", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const domain = await storage.getDomain(id);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      // If it's not a custom domain, return empty records
      if (domain.type !== "custom") {
        return res.status(200).json([]);
      }
      
      // If we already have DNS records, return those
      if (domain.dnsRecords && domain.dnsRecords.length > 0) {
        return res.status(200).json(domain.dnsRecords);
      }
      
      // Otherwise, generate new DNS records based on the domain
      const verificationToken = domain.verificationToken || 
        `multivend-verify-${Math.random().toString(36).substring(2, 15)}`;
        
      const dnsRecords = [
        { type: "TXT", name: `_multivend-verification.${domain.name}`, value: verificationToken },
        { type: "CNAME", name: domain.name, value: "stores.multivend.com" },
        { type: "CNAME", name: `www.${domain.name}`, value: "stores.multivend.com" }
      ];
      
      // Update the domain with the new verification token and records
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
  
  // Check all domains for SSL status (scheduled task)
  app.post("/api/domains/check-ssl", hasRole(["super_admin"]), async (req, res) => {
    try {
      await storage.checkDomainsSSL();
      return res.status(200).json({ message: "SSL status check completed" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product endpoints
  app.get("/api/vendors/:vendorId/products", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const products = await storage.getProducts(vendorId);
      
      // Optionally filter by category
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      const filteredProducts = categoryId 
        ? products.filter(p => p.categoryId === categoryId)
        : products;
      
      return res.status(200).json(filteredProducts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get category information if available
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

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Ensure the vendor exists
      const vendor = await storage.getVendor(productData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // If category is provided, ensure it exists and belongs to the vendor
      if (productData.categoryId) {
        const category = await storage.getProductCategory(productData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        if (category.vendorId !== productData.vendorId) {
          return res.status(403).json({ message: "Category does not belong to this vendor" });
        }
      }
      
      // Check if the vendor has reached their product limit
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

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const productData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertProductSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertProductSchema._type>);
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // If category is being changed, validate it
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

  app.delete("/api/products/:id", async (req, res) => {
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

  // Product category endpoints
  app.get("/api/vendors/:vendorId/product-categories", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const categories = await storage.getProductCategories(vendorId);
      return res.status(200).json(categories);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/product-categories", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      
      // Ensure the vendor exists
      const vendor = await storage.getVendor(categoryData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const category = await storage.createProductCategory(categoryData);
      return res.status(201).json(category);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const categoryData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertProductCategorySchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertProductCategorySchema._type>);
      
      const updatedCategory = await storage.updateProductCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(200).json(updatedCategory);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/product-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if any products are using this category
      const products = await storage.getProductsByCategory(id);
      if (products.length > 0) {
        return res.status(409).json({ 
          message: "Cannot delete category that has products associated with it" 
        });
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

  // Order endpoints
  app.get("/api/vendors/:vendorId/orders", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const orders = await storage.getOrders(vendorId);
      
      // Optionally include order items
      const includeItems = req.query.includeItems === "true";
      
      if (includeItems) {
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        }));
        
        return res.status(200).json(ordersWithItems);
      }
      
      return res.status(200).json(orders);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
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

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Ensure the vendor exists
      const vendor = await storage.getVendor(orderData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // If customer is provided, ensure it exists and belongs to the vendor
      if (orderData.customerId) {
        const customer = await storage.getCustomer(orderData.customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.vendorId !== orderData.vendorId) {
          return res.status(403).json({ message: "Customer does not belong to this vendor" });
        }
      }
      
      // Generate order number if not provided
      if (!orderData.orderNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const vendorPrefix = vendor.companyName.slice(0, 3).toUpperCase();
        orderData.orderNumber = `${vendorPrefix}-${timestamp}`;
      }
      
      const order = await storage.createOrder(orderData);
      
      // Add order items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const itemData of req.body.items) {
          const orderItem = insertOrderItemSchema.parse({
            ...itemData,
            orderId: order.id
          });
          
          await storage.createOrderItem(orderItem);
        }
      }
      
      // Return the created order with its items
      const items = await storage.getOrderItems(order.id);
      return res.status(201).json({
        ...order,
        items
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation
      const orderData = Object.keys(req.body).reduce((acc, key) => {
        if (key in insertOrderSchema.shape) {
          acc[key] = req.body[key];
        }
        return acc;
      }, {} as Partial<typeof insertOrderSchema._type>);
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(id, orderData);
      
      // Handle updates to order items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        // Get existing items
        const existingItems = await storage.getOrderItems(id);
        
        for (const itemData of req.body.items) {
          if (itemData.id) {
            // Update existing item
            const existingItem = existingItems.find(item => item.id === itemData.id);
            if (existingItem) {
              const updatedItemData = Object.keys(itemData).reduce((acc, key) => {
                if (key in insertOrderItemSchema.shape) {
                  acc[key] = itemData[key];
                }
                return acc;
              }, {} as Partial<typeof insertOrderItemSchema._type>);
              
              await storage.updateOrderItem(itemData.id, updatedItemData);
            }
          } else {
            // Create new item
            const orderItem = insertOrderItemSchema.parse({
              ...itemData,
              orderId: id
            });
            
            await storage.createOrderItem(orderItem);
          }
        }
      }
      
      // Return the updated order with its items
      const items = await storage.getOrderItems(id);
      return res.status(200).json({
        ...updatedOrder,
        items
      });
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Customer endpoints
  app.get("/api/vendors/:vendorId/customers", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const customers = await storage.getCustomers(vendorId);
      return res.status(200).json(customers);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Ensure the vendor exists
      const vendor = await storage.getVendor(customerData.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Check if customer with the same email already exists for this vendor
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

  // Analytics endpoints
  app.get("/api/vendors/:vendorId/analytics", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      const analytics = await storage.getVendorAnalytics(vendorId);
      return res.status(200).json(analytics);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Platform statistics endpoint (for super admin)
  app.get("/api/platform-stats", async (_req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      return res.status(200).json(stats);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
