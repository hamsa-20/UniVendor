import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { insertCustomerAddressSchema } from '../shared/schema';
import { isAuthenticated } from './auth';

// Extend Request with user property
interface AuthRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
  login(user: any, callback: (err: any) => void): void;
  logout(callback: (err: any) => void): void;
}

/**
 * Register address-related routes
 */
export default function registerAddressRoutes(app: Express) {
  // Get all addresses for authenticated user
  app.get('/api/addresses', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const vendorId = parseInt(req.query.vendorId as string);
      
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      
      // Get customer by user ID and vendor ID
      const customer = await storage.getCustomerByUserId(userId, vendorId);
      if (!customer) {
        return res.status(200).json([]); // Return empty array if no customer profile
      }
      
      // Get addresses for customer
      const addresses = await storage.getCustomerAddresses(customer.id);
      return res.status(200).json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });
  
  // Create new address
  app.post('/api/addresses', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const vendorId = parseInt(req.body.vendorId as string);
      
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      
      // Validate request body
      const validation = insertCustomerAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      
      // Get or create customer
      let customer = await storage.getCustomerByUserId(userId, vendorId);
      if (!customer) {
        // Create a new customer profile for this vendor
        customer = await storage.createCustomer({
          email: req.user?.email || '',
          firstName: req.user?.firstName || null,
          lastName: req.user?.lastName || null,
          phone: req.user?.phone || null,
          vendorId: vendorId,
          totalOrders: 0,
          totalSpent: "0.00"
        });
      }
      
      // If this is the first address, make it default
      const existingAddresses = await storage.getCustomerAddresses(customer.id);
      const isDefault = existingAddresses.length === 0 ? true : validation.data.isDefault;
      
      // If setting this address as default, unset default for all other addresses
      if (isDefault) {
        for (const address of existingAddresses) {
          if (address.isDefault) {
            await storage.updateCustomerAddress(address.id, { isDefault: false });
          }
        }
      }
      
      // Create address
      const address = await storage.createCustomerAddress({
        ...validation.data,
        customerId: customer.id,
        isDefault
      });
      
      return res.status(201).json(address);
    } catch (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ message: "Failed to create address" });
    }
  });
  
  // Update address
  app.put('/api/addresses/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Get address to verify ownership
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Get customer to verify ownership
      const customer = await storage.getCustomerByUserId(req.user?.id, req.body.vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      
      // Validate request body
      const validation = insertCustomerAddressSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request data", errors: validation.error.errors });
      }
      
      // If setting this address as default, unset default for all other addresses
      if (validation.data.isDefault) {
        const addresses = await storage.getCustomerAddresses(customer.id);
        for (const addr of addresses) {
          if (addr.id !== addressId && addr.isDefault) {
            await storage.updateCustomerAddress(addr.id, { isDefault: false });
          }
        }
      }
      
      // Update address
      const updatedAddress = await storage.updateCustomerAddress(addressId, validation.data);
      
      return res.status(200).json(updatedAddress);
    } catch (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ message: "Failed to update address" });
    }
  });
  
  // Delete address
  app.delete('/api/addresses/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Get address to verify ownership
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Get customer to verify ownership
      const vendorId = parseInt(req.query.vendorId as string);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      
      const customer = await storage.getCustomerByUserId(req.user?.id, vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to delete this address" });
      }
      
      // If deleting the default address, make another address default
      if (address.isDefault) {
        const addresses = await storage.getCustomerAddresses(customer.id);
        const otherAddress = addresses.find(a => a.id !== addressId);
        if (otherAddress) {
          await storage.updateCustomerAddress(otherAddress.id, { isDefault: true });
        }
      }
      
      // Delete address
      await storage.deleteCustomerAddress(addressId);
      
      return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error('Error deleting address:', error);
      return res.status(500).json({ message: "Failed to delete address" });
    }
  });
  
  // Set address as default
  app.post('/api/addresses/:id/set-default', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Get address to verify ownership
      const address = await storage.getCustomerAddress(addressId);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Get customer to verify ownership
      const vendorId = parseInt(req.body.vendorId as string);
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }
      
      const customer = await storage.getCustomerByUserId(req.user?.id, vendorId);
      if (!customer || address.customerId !== customer.id) {
        return res.status(403).json({ message: "Not authorized to update this address" });
      }
      
      // Unset default for all other addresses
      const addresses = await storage.getCustomerAddresses(customer.id);
      for (const addr of addresses) {
        if (addr.id !== addressId && addr.isDefault) {
          await storage.updateCustomerAddress(addr.id, { isDefault: false });
        }
      }
      
      // Set this address as default
      const updatedAddress = await storage.updateCustomerAddress(addressId, { isDefault: true });
      
      return res.status(200).json(updatedAddress);
    } catch (error) {
      console.error('Error setting default address:', error);
      return res.status(500).json({ message: "Failed to set default address" });
    }
  });
}