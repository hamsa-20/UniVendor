import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Decimal } from "decimal.js";
import Stripe from "stripe";
import {
  insertOrderSchema,
  insertOrderItemSchema,
  insertTransactionSchema
} from "@shared/schema";
import { storage } from "./storage";

// Define custom Request type with user property
interface AuthRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
}

// If STRIPE_SECRET_KEY is available, initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

// Zod schema for checkout request
const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    postalCode: z.string().min(1, "Postal/ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  paymentMethodId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      price: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  subtotal: z.string(),
  total: z.string(),
  vendorId: z.number(),
  savePaymentInfo: z.boolean().optional(),
  saveAddress: z.boolean().optional(),
});

// Zod schema for create payment intent request
const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  orderId: z.string().optional(),
});

export function registerCheckoutRoutes(router: Router) {
  // Middleware to check authentication
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Get cart endpoint
  router.get("/api/cart", async (req: AuthRequest, res: Response) => {
    try {
      let cart;
      
      if (req.isAuthenticated() && req.user) {
        // Get user's cart from database if logged in
        cart = await storage.getCartByUserId(req.user.id);
      } else {
        // Get cart from session if not logged in
        cart = req.session.cart;
      }
      
      if (!cart) {
        // Return empty cart if none exists
        return res.json({
          id: 0,
          items: [],
          subtotal: "0.00",
          total: "0.00",
          vendorId: 1, // Default vendor ID
        });
      }
      
      res.json(cart);
    } catch (error: any) {
      console.error("Error getting cart:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add item to cart
  router.post("/api/cart/items", async (req: AuthRequest, res: Response) => {
    try {
      const { productId, quantity = 1 } = req.body;
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      
      // Get product details
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      let cart;
      
      if (req.isAuthenticated() && req.user) {
        // Add to user's cart in database if logged in
        cart = await storage.addToCart(req.user.id, {
          productId,
          name: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl || null,
        });
      } else {
        // Add to session cart if not logged in
        if (!req.session.cart) {
          req.session.cart = {
            id: Math.floor(Math.random() * 1000000), // Temporary ID for session cart
            items: [],
            subtotal: "0.00",
            total: "0.00",
            vendorId: product.vendorId,
          };
        }
        
        // Check if item already exists in cart
        const existingItemIndex = req.session.cart.items.findIndex(
          (item: any) => item.productId === productId
        );
        
        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          req.session.cart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item if it doesn't exist
          req.session.cart.items.push({
            id: Math.floor(Math.random() * 1000000), // Temporary ID for cart item
            productId,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl || null,
          });
        }
        
        // Recalculate cart totals
        let subtotal = new Decimal(0);
        req.session.cart.items.forEach((item: any) => {
          subtotal = subtotal.plus(new Decimal(item.price).times(item.quantity));
        });
        
        req.session.cart.subtotal = subtotal.toFixed(2);
        req.session.cart.total = subtotal.toFixed(2); // Add tax/shipping calculation as needed
        
        cart = req.session.cart;
      }
      
      res.json(cart);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update cart item quantity
  router.patch("/api/cart/items/:itemId", async (req: AuthRequest, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      
      let cart;
      
      if (req.isAuthenticated() && req.user) {
        // Update user's cart in database if logged in
        cart = await storage.updateCartItemQuantity(req.user.id, itemId, quantity);
      } else {
        // Update session cart if not logged in
        if (!req.session.cart) {
          return res.status(404).json({ message: "Cart not found" });
        }
        
        const itemIndex = req.session.cart.items.findIndex(
          (item: any) => item.id === itemId
        );
        
        if (itemIndex === -1) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        
        // Update quantity
        req.session.cart.items[itemIndex].quantity = quantity;
        
        // Recalculate cart totals
        let subtotal = new Decimal(0);
        req.session.cart.items.forEach((item: any) => {
          subtotal = subtotal.plus(new Decimal(item.price).times(item.quantity));
        });
        
        req.session.cart.subtotal = subtotal.toFixed(2);
        req.session.cart.total = subtotal.toFixed(2); // Add tax/shipping calculation as needed
        
        cart = req.session.cart;
      }
      
      res.json(cart);
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Remove item from cart
  router.delete("/api/cart/items/:itemId", async (req: AuthRequest, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      let cart;
      
      if (req.isAuthenticated() && req.user) {
        // Remove from user's cart in database if logged in
        cart = await storage.removeFromCart(req.user.id, itemId);
      } else {
        // Remove from session cart if not logged in
        if (!req.session.cart) {
          return res.status(404).json({ message: "Cart not found" });
        }
        
        const itemIndex = req.session.cart.items.findIndex(
          (item: any) => item.id === itemId
        );
        
        if (itemIndex === -1) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        
        // Remove item
        req.session.cart.items.splice(itemIndex, 1);
        
        // Recalculate cart totals
        let subtotal = new Decimal(0);
        req.session.cart.items.forEach((item: any) => {
          subtotal = subtotal.plus(new Decimal(item.price).times(item.quantity));
        });
        
        req.session.cart.subtotal = subtotal.toFixed(2);
        req.session.cart.total = subtotal.toFixed(2); // Add tax/shipping calculation as needed
        
        cart = req.session.cart;
      }
      
      res.json(cart);
    } catch (error: any) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Clear cart
  router.delete("/api/cart", async (req: AuthRequest, res: Response) => {
    try {
      if (req.isAuthenticated() && req.user) {
        // Clear user's cart in database if logged in
        await storage.clearCart(req.user.id);
      } else {
        // Clear session cart if not logged in
        req.session.cart = {
          id: Math.floor(Math.random() * 1000000),
          items: [],
          subtotal: "0.00",
          total: "0.00",
          vendorId: req.session.cart?.vendorId || 1,
        };
      }
      
      res.json({ message: "Cart cleared" });
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create order (checkout)
  router.post("/api/vendors/:vendorId/orders", async (req: AuthRequest, res: Response) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      
      // Validate checkout data
      const checkoutData = checkoutSchema.parse(req.body);
      
      // Verify vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Create or get customer
      let customerId;
      if (req.isAuthenticated() && req.user) {
        // Use existing customer if logged in
        const customer = await storage.getCustomerByUserId(req.user.id, vendorId);
        if (customer) {
          customerId = customer.id;
        } else {
          // Create new customer linked to user
          const newCustomer = await storage.createCustomer({
            email: checkoutData.email,
            firstName: checkoutData.name.split(' ')[0],
            lastName: checkoutData.name.split(' ').slice(1).join(' '),
            phone: null,
            vendorId,
            totalOrders: 0,
            totalSpent: "0.00",
          });
          customerId = newCustomer.id;
        }
      } else {
        // Create guest customer if not logged in
        const customer = await storage.getCustomerByEmail(checkoutData.email, vendorId);
        if (customer) {
          customerId = customer.id;
        } else {
          const newCustomer = await storage.createCustomer({
            email: checkoutData.email,
            firstName: checkoutData.name.split(' ')[0],
            lastName: checkoutData.name.split(' ').slice(1).join(' '),
            phone: null,
            vendorId,
            totalOrders: 0,
            totalSpent: "0.00",
          });
          customerId = newCustomer.id;
        }
      }
      
      // Create customer address if requested
      if (checkoutData.saveAddress && customerId) {
        await storage.createCustomerAddress({
          customerId,
          addressLine1: checkoutData.address.line1,
          addressLine2: checkoutData.address.line2 || null,
          city: checkoutData.address.city,
          state: checkoutData.address.state,
          postalCode: checkoutData.address.postalCode,
          country: checkoutData.address.country,
          isDefault: true,
        });
      }
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create order
      const order = await storage.createOrder({
        vendorId,
        customerId,
        orderNumber,
        subtotal: checkoutData.subtotal,
        total: checkoutData.total,
        tax: new Decimal(checkoutData.subtotal).times(0.0825).toFixed(2), // Example tax calculation
        shipping: "0.00", // Free shipping
        discount: "0.00",
        currency: "USD",
        status: "pending",
        shippingAddress: JSON.stringify(checkoutData.address),
        billingAddress: JSON.stringify(checkoutData.address), // Using same address for billing
        notes: null,
      });
      
      // Create order items
      for (const item of checkoutData.items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: new Decimal(item.price).times(item.quantity).toFixed(2),
        });
      }
      
      // Clear the cart after successful order creation
      if (req.isAuthenticated() && req.user) {
        await storage.clearCart(req.user.id);
      } else {
        req.session.cart = {
          id: Math.floor(Math.random() * 1000000),
          items: [],
          subtotal: "0.00",
          total: "0.00",
          vendorId,
        };
      }
      
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment intent creation endpoint
  router.post("/api/vendors/:vendorId/payment/create-intent", async (req: AuthRequest, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const vendorId = parseInt(req.params.vendorId);
      
      // Verify vendor exists
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Get vendor's Stripe settings
      const stripeSettings = await storage.getPaymentProviderSettingsByVendorId(vendorId, "stripe");
      if (!stripeSettings || !stripeSettings.isActive) {
        return res.status(400).json({ message: "Stripe payments are not enabled for this vendor" });
      }
      
      // Validate request data
      const data = createPaymentIntentSchema.parse(req.body);
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        metadata: {
          vendorId: vendorId.toString(),
          orderId: data.orderId || "",
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update order with payment information
  router.post("/api/orders/:orderId/payment", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { paymentIntentId, paymentMethod, status } = req.body;
      
      if (!paymentIntentId && !paymentMethod) {
        return res.status(400).json({ message: "Payment information is required" });
      }
      
      // Get order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check permissions
      if (req.user.role !== "super_admin") {
        const vendor = await storage.getVendorByUserId(req.user.id);
        if (!vendor || order.vendorId !== vendor.id) {
          return res.status(403).json({ message: "You don't have permission to update this order" });
        }
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        orderId,
        vendorId: order.vendorId,
        amount: order.total,
        currency: order.currency || "USD",
        status: status || "completed",
        type: "payment",
        providerReference: paymentIntentId,
        paymentMethod: paymentMethod || "unknown",
      });
      
      // Update order status
      const updatedOrder = await storage.updateOrder(orderId, {
        status: "paid",
      });
      
      res.json({
        transaction,
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook endpoint for Stripe events
  router.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    const sig = req.headers["stripe-signature"] as string;
    let event;
    
    try {
      // Verify the event came from Stripe
      // In production, you would use a webhook secret from your environment variables
      // const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripeWebhookSecret = "whsec_test"; // For testing only
      
      if (stripeWebhookSecret) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          stripeWebhookSecret
        );
      } else {
        // If no webhook secret, just parse the body (less secure)
        event = req.body;
      }
      
      // Handle different event types
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;
        
        // If we have an orderId in the metadata, update the order
        if (metadata && metadata.orderId) {
          const orderId = parseInt(metadata.orderId);
          const order = await storage.getOrder(orderId);
          
          if (order) {
            // Create transaction record
            await storage.createTransaction({
              orderId,
              vendorId: order.vendorId,
              amount: order.total,
              currency: order.currency || "USD",
              status: "completed",
              type: "payment",
              providerReference: paymentIntent.id,
              paymentMethod: "stripe",
            });
            
            // Update order status
            await storage.updateOrder(orderId, {
              status: "paid",
            });
          }
        }
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      return res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });

  // PayPal webhook endpoint
  router.post("/api/webhooks/paypal", async (req: Request, res: Response) => {
    try {
      const event = req.body;
      
      // Verify the event came from PayPal (You would implement proper verification in production)
      
      // Handle different event types
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const resource = event.resource;
        const customId = resource.custom_id; // This would be your orderId
        
        if (customId) {
          const orderId = parseInt(customId);
          const order = await storage.getOrder(orderId);
          
          if (order) {
            // Create transaction record
            await storage.createTransaction({
              orderId,
              vendorId: order.vendorId,
              amount: order.total,
              currency: order.currency || "USD",
              status: "completed",
              type: "payment",
              providerReference: resource.id,
              paymentMethod: "paypal",
            });
            
            // Update order status
            await storage.updateOrder(orderId, {
              status: "paid",
            });
          }
        }
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("PayPal webhook error:", error);
      return res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });
}