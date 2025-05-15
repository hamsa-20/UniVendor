import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Helper function to format currency
const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '₹0.00';
  return `₹${numValue.toFixed(2)}`;
};

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Info, ArrowLeft, Package, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom components
import ProductImageUploader from "./ProductImageUploader";
import ProductTagsInput from "./ProductTagsInput";
import ProductFormStepNav from "./ProductFormStepNav";
import ProductFormStepSummary, { defaultProductFormSteps } from "./ProductFormStepSummary";
import EnhancedVariantManager from "./EnhancedVariantManager";

interface EnhancedProductFormProps {
  productId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EnhancedProductForm({
  productId,
  onSuccess,
  onCancel,
}: EnhancedProductFormProps) {
  const [step, setStep] = useState(1);
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const isEditing = !!productId;
  const totalSteps = defaultProductFormSteps.length;
  
  // Get vendor ID
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  // Form definition
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
      categoryId: undefined,
      tags: [],
      sellingPrice: "0",
      purchasePrice: "",
      mrp: "",
      gst: "",
      sku: "",
      barcode: "",
      inventoryQuantity: "0",
      weight: "",
      length: "",
      width: "",
      height: "",
      featuredImageUrl: null,
      images: [],
      hasVariants: false,
    },
  });
  
  // Watch values for validation
  const watchName = form.watch("name");
  const watchSellingPrice = form.watch("sellingPrice");
  const watchStatus = form.watch("status");
  const watchHasVariants = form.watch("hasVariants");
  const watchFeaturedImage = form.watch("featuredImageUrl");
  
  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });
  
  // Fetch existing product data if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });
  
  // Fetch product variants if editing
  const { data: productVariants = [] } = useQuery({
    queryKey: ['/api/products', productId, 'variants'],
    enabled: !!productId,
  });
  
  // Set form values when product data is loaded
  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        status: product.status || "draft",
        categoryId: product.categoryId?.toString(),
        tags: product.tags || [],
        sellingPrice: product.sellingPrice?.toString() || "0",
        purchasePrice: product.purchasePrice?.toString() || "",
        mrp: product.mrp?.toString() || "",
        gst: product.gst?.toString() || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        inventoryQuantity: product.inventoryQuantity?.toString() || "0",
        weight: product.weight?.toString() || "",
        length: product.dimensions ? product.dimensions.split('x')[0] || "" : "",
        width: product.dimensions ? product.dimensions.split('x')[1] || "" : "",
        height: product.dimensions ? product.dimensions.split('x')[2] || "" : "",
        featuredImageUrl: product.featuredImageUrl || null,
        images: product.images || [],
        hasVariants: productVariants.length > 0,
      });
    }
  }, [product, isEditing, form, productVariants]);
  
  // Set variants when productVariants data is loaded
  useEffect(() => {
    if (productVariants && productVariants.length > 0) {
      setVariants(productVariants);
    }
  }, [productVariants]);
  
  // Product creation/update mutation
  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Convert string values to appropriate types for backend
      const productData = {
        ...data,
        // For numeric fields, convert strings to numbers or null
        sellingPrice: parseFloat(data.sellingPrice),
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
        mrp: data.mrp ? parseFloat(data.mrp) : null,
        gst: data.gst ? parseFloat(data.gst) : null,
        inventoryQuantity: data.inventoryQuantity ? parseInt(data.inventoryQuantity) : 0,
        weight: data.weight ? parseFloat(data.weight) : null,
        
        // Combine dimensions if any are provided
        dimensions: (data.length || data.width || data.height) 
          ? `${data.length || 0}x${data.width || 0}x${data.height || 0}`
          : null,
          
        // Add vendor ID for new products
        ...(isEditing ? {} : { vendorId }),
      };
      
      if (isEditing) {
        const response = await apiRequest(
          "PUT", 
          `/api/products/${productId}`, 
          productData
        );
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/products", productData);
        return response.json();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      }
      
      toast({
        title: isEditing ? "Product updated" : "Product created",
        description: isEditing
          ? "Your product has been updated successfully."
          : "Your product has been created successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      } else if (!isEditing) {
        // Navigate to the edit page for the newly created product
        setLocation(`/products/${result.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    },
  });
  
  // Function to save form data
  const onSubmit = (values: ProductFormValues) => {
    mutation.mutate(values);
  };
  
  // Function to handle partial save
  const handlePartialSave = () => {
    const currentValues = form.getValues();
    if (currentValues.name) {
      mutation.mutate(currentValues);
    } else {
      toast({
        title: "Cannot save yet",
        description: "Please provide at least a product name before saving.",
        variant: "destructive",
      });
    }
  };
  
  // Determine if current step is valid
  const isCurrentStepValid = () => {
    const values = form.getValues();
    
    switch (step) {
      case 1: // Basic Information
        return !!values.name.trim();
      case 2: // Category & Tags
        return true; // Optional fields
      case 3: // Pricing
        return parseFloat(values.sellingPrice) >= 0;
      case 4: // Inventory
        return true; // Optional fields
      case 5: // Images
        return true; // Optional fields
      case 6: // Variants
        return true; // Optional step
      default:
        return true;
    }
  };
  
  // Navigation between steps
  const goToNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setStep(stepNumber);
      window.scrollTo(0, 0);
    }
  };
  
  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Step summary sidebar */}
      <ProductFormStepSummary
        currentStep={step}
        steps={defaultProductFormSteps}
        onStepClick={goToStep}
        className="w-64 flex-shrink-0"
      />
      
      {/* Main form area */}
      <div className="flex-1 max-w-3xl mx-auto px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Back button (for mobile view) */}
            <div className="lg:hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </div>
            
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Basic Information</h1>
                  <p className="text-muted-foreground">
                    Provide essential details about your product
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Product Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter product name"
                              className="text-base py-6"
                            />
                          </FormControl>
                          <FormDescription>
                            A clear, specific name that helps customers find your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Product Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your product in detail"
                              className="resize-y min-h-[150px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a detailed description of your product including key features and benefits
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Product Status</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="text-base py-6">
                                <SelectValue placeholder="Select product status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-slate-100 text-slate-800">Draft</Badge>
                                  <span>Not visible to customers</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                                  <span>Visible and available for purchase</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="inactive">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800">Inactive</Badge>
                                  <span>Temporarily hidden from customers</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="archived">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Archived</Badge>
                                  <span>Permanently hidden from customers</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Control the visibility of this product in your store
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                  isNextDisabled={!watchName}
                  isPreviousDisabled={false}
                />
              </div>
            )}
            
            {/* Step 2: Category & Tags */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Category & Tags</h1>
                  <p className="text-muted-foreground">
                    Organize your product to help customers find it
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="text-base py-6">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Assign this product to a category to help customers find it
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ProductTagsInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                />
              </div>
            )}
            
            {/* Step 3: Pricing */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Pricing Information</h1>
                  <p className="text-muted-foreground">
                    Set up your product's pricing details
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Selling Price <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  {...field}
                                  type="text"
                                  inputMode="decimal"
                                  className="pl-8 text-base py-6"
                                  placeholder="0.00"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              The price customers will pay for this product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mrp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">MRP (Maximum Retail Price)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  {...field}
                                  type="text"
                                  inputMode="decimal"
                                  className="pl-8 text-base py-6"
                                  placeholder="0.00"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              The maximum retail price printed on the product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Purchase Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  {...field}
                                  type="text"
                                  inputMode="decimal"
                                  className="pl-8 text-base py-6"
                                  placeholder="0.00"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your cost to purchase or produce this product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="gst"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">GST Percentage</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="text"
                                  inputMode="decimal"
                                  className="text-base py-6"
                                  placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              GST percentage applicable to this product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                  isNextDisabled={!watchSellingPrice || watchSellingPrice === "0"}
                />
              </div>
            )}
            
            {/* Step 4: Inventory */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Inventory & Specifications</h1>
                  <p className="text-muted-foreground">
                    Manage stock levels and product details
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">SKU (Stock Keeping Unit)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="text-base py-6"
                                placeholder="Enter product SKU"
                              />
                            </FormControl>
                            <FormDescription>
                              A unique identifier for tracking your inventory
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Barcode / UPC</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="text-base py-6"
                                placeholder="Enter product barcode"
                              />
                            </FormControl>
                            <FormDescription>
                              Universal Product Code or barcode number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="inventoryQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Inventory Quantity</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                inputMode="numeric"
                                className="text-base py-6"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormDescription>
                              Number of units available for sale
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Weight (kg)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                inputMode="decimal"
                                className="text-base py-6"
                                placeholder="0.0"
                              />
                            </FormControl>
                            <FormDescription>
                              Product weight in kilograms
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Length (cm)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                inputMode="decimal"
                                className="text-base py-6"
                                placeholder="0.0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Width (cm)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                inputMode="decimal"
                                className="text-base py-6"
                                placeholder="0.0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Height (cm)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                inputMode="decimal"
                                className="text-base py-6"
                                placeholder="0.0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                />
              </div>
            )}
            
            {/* Step 5: Images */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Product Images</h1>
                  <p className="text-muted-foreground">
                    Upload high-quality photos of your product
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ProductImageUploader
                              value={field.value}
                              onChange={field.onChange}
                              featuredImage={form.watch("featuredImageUrl")}
                              onFeaturedImageChange={(url) => {
                                form.setValue("featuredImageUrl", url);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                />
              </div>
            )}
            
            {/* Step 6: Variants */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Product Variants</h1>
                  <p className="text-muted-foreground">
                    Define different versions of your product (e.g., size, color)
                  </p>
                </div>
                
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="hasVariants"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Enable Variants</FormLabel>
                            <FormDescription>
                              Create multiple versions of this product (like different colors, sizes, etc.)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {watchHasVariants ? (
                      <div className="space-y-4">
                        {/* Guide Box */}
                        <div className="rounded-md bg-primary/5 p-4 border border-primary/10">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {!productId 
                                  ? "Save this product first, then you can create variants with different colors, sizes, and other attributes."
                                  : "Click the button below to create or manage variants with different colors, sizes, and other attributes."
                                }
                              </p>
                              <Button 
                                type="button" 
                                className="mt-3"
                                onClick={() => setShowVariantManager(true)}
                                disabled={!productId}
                              >
                                {!productId ? "Save Product First" : "Manage Variants"}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Variant Manager Dialog */}
                        {showVariantManager && productId && (
                          <EnhancedVariantManager
                            product={{ id: productId, name: form.watch("name") }}
                            onClose={() => setShowVariantManager(false)}
                          />
                        )}
                        
                        {/* Show variants summary if available */}
                        {productId && variants.length > 0 ? (
                          <div className="space-y-4">
                            <div className="rounded-md bg-muted p-3">
                              <div className="font-medium mb-1">Current Variants</div>
                              <p className="text-sm text-muted-foreground">
                                You have {variants.length} variant{variants.length !== 1 ? 's' : ''} defined for this product.
                              </p>
                            </div>
                            
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Variant</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Price</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Stock</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">SKU</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {variants.slice(0, 5).map((variant: any, index: number) => (
                                    <tr key={index} className="border-t">
                                      <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                          {variant.imageUrl && (
                                            <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                                              <img 
                                                src={variant.imageUrl} 
                                                alt={`${variant.color} ${variant.size}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          )}
                                          <span>
                                            {variant.color}, {variant.size}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">{formatCurrency(variant.sellingPrice)}</td>
                                      <td className="px-4 py-2">{variant.inventoryQuantity}</td>
                                      <td className="px-4 py-2">{variant.sku || '-'}</td>
                                    </tr>
                                  ))}
                                  {variants.length > 5 && (
                                    <tr className="border-t">
                                      <td colSpan={4} className="px-4 py-2 text-center text-sm text-muted-foreground">
                                        +{variants.length - 5} more variants
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowVariantManager(true)}
                            >
                              Manage Variants
                            </Button>
                          </div>
                        ) : productId ? (
                          <div className="flex flex-col items-center justify-center p-8 border rounded-md border-dashed">
                            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
                            <p className="text-muted-foreground mb-4">No variants have been created yet</p>
                            <Button 
                              type="button"
                              onClick={() => setShowVariantManager(true)}
                            >
                              Create Variants
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Your product is configured as a single product without variants. Enable variants if you need to sell this product in multiple versions.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <ProductFormStepNav
                  currentStep={step}
                  totalSteps={totalSteps}
                  onPrevious={goToPreviousStep}
                  onNext={goToNextStep}
                  onSave={handlePartialSave}
                  isSaving={mutation.isPending}
                  isLastStep={true}
                />
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}