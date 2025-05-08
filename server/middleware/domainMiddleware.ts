import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

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

// Helper to get host without port
function getHostname(host: string): string {
  return host.split(':')[0];
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
  // Skip for API requests to avoid unnecessary DB queries
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/store')) {
    return next();
  }
  
  // Get the hostname from the request headers
  const host = req.headers.host || '';
  
  // Process domain routing
  await handleDomainRouting(host, req, res, next);
};

/**
 * Handle the domain routing logic based on hostname
 */
async function handleDomainRouting(
  host: string,
  req: DomainRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get the hostname without port
    const hostname = getHostname(host);
    
    // Skip routing for localhost/internal hostnames during development
    if (process.env.NODE_ENV === 'development' && 
        (hostname === 'localhost' || hostname === '0.0.0.0' || hostname.includes('.repl.co'))) {
      req.isVendorStore = false;
      return next();
    }
    
    // Check if this is a vendor domain (either custom or subdomain)
    const domain = await storage.getDomainByName(hostname);
    
    if (domain && domain.status === 'active') {
      // We found a matching domain that is active
      const vendor = await storage.getVendor(domain.vendorId);
      
      if (vendor) {
        // Set domain and vendor information on the request object
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
          storeTheme: vendor.storeTheme || 'default',
          customCss: vendor.customCss === null ? undefined : vendor.customCss,
          logoUrl: vendor.logoUrl === null ? undefined : vendor.logoUrl
        };
        req.isVendorStore = true;
      } else {
        // Domain exists but vendor doesn't - unusual case
        req.isVendorStore = false;
      }
    } else {
      // No matching domain found
      req.isVendorStore = false;
    }
    
    next();
  } catch (error) {
    console.error('Error in domain middleware:', error);
    req.isVendorStore = false;
    next();
  }
}