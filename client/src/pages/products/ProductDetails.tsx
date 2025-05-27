import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Helmet } from "react-helmet";
import EnhancedProductForm from "@/components/products/enhanced/EnhancedProductForm";

interface ProductDetailsProps {
  id: string;
}

interface Product {
  id: number;
  name: string;
  colors: { id: number; name: string; hex: string; imageUrl?: string }[];
  defaultImage: string;
  price?: string;
  vendorId?: number;
  // Add other product fields as needed
}

const ProductDetails = ({ id }: ProductDetailsProps) => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth(); // Get current logged in user

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ["/api/products", parseInt(id)],
    queryFn: () => fetch(`/api/products/${id}`).then((res) => res.json()),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (product?.colors?.length && !selectedColor) {
      setSelectedColor(product.colors[0].hex);
    }
  }, [product, selectedColor]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      });
      setLocation("/products");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Product Details">
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout title="Product Not Found">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/products")}>
            Return to Products
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getImageForColor = (colorHex: string | null) => {
    if (!colorHex) return product.defaultImage;
    const colorObj = product.colors.find((c) => c.hex === colorHex);
    return colorObj?.imageUrl || product.defaultImage;
  };

  // Get the current display image based on hover or selection
  const getCurrentDisplayImage = () => {
    if (hoveredColor) {
      return getImageForColor(hoveredColor);
    }
    return getImageForColor(selectedColor);
  };

  // Get cart context
  const cartContext = useCartContext();

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection Required",
        description: "Please select both color and size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    // Create cart item from product details
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price || "0.00", // Assuming product has a price field
      quantity: 1,
      imageUrl: getImageForColor(selectedColor),
      variant: `${selectedSize} / ${product.colors.find(c => c.hex === selectedColor)?.name || selectedColor}`,
      colorHex: selectedColor,
      size: selectedSize,
      vendorId: product.vendorId || 1 // Assuming product has a vendorId field
    };

    // Add to cart through context (works for both guest and authenticated users)
    cartContext.addToCart(cartItem);
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Not Signed In",
        description: "Please sign in to purchase products.",
        variant: "destructive",
      });
      setLocation("/signin"); // redirect to sign-in page
      return;
    }
    // Buy now logic here
    toast({ title: "Purchase Started", description: "Proceeding to checkout." });
  };

  // Product variants tab component
  const ProductVariantsTab = ({
    product,
    selectedColor,
    onColorChange,
    user,
  }: {
    product: Product;
    selectedColor: string | null;
    onColorChange: (color: string) => void;
    user: any;
  }) => {
    const sizes = ["S", "M", "L", "XL", "XXL"]; // Example sizes, typically from product data
    
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          {product.colors.map((color) => (
            <button
              key={color.id}
              aria-label={`Select color ${color.name}`}
              style={{
                backgroundColor: color.hex,
                border:
                  selectedColor === color.hex ? "3px solid #000" : "1px solid #ccc",
              }}
              className="w-8 h-8 rounded-full"
              onClick={() => onColorChange(color.hex)}
              onMouseEnter={() => setHoveredColor(color.hex)}
              onMouseLeave={() => setHoveredColor(null)}
            />
          ))}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Size:</label>
          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                className={`px-3 py-1 border rounded-md ${
                  selectedSize === size 
                    ? "border-black bg-black text-white" 
                    : "border-gray-300 hover:border-gray-500"
                }`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <img
            src={getCurrentDisplayImage()}
            alt={`Product in selected color`}
            className="w-64 h-64 object-contain border"
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={handleAddToCart}>
            Add to Cart
          </Button>
          <Button disabled={!user} onClick={handleBuyNow}>
            Buy Now
          </Button>
        </div>

        {!user && (
          <p className="text-red-600 text-sm mt-2">
            Please sign in to buy this product.
          </p>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title={`${product.name} | Product Details`}>
      <Helmet>
        <title>{`${product.name} | Product Details`}</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/products")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                product and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <EnhancedProductForm
            productId={parseInt(id)}
            onSuccess={() => {
              toast({
                title: "Success",
                description: "Product updated successfully",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <ProductVariantsTab
            product={product}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            user={user}
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Information</CardTitle>
              <CardDescription>
                Optimize your product's visibility on search engines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                SEO settings will be implemented soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ProductDetails;
