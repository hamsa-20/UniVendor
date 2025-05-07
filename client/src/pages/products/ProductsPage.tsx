import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ProductsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  // Define product type
  type Product = {
    id: number;
    name: string;
    description?: string;
    price: string | number;
    imageUrl?: string;
    inStock: boolean;
    categoryId?: number;
  };

  // Fetch vendor's products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: vendorId ? [`/api/vendors/${vendorId}/products`] : ['/api/products'],
    enabled: !!user,
  });
  
  // Filter products based on search query
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <DashboardLayout title="Products" subtitle="Manage your product catalog">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <div className="w-full aspect-video bg-muted animate-pulse" />
              <CardHeader className="pb-2">
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>
                  {product.inStock ? (
                    <span className="text-green-600 font-medium">In Stock</span>
                  ) : (
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  )}
                  {' • '}${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || 'No description available'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="w-full">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start building your product catalog by adding your first product.
            </p>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default ProductsPage;