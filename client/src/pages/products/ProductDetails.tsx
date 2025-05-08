import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

type ProductDetailsProps = {
  id: string;
};

const ProductDetails = ({ id }: ProductDetailsProps) => {
  const { user } = useAuth();
  const productId = parseInt(id);
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  if (isLoading) {
    return (
      <DashboardLayout title="Product Details" subtitle="Loading...">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  if (!product) {
    return (
      <DashboardLayout title="Product Not Found" subtitle="The requested product does not exist">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Product not found</h3>
            <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title="Product Details" 
      subtitle={`Manage and edit product information`}
    >
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/products">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>
                Product ID: {product.id} • 
                {product.inStock ? (
                  <span className="text-green-600 font-medium"> In Stock</span>
                ) : (
                  <span className="text-red-600 font-medium"> Out of Stock</span>
                )}
              </CardDescription>
            </div>
            <Button>Edit Product</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product image */}
          <div className="bg-muted rounded-md overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full max-h-80 object-contain"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>
          
          {/* Product info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">
                  {product.description || 'No description provided'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categoryId ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category?.name || `Category ${product.categoryId}`}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Pricing</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">${parseFloat(product.price).toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <span className="ml-2 text-muted-foreground line-through">
                      ${parseFloat(product.compareAtPrice).toFixed(2)}
                    </span>
                  )}
                </div>
                {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                  <div className="mt-1">
                    <span className="text-green-600 text-sm font-medium">
                      Save {Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Inventory</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">SKU:</span>
                    <span className="text-sm font-medium">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">In Stock:</span>
                    <span className="text-sm font-medium">{product.inStock ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quantity:</span>
                    <span className="text-sm font-medium">{product.inventoryQuantity || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ProductDetails;