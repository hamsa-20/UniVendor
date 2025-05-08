import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  Heart, 
  ShoppingCart, 
  Eye,
  Tag,
  PackageCheck,
  PackageX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    description?: string;
    sellingPrice: string | number;
    purchasePrice?: string | number;
    mrp?: string | number;
    gst?: string | number;
    featuredImageUrl?: string;
    inventoryQuantity?: number;
    status: string;
    categoryId?: number;
    category?: {
      name: string;
    };
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  isVendorView?: boolean;
};

const ProductCard = ({ product, onEdit, onDelete, isVendorView = true }: ProductCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const formatPrice = (price: string | number) => {
    return typeof price === 'string' ? `$${parseFloat(price).toFixed(2)}` : `$${price.toFixed(2)}`;
  };

  const getInventoryBadge = () => {
    if (product.inventoryQuantity === undefined) return null;
    
    if (product.inventoryQuantity <= 0) {
      return <Badge variant="error" className="ml-2">Out of Stock</Badge>;
    } else if (product.inventoryQuantity < 10) {
      return <Badge variant="warning" className="ml-2">Low Stock</Badge>;
    } else {
      return <Badge variant="success" className="ml-2">In Stock</Badge>;
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="error">Archived</Badge>;
      default:
        return null;
    }
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (onDelete) {
        onDelete(product.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(product.id);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
          {product.featuredImageUrl ? (
            <img
              src={product.featuredImageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <PackageCheck className="h-16 w-16" />
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>

          {/* Action buttons for vendor view */}
          {isVendorView && (
            <div className="absolute top-2 left-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-white h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onEdit && onEdit(product.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Product</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Product</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {product.category && (
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Tag className="h-3 w-3 mr-1" />
              {product.category.name}
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-base mb-1 line-clamp-1">{product.name}</h3>
          
          {/* Product Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center mt-1">
            <span className="font-semibold text-lg">{formatPrice(product.sellingPrice)}</span>
            {product.mrp && parseFloat(product.mrp.toString()) > parseFloat(product.sellingPrice.toString()) && (
              <span className="text-sm text-muted-foreground line-through ml-2">
                {formatPrice(product.mrp)}
              </span>
            )}
            {getInventoryBadge()}
          </div>
        </CardContent>

        {isVendorView ? (
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/products/${product.id}`}>View Details</Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit && onEdit(product.id)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </CardFooter>
        ) : (
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              className="w-10 px-0"
            >
              <Heart className="h-4 w-4" />
              <span className="sr-only">Add to wishlist</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 ml-2"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove it from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductCard;
