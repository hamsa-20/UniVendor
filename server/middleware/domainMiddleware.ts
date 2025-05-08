import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Interface for the request with domain data
export interface DomainRequest extends Request {
  domain?: {
    id: number;
    name: string;
    vendorId: number;
    type: string;
    status: string;
    isPrimary: boolean;
  };
  vendor?: {
    id: number;
    companyName: string;
    storeTheme: string;
    customCss?: string;
    logoUrl?: string;
  };
  isVendorStore?: boolean;
}

/**
 * Middleware to handle domain-based routing
 * This determines which vendor's store to display based on the domain
 */
export const domainMiddleware = async (
  req: DomainRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip for API requests and static assets
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/@fs/') || 
      req.path.startsWith('/@vite/') ||
      req.path.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf|eot)$/i)) {
    return next();
  }

  // Extract hostname
  const hostname = req.hostname;
  
  // Skip for localhost/development domains when not explicitly testing domains
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.includes('replit.dev') ||
      hostname.includes('repl.co')) {
    
    // Check if we're testing a specific domain with ?domain=test.com query param
    const testDomain = req.query.domain as string;
    if (testDomain) {
      return handleDomainRouting(testDomain, req, res, next);
    }
    
    return next();
  }
  
  return handleDomainRouting(hostname, req, res, next);
};

/**
 * Handle the domain routing logic based on hostname
 */
async function handleDomainRouting(
  hostname: string,
  req: DomainRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Check if this is a subdomain of our main domain (e.g., vendor.multivend.com)
    const isSubdomain = hostname.endsWith('.multivend.com');
    
    let domain;
    
    if (isSubdomain) {
      // Extract subdomain name from hostname (vendor.multivend.com -> vendor)
      const subdomain = hostname.split('.')[0];
      
      // Find domain by subdomain name
      domain = await storage.getDomainByName(`${subdomain}.multivend.com`);
    } else {
      // This is a custom domain, find it directly
      domain = await storage.getDomainByName(hostname);
    }
    
    // If domain not found or not active, continue to regular routes
    if (!domain || domain.status !== 'active') {
      return next();
    }
    
    // Get vendor details
    const vendor = await storage.getVendor(domain.vendorId);
    
    if (!vendor) {
      return next();
    }
    
    // Add domain and vendor info to request
    req.domain = {
      id: domain.id,
      name: domain.name,
      vendorId: domain.vendorId,
      type: domain.type,
      status: domain.status,
      isPrimary: domain.isPrimary
    };
    
    req.vendor = {
      id: vendor.id,
      companyName: vendor.companyName,
      storeTheme: vendor.storeTheme || 'default',
      customCss: vendor.customCss,
      logoUrl: vendor.logoUrl
    };
    
    req.isVendorStore = true;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Domain routing error:', error);
    next();
  }
}