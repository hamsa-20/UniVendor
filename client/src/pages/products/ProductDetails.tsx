import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Import your auth hook here
import { useAuth } from "@/hooks/use-auth";

interface ProductDetailsProps {
  id: string;
}

interface Product {
  id: number;
  name: string;
  colors: { id: number; name: string; hex: string; imageUrl?: string }[];
  sizes: { id: number; name: string }[];
  defaultImage: string;
  images: string[];
  // Add other product fields as needed
}

const ProductDetails = ({ id }: ProductDetailsProps) => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth(); // Get current logged in user

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
    if (product?.sizes?.length && !selectedSize) {
      setSelectedSize(product.sizes[0].name);
    }
  }, [product, selectedColor, selectedSize]);

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

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Not Signed In",
        description: "Please sign in to add products to your cart.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection Required",
        description: "Please select both color and size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    // Add to cart logic here
    toast({ 
      title: "Added to Cart", 
      description: `Product added to cart with color: ${selectedColor} and size: ${selectedSize}.` 
    });
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Not Signed In",
        description: "Please sign in to purchase products.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    if (!selectedColor || !selectedSize) {
      toast({
        title: "Selection Required",
        description: "Please select both color and size before purchasing.",
        variant: "destructive",
      });
      return;
    }

    // Buy now logic here
    toast({ 
      title: "Purchase Started", 
      description: `Proceeding to checkout with color: ${selectedColor} and size: ${selectedSize}.` 
    });
  };

  // Product variants tab component
  const ProductVariantsTab = ({
    product,
    selectedColor,
    selectedSize,
    onColorChange,
    onSizeChange,
    user,
  }: {
    product: Product;
    selectedColor: string | null;
    selectedSize: string | null;
    onColorChange: (color: string) => void;
    onSizeChange: (size: string) => void;
    user: any;
  }) => {
    return (
      <div className="space-y-6">
        {/* Color Selection */}
        <div className="space-y-2">
          <h3 className="font-medium">Select Color</h3>
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
              />
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-2">
          <h3 className="font-medium">Select Size</h3>
          <div className="flex gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => onSizeChange(size.name)}
                className={`px-4 py-2 border rounded-md ${
                  selectedSize === size.name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Images Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImageIndex] || product.defaultImage}
              alt={`Product image ${selectedImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                    selectedImageIndex === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Product thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            disabled={!user || !selectedColor || !selectedSize} 
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
          <Button 
            disabled={!user || !selectedColor || !selectedSize} 
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>

        {!user && (
          <p className="text-red-600 text-sm mt-2">
            Please sign in to add to cart or buy this product.
          </p>
        )}
        {user && (!selectedColor || !selectedSize) && (
          <p className="text-yellow-600 text-sm mt-2">
            Please select both color and size before proceeding.
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
                {deleteMutation.isLoading ? (
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
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
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
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
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
