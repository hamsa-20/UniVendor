import { useEffect, useState } from 'react';
import { useVendorStore } from '@/contexts/VendorStoreContext';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  description: string | null;
  status: string;
  sku: string;
  categoryId: number;
  inventoryQuantity: number;
}

export default function StorefrontPage() {
  const { isVendorStore, vendor, domain, loading, error } = useVendorStore();
  
  // Use React Query to fetch products for better caching and loading states
  const { 
    data: products = [],
    isLoading: loadingProducts,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: vendor ? [`/api/vendors/${vendor.id}/products`] : null,
    enabled: !!isVendorStore && !!vendor,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!isVendorStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Welcome to MultiVend</h1>
        <p className="text-gray-600 mb-6">This is the platform homepage. Vendor stores are accessed through their own domains.</p>
        <a 
          href="https://multivend.com/vendors" 
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
          Browse Vendors
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Store Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {vendor?.logoUrl ? (
                <img 
                  src={vendor.logoUrl} 
                  alt={`${vendor.companyName} logo`} 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">{vendor?.companyName.charAt(0)}</span>
                </div>
              )}
              <h1 className="text-2xl font-bold">{vendor?.companyName}</h1>
            </div>
            <div className="text-sm">
              <span className="opacity-80">Powered by</span>{' '}
              <a href="https://multivend.com" className="font-semibold underline">MultiVend</a>
            </div>
          </div>
        </div>
      </header>

      {/* Store Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-6">Welcome to {vendor?.companyName}</h2>
            <p className="text-gray-600 max-w-3xl">
              This is a vendor storefront accessed through a custom domain: <strong>{domain?.name}</strong>. 
              The store has its own branding, products, and theme based on the vendor's settings.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Products</h2>
              <a href="#" className="text-primary hover:underline">View all</a>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {product.compareAtPrice && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-primary font-bold">${product.price}</span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">${product.compareAtPrice}</span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="rounded-full p-2">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No products available yet</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Store Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{vendor?.companyName}</h3>
              <p className="text-gray-600">Custom domain: {domain?.name}</p>
              <p className="text-gray-600">Theme: {vendor?.storeTheme || 'Default'}</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary">Products</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary">Categories</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} {vendor?.companyName}. All rights reserved.</p>
            <p className="mt-2">Powered by <a href="https://multivend.com" className="text-primary hover:underline">MultiVend</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}