import { storage } from './storage';

/**
 * Creates a test vendor and domain for development
 */
async function createTestVendorAndDomain() {
  try {
    console.log('Creating test vendor and domain...');

    // Create test user first
    const testUser = await storage.getUserByEmail('testvendor@example.com');
    let userId: number;

    if (!testUser) {
      const newUser = await storage.createUser({
        email: 'testvendor@example.com',
        firstName: 'Test',
        lastName: 'Vendor',
        role: 'vendor',
        isProfileComplete: true
      });
      userId = newUser.id;
      console.log('Created test user with ID:', userId);
    } else {
      userId = testUser.id;
      console.log('Using existing test user with ID:', userId);
    }

    // Create or get vendor
    let vendor = await storage.getVendorByUserId(userId);
    
    if (!vendor) {
      vendor = await storage.createVendor({
        userId,
        companyName: 'Test Store',
        description: 'A test vendor store for development',
        status: 'active',
        storeTheme: 'blue',
        customCss: `
          :root {
            --primary: #3b82f6;
            --primary-foreground: #ffffff;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .store-header {
            background: linear-gradient(to right, #3b82f6, #2563eb);
          }
        `
      });
      console.log('Created test vendor with ID:', vendor.id);
    } else {
      console.log('Using existing vendor with ID:', vendor.id);
    }

    // Create test subdomains
    const testDomain = 'test-store.example.com';
    let domain = await storage.getDomainByName(testDomain);
    
    if (!domain) {
      domain = await storage.createDomain({
        vendorId: vendor.id,
        name: testDomain,
        type: 'custom',
        status: 'active',
        isPrimary: true,
        verificationStatus: 'verified',
        dnsRecords: ['CNAME test-store.example.com -> multivend-platform.com']
      });
      console.log('Created test domain:', domain.name);
    } else {
      console.log('Using existing domain:', domain.name);
    }

    // Create test subdomain
    const testSubdomain = 'test-store.multivend.com';
    let subdomain = await storage.getDomainByName(testSubdomain);
    
    if (!subdomain) {
      subdomain = await storage.createDomain({
        vendorId: vendor.id,
        name: testSubdomain,
        type: 'subdomain',
        status: 'active',
        isPrimary: false,
        verificationStatus: 'verified',
        dnsRecords: []
      });
      console.log('Created test subdomain:', subdomain.name);
    } else {
      console.log('Using existing subdomain:', subdomain.name);
    }

    // Create test products for this vendor
    const products = await storage.getProducts(vendor.id);
    
    if (products.length === 0) {
      const category = await storage.createProductCategory({
        vendorId: vendor.id,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic gadgets and devices',
        isActive: true
      });
      
      await storage.createProduct({
        vendorId: vendor.id,
        name: 'Wireless Headphones',
        description: 'High-quality wireless bluetooth headphones with noise cancellation',
        price: '89.99',
        compareAtPrice: '129.99',
        sku: 'WH-001',
        categoryId: category.id,
        status: 'active',
        inStock: true,
        inventoryQuantity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3',
        tags: ['electronics', 'audio', 'headphones']
      });
      
      await storage.createProduct({
        vendorId: vendor.id,
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced camera and long battery life',
        price: '699.99',
        compareAtPrice: '799.99',
        sku: 'SP-002',
        categoryId: category.id,
        status: 'active',
        inStock: true,
        inventoryQuantity: 25,
        imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.0.3',
        tags: ['electronics', 'phone', 'smartphone']
      });
      
      console.log('Created test products for vendor');
    } else {
      console.log(`Vendor already has ${products.length} products`);
    }

    console.log('Test data setup complete!');
    console.log('You can now test the store by visiting:');
    console.log(`- ${testDomain}`);
    console.log(`- ${testSubdomain}`);
    console.log('Note: For local development, add these domains to your hosts file or use the platform domain.');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createTestVendorAndDomain().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Failed to create test data:', err);
    process.exit(1);
  });
}

export { createTestVendorAndDomain };