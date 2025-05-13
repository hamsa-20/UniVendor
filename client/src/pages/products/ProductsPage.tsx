import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Package, Search, FolderTree, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ProductsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [_, navigate] = useLocation();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
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
    <DashboardLayout title="Products" subtitle="View your product catalog">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/product-categories">
            <Button variant="outline" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Manage Categories
            </Button>
          </Link>
        </div>
        <Button onClick={() => setIsAddProductOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for your store
            </DialogDescription>
          </DialogHeader>
          {/* We'll import and use our new product form component here */}
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      {selectedProductId && (
        <Dialog 
          open={!!selectedProductId} 
          onOpenChange={(open) => {
            if (!open) setSelectedProductId(undefined);
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update your product details
              </DialogDescription>
            </DialogHeader>
            {/* We'll use our product edit form component here */}
          </DialogContent>
        </Dialog>
      )}
      
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
            <Card 
              key={product.id} 
              className="overflow-hidden shadow-sm hover:shadow transition-shadow cursor-pointer group"
              onClick={() => setSelectedProductId(product.id)}
            >
              {product.imageUrl ? (
                <div className="relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full aspect-video object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="shadow-md">
                      Edit Product
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center relative">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="shadow-md">
                      Edit Product
                    </Button>
                  </div>
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
                  {' • '}₹{typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
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
            <Button onClick={() => setIsAddProductOpen(true)}>
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