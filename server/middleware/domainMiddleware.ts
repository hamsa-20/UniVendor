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
    
    // For development environment, handle test domains or use a special header
    if (process.env.NODE_ENV === 'development') {
      // For localhost/Replit domains, check for test header or query parameter
      if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname.includes('.repl.co')) {
        // Check for special test header or query param
        const testDomain = req.headers['x-test-domain'] || req.query.domain || req.query.test_domain;
        
        if (testDomain) {
          console.log(`Testing with domain: ${testDomain}`);
          
          // Try to find the domain including the full domain name
          let domain = await storage.getDomainByName(testDomain as string);
          
          // If not found, check if it's a subdomain format like "vendor.multivend.com"
          if (!domain && typeof testDomain === 'string') {
            const domainParts = (testDomain as string).split('.');
            if (domainParts.length >= 3) {
              // For subdomains in format: subdomain.multivend.com
              const subdomainName = `${domainParts[0]}.multivend.com`;
              domain = await storage.getDomainByName(subdomainName);
              console.log(`Trying subdomain: ${subdomainName}`);
            } else if (domainParts.length === 1) {
              // Just the subdomain part was provided
              const subdomainName = `${testDomain}.multivend.com`;
              domain = await storage.getDomainByName(subdomainName);
              console.log(`Trying subdomain with suffix: ${subdomainName}`);
            }
          }
          
          if (domain) {
            console.log(`Found domain: ${domain.name}`);
            const vendor = await storage.getVendor(domain.vendorId);
            
            if (vendor) {
              console.log(`Found vendor: ${vendor.companyName}`);
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
              return next();
            }
          }
        }
        
        // Default for local development if no test domain
        req.isVendorStore = false;
        return next();
      }
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