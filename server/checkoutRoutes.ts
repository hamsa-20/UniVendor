import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { generateOrderNumber } from './utils/orderNumberGenerator';

/**
 * Register checkout-related routes
 */
export default function registerCheckoutRoutes(app: Express) {
  // Get cart
  app.get('/api/cart', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;
      
      // Get cart based on authentication status
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
      console.error('Error fetching cart:', error);
      return res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  // Add to cart
  app.post('/api/cart/add', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        productId: z.number(),
        quantity: z.number().positive(),
        variant: z.string().optional(),
        vendorId: z.number()
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;

      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      
      // Add item to cart
      const cart = await storage.addToCart(userId, sessionId, validation.data);
      return res.status(200).json(cart);
    } catch (error) {
      console.error('Error adding to cart:', error);
      return res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Update item quantity
  app.put('/api/cart/items/:itemId', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        quantity: z.number().positive()
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }

      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;

      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      
      // Update item quantity
      const cart = await storage.updateCartItemQuantity(userId, sessionId, itemId, validation.data.quantity);
      return res.status(200).json(cart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      return res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete('/api/cart/items/:itemId', async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }

      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;

      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      
      // Remove item from cart
      const cart = await storage.removeFromCart(userId, sessionId, itemId);
      return res.status(200).json(cart);
    } catch (error) {
      console.error('Error removing cart item:', error);
      return res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  // Clear cart
  app.delete('/api/cart', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;

      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      
      // Clear cart
      await storage.clearCart(userId, sessionId);
      return res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error('Error clearing cart:', error);
      return res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Checkout cart (create order)
  app.post('/api/checkout', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        shippingAddress: z.object({
          addressLine1: z.string(),
          addressLine2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string()
        }),
        paymentMethod: z.string(), // 'cod', 'paypal', 'stripe', etc.
        vendorId: z.number(),
        notes: z.string().optional()
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }

      // Check if user is authenticated or using a session
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || null;

      if (!userId && !sessionId) {
        return res.status(400).json({ message: "No user or session ID available" });
      }
      
      // Get cart
      const cart = userId 
        ? await storage.getCartByUserId(userId)
        : await storage.getCartBySessionId(sessionId);
      
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Create customer if needed for guest checkout
      let customerId = null;
      if (userId) {
        // Check if user already has a customer profile for this vendor
        const customer = await storage.getCustomerByUserId(userId, validation.data.vendorId);
        if (customer) {
          customerId = customer.id;
        } else {
          // Create a new customer profile for this vendor
          const customerData = {
            email: req.user?.email || '',
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

      // Create order
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
        paymentStatus: validation.data.paymentMethod === 'cod' ? 'pending' : 'unpaid',
        shippingAddress: `${validation.data.shippingAddress.addressLine1}, ${validation.data.shippingAddress.city}, ${validation.data.shippingAddress.state}`,
        currency: "INR", // Default to INR, can make dynamic later
        notes: validation.data.notes || null
      });

      // Create order items
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

      // Clear cart
      await storage.clearCart(userId, sessionId);

      // Return order details
      return res.status(201).json(order);
    } catch (error) {
      console.error('Error processing checkout:', error);
      return res.status(500).json({ message: "Checkout failed" });
    }
  });

  // Get order by ID
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Get order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items
      const items = await storage.getOrderItems(orderId);

      // Return order with items
      return res.status(200).json({ ...order, items });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get user's orders
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const vendorId = req.query.vendorId ? parseInt(req.query.vendorId as string) : null;
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }

      // Get customer by user ID and vendor ID
      const customer = await storage.getCustomerByUserId(req.user.id, vendorId);
      if (!customer) {
        return res.status(200).json([]); // No orders if no customer profile
      }

      // Get orders
      const orders = await storage.getOrders(vendorId);
      const customerOrders = orders.filter(order => order.customerId === customer.id);

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        customerOrders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );

      return res.status(200).json(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
}