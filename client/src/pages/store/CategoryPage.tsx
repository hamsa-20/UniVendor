import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useVendorStore } from '@/contexts/VendorStoreContext';
import { Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryNav from '@/components/store/CategoryNav';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  description: string | null;
  isGlobal?: boolean;
  vendorId?: number | null;
}

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

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { vendor, loading: vendorLoading } = useVendorStore();
  
  // Fetch category data along with its products
  const { 
    data, 
    isLoading,
    error
  } = useQuery({
    queryKey: vendor && slug ? [`/api/category/${slug}`] : [],
    queryFn: vendor && slug ? 
      async () => {
        const response = await fetch(`/api/category/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch category data');
        return response.json();
      } : undefined,
    enabled: !!vendor && !!slug,
  });
  
  const category = data?.category as Category;
  const subcategories = data?.subcategories as Category[] || [];
  const products = data?.products as Product[] || [];
  
  if (vendorLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !category) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-6">The category you are looking for doesn't exist or has been removed.</p>
            <Link href="/" className="text-primary hover:underline flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Category Navigation */}
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          {vendor && (
            <div className="relative">
              <CategoryNav vendorId={vendor.id} className="py-2" />
            </div>
          )}
        </div>
      </div>
      
      {/* Category Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>
        
        {/* Display subcategories if present */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {subcategories.map(subcat => (
                <Link key={subcat.id} href={`/category/${subcat.slug}`} className="block">
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-sm transition-all">
                    <h3 className="font-medium text-gray-900">{subcat.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
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
                        <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">SALE</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-end">
                      <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                      {product.compareAtPrice && (
                        <span className="ml-2 text-sm text-gray-500 line-through">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                    <Button className="w-full mt-3 text-sm" size="sm">Add to Cart</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-gray-200 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Products Found</h3>
              <p className="text-gray-500">There are no products in this category at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}