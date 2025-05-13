import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, ChevronRight, Loader2, Plus, SaveIcon, Tag, XCircle } from 'lucide-react';
import { productFormSchema } from '@/lib/validations/product';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { ProductVariant } from '@shared/schema';
import ProductImagesUploader from '@/components/products/ProductImagesUploader';
import MatrixVariantManager from '@/components/products/MatrixVariantManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Define the form values type based on the schema
type ProductFormValues = z.infer<typeof productFormSchema>;

// Props type for the component
type ProductFormProps = {
  productId?: number;
  onSuccess?: () => void;
};

// ProductForm component
const NewProductForm = ({ productId, onSuccess }: ProductFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, impersonationStatus } = useAuth();
  const [activeSection, setActiveSection] = useState<string[]>(['basic', 'pricing', 'images']);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [lastSavedSection, setLastSavedSection] = useState<string>('');
  
  // Get vendor ID from user context
  const vendorId = user?.vendorId || 
    (user?.role === 'vendor' ? user.id : undefined);

  // Define category type
  type Category = {
    id: number;
    name: string;
    description?: string;
    vendorId: number;
    parentId?: number | null;
    level?: number;
    slug?: string;
    isActive?: boolean;
  };

  // Fetch product categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });

  // Fetch product data if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });
  
  // Fetch product variants if editing
  const { data: productVariants = [] } = useQuery<ProductVariant[]>({
    queryKey: ['/api/products', productId, 'variants'],
    enabled: !!productId,
  });

  // Initialize form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      gst: '',
      sku: '',
      barcode: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      inventoryQuantity: '0',
      status: 'draft',
      categoryId: '',
      featuredImageUrl: '',
      images: [],
      tags: [],
    },
  });

  // Set form values when product data is loaded
  useEffect(() => {
    if (product && productId) {
      // Find the main category
      const mainCategoryId = product.categoryId ? 
        categories?.find(cat => 
          cat.id === product.categoryId && cat.parentId
        )?.parentId?.toString() || '' : '';
      
      // Reset form with product data
      form.reset({
        name: product.name || '',
        description: product.description || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        purchasePrice: product.purchasePrice?.toString() || '',
        mrp: product.mrp?.toString() || '',
        gst: product.gst?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        weight: product.weight?.toString() || '',
        length: product.length?.toString() || (product.dimensions ? product.dimensions.split('x')[0] || '' : ''),
        width: product.width?.toString() || (product.dimensions ? product.dimensions.split('x')[1] || '' : ''),
        height: product.height?.toString() || (product.dimensions ? product.dimensions.split('x')[2] || '' : ''),
        inventoryQuantity: product.inventoryQuantity?.toString() || '0',
        status: product.status,
        mainCategoryId: mainCategoryId,
        categoryId: product.categoryId?.toString() || '',
        featuredImageUrl: product.featuredImageUrl || '',
        images: product.images || [],
        tags: product.tags || [],
      });
    }
  }, [product, productId, form, categories]);
  
  // Set variants when productVariants data is loaded
  useEffect(() => {
    if (productVariants && productVariants.length > 0) {
      setVariants(productVariants);
    }
  }, [productVariants]);

  // Toggle section visibility
  const toggleSection = (section: string) => {
    setActiveSection(prevSections => 
      prevSections.includes(section)
        ? prevSections.filter(s => s !== section)
        : [...prevSections, section]
    );
  };

  // Check if section is active
  const isSectionActive = (section: string) => activeSection.includes(section);

  // Product mutation for create/update
  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Convert string fields to numbers or null
      const numericFields = {
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : 0,
        mrp: data.mrp ? parseFloat(data.mrp) : null,
        gst: data.gst ? parseFloat(data.gst) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        length: data.length ? parseFloat(data.length) : null,
        width: data.width ? parseFloat(data.width) : null,
        height: data.height ? parseFloat(data.height) : null,
        inventoryQuantity: parseInt(data.inventoryQuantity || '0'),
      };

      const productData = {
        ...data,
        ...numericFields,
        categoryId: data.categoryId || null,
        featuredImageUrl: data.featuredImageUrl || null,
        barcode: data.barcode || null,
        sku: data.sku || null,
        vendorId: vendorId // Add the vendorId to the product data
      };
      
      let createdProductId = productId;
      
      if (productId) {
        // Update existing product
        await apiRequest('PATCH', `/api/products/${productId}`, productData);
      } else {
        // Create new product
        const response = await apiRequest('POST', '/api/products', productData);
        const responseData = await response.json();
        createdProductId = responseData.id;
      }
      
      return createdProductId;
    },
    onSuccess: (newProductId) => {
      // Get status to determine if this is a draft save
      const currentStatus = form.getValues().status;
      const isDraft = currentStatus === 'draft';
      
      toast({
        title: isDraft 
          ? (productId ? "Draft updated" : "Product saved as draft") 
          : (productId ? "Product updated" : "Product created"),
        description: isDraft
          ? (productId ? "Your changes have been saved." : "The product has been saved as draft.")
          : (productId ? "Your changes have been published." : "The product has been published."),
      });
      
      // Save variants if we have a product ID
      if (newProductId && variants.length > 0) {
        variantsMutation.mutate({ productId: newProductId, variants });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId, 'variants'] });
      } else if (newProductId) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', newProductId] });
        queryClient.invalidateQueries({ queryKey: ['/api/products', newProductId, 'variants'] });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${productId ? 'update' : 'create'} product: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Variants mutation for save/update
  const variantsMutation = useMutation({
    mutationFn: async ({ productId, variants }: { productId: number, variants: ProductVariant[] }) => {
      // Ensure all variants have the correct productId
      const preparedVariants = variants.map(variant => ({
        ...variant,
        productId
      }));
      
      await apiRequest('POST', `/api/products/${productId}/variants`, preparedVariants);
    },
    onSuccess: () => {
      toast({
        title: "Variants saved successfully",
        description: `${variants.length} variants have been updated.`,
      });
      
      // Refresh variants data
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId, 'variants'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving variants",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Section save mutation - for saving individual sections
  const sectionSaveMutation = useMutation({
    mutationFn: async (section: string) => {
      if (!productId) {
        // Create a new product if this is a new product
        const formData = form.getValues();
        
        // Convert string fields to numbers or null
        const numericFields = {
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          gst: formData.gst ? parseFloat(formData.gst) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          inventoryQuantity: parseInt(formData.inventoryQuantity || '0'),
        };
        
        const productData = {
          ...formData,
          ...numericFields,
          categoryId: formData.categoryId || null,
          featuredImageUrl: formData.featuredImageUrl || null,
          barcode: formData.barcode || null,
          sku: formData.sku || null,
          vendorId: vendorId, // Add the vendorId to the product data
          status: 'draft'
        };
        
        // Create the new product first
        const response = await apiRequest('POST', '/api/products', productData);
        const newProduct = await response.json();
        return { productId: newProduct.id, section };
      }
      
      // If editing existing product, only update the relevant section
      const formData = form.getValues();
      let sectionData: any = { vendorId };
      
      switch(section) {
        case 'basic':
          sectionData = {
            ...sectionData,
            name: formData.name,
            description: formData.description,
            status: formData.status,
            categoryId: formData.categoryId || null,
          };
          break;
        case 'pricing':
          sectionData = {
            ...sectionData,
            purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
            sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
            mrp: formData.mrp ? parseFloat(formData.mrp) : null,
            gst: formData.gst ? parseFloat(formData.gst) : null,
            sku: formData.sku,
            barcode: formData.barcode,
            inventoryQuantity: parseInt(formData.inventoryQuantity || '0'),
          };
          break;
        case 'dimensions':
          sectionData = {
            ...sectionData,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            length: formData.length ? parseFloat(formData.length) : null,
            width: formData.width ? parseFloat(formData.width) : null,
            height: formData.height ? parseFloat(formData.height) : null,
          };
          break;
        case 'media':
          sectionData = {
            ...sectionData,
            featuredImageUrl: formData.featuredImageUrl,
            images: formData.images,
          };
          break;
        case 'variants':
          // Variants are handled by the variantsMutation
          return { productId, section };
        case 'seo':
          sectionData = {
            ...sectionData,
            tags: formData.tags,
          };
          break;
      }
      
      // Update the product with section data
      await apiRequest('PATCH', `/api/products/${productId}`, sectionData);
      return { productId, section };
    },
    onSuccess: (data) => {
      const { section, productId: savedProductId } = data;
      
      // Update UI with feedback
      toast({
        title: `${section.charAt(0).toUpperCase() + section.slice(1)} section saved`,
        description: "Your changes have been saved.",
      });
      
      // Set the last saved section
      setLastSavedSection(section);
      
      // Invalidate cached product data
      queryClient.invalidateQueries({ queryKey: ['/api/products', savedProductId] });
    },
    onError: (error) => {
      toast({
        title: "Error saving section",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };
  
  // Save as draft handler
  const saveAsDraft = () => {
    const currentValues = form.getValues();
    currentValues.status = 'draft';
    
    const saveDraftMutation = async () => {
      try {
        const result = await mutation.mutateAsync(currentValues);
        
        // Also save variants if needed
        if (result && variants.length > 0) {
          try {
            await variantsMutation.mutateAsync({ 
              productId: result, 
              variants 
            });
            
            // Refresh variants data
            queryClient.invalidateQueries({ 
              queryKey: ['/api/products', result, 'variants'] 
            });
          } catch (variantError) {
            console.error("Error saving variants with draft:", variantError);
            toast({
              title: "Warning",
              description: "Product saved as draft but variants couldn't be saved.",
              variant: "destructive",
            });
          }
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    };
    
    saveDraftMutation();
  };

  // Loading state
  if (isLoadingProduct && productId) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-24">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Floating action button */}
          <div className="fixed bottom-6 right-6 z-30 flex gap-2">
            <Button
              type="button"
              onClick={saveAsDraft}
              variant="outline"
              size="lg"
              className="rounded-full shadow-lg bg-white border-gray-300 hover:bg-gray-100"
            >
              <SaveIcon className="h-5 w-5 mr-2" />
              Save Draft
            </Button>
            
            <Button
              type="submit"
              size="lg"
              className="rounded-full shadow-lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Check className="mr-2 h-5 w-5" />
              )}
              {productId ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
          
          {/* Product Basic Info Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer border-b"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                {form.formState.errors.name || form.formState.errors.description || form.formState.errors.categoryId ? (
                  <Badge variant="destructive" className="h-6">Required Fields Missing</Badge>
                ) : null}
              </div>
              {isSectionActive('basic') ? (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {isSectionActive('basic') && (
              <div className="p-6 bg-gray-50/50">
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    onClick={() => sectionSaveMutation.mutate('basic')}
                    disabled={sectionSaveMutation.isPending}
                  >
                    {sectionSaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Basic Info
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Product Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter product name" 
                              className="text-base py-6" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product" 
                              className="min-h-[150px] text-base" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A detailed description will help customers understand your product better.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-base py-6">
                                <SelectValue placeholder="Select product status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-gray-100">Draft</Badge>
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Category <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger className="text-base py-6">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map(category => (
                                <SelectItem
                                  key={category.id} 
                                  value={category.id.toString()}
                                >
                                  <div className="flex items-center gap-2">
                                    {category.name}
                                    {category.vendorId === 0 && (
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Global</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the category that best fits your product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Pricing and Inventory Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer border-b"
              onClick={() => toggleSection('pricing')}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Pricing & Inventory</h2>
                {form.formState.errors.sellingPrice || form.formState.errors.mrp || form.formState.errors.inventoryQuantity ? (
                  <Badge variant="destructive" className="h-6">Required Fields Missing</Badge>
                ) : null}
              </div>
              {isSectionActive('pricing') ? (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {isSectionActive('pricing') && (
              <div className="p-6 bg-gray-50/50">
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    onClick={() => sectionSaveMutation.mutate('pricing')}
                    disabled={sectionSaveMutation.isPending}
                  >
                    {sectionSaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Pricing & Inventory
                  </Button>
                </div>
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-md border shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Selling Price <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="pl-8 text-base py-6" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              The price customers will pay
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
                                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="pl-8 text-base py-6" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Original price before discounts
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
                                <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="pl-8 text-base py-6" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your cost to purchase this item
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
                            <FormLabel className="text-base font-medium">GST (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  className="text-base py-6" 
                                  {...field} 
                                />
                                <span className="absolute right-3 top-3 text-gray-500">%</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              GST percentage applicable on this product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-md border shadow-sm">
                    <h3 className="text-lg font-medium mb-4">Inventory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">SKU</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter SKU code" 
                                className="text-base py-6" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Stock Keeping Unit (unique identifier)
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
                            <FormLabel className="text-base font-medium">Barcode</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter barcode" 
                                className="text-base py-6" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              UPC, ISBN, EAN or GTIN
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="inventoryQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Stock Quantity <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="text-base py-6" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Number of units in stock
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-md border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Shipping</h3>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => sectionSaveMutation.mutate('dimensions')}
                        disabled={sectionSaveMutation.isPending}
                      >
                        {sectionSaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Dimensions
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Weight</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="text-base py-6 pr-12" 
                                  {...field} 
                                />
                                <span className="absolute right-3 top-3 text-gray-500">kg</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Length</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="text-base py-6 pr-12" 
                                  {...field} 
                                />
                                <span className="absolute right-3 top-3 text-gray-500">cm</span>
                              </div>
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
                            <FormLabel className="text-base font-medium">Width</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="text-base py-6 pr-12" 
                                  {...field} 
                                />
                                <span className="absolute right-3 top-3 text-gray-500">cm</span>
                              </div>
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
                            <FormLabel className="text-base font-medium">Height</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="text-base py-6 pr-12" 
                                  {...field} 
                                />
                                <span className="absolute right-3 top-3 text-gray-500">cm</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Images Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer border-b"
              onClick={() => toggleSection('images')}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Product Images</h2>
              </div>
              {isSectionActive('images') ? (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {isSectionActive('images') && (
              <div className="p-6 bg-gray-50/50">
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    onClick={() => sectionSaveMutation.mutate('media')}
                    disabled={sectionSaveMutation.isPending}
                  >
                    {sectionSaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Images
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Product Images</FormLabel>
                      <FormControl>
                        <div className="bg-white p-6 rounded-md border">
                          <ProductImagesUploader
                            images={field.value || []}
                            onChange={(newImages) => {
                              field.onChange(newImages);
                              // Update featured image
                              if (newImages.length > 0) {
                                form.setValue('featuredImageUrl', newImages[0]);
                              } else {
                                form.setValue('featuredImageUrl', '');
                              }
                            }}
                            endpoint="upload/product-image"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload high-quality images of your product. The first image will be used as the featured image.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* Variants Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer border-b"
              onClick={() => toggleSection('variants')}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Product Variants</h2>
                <Badge className="h-6">{variants.length} Variants</Badge>
              </div>
              {isSectionActive('variants') ? (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {isSectionActive('variants') && (
              <div className="p-6 bg-gray-50/50">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-md border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Manage Variants</h3>
                      {variants.length > 0 && (
                        <Button
                          type="button"
                          onClick={() => {
                            if (productId) {
                              variantsMutation.mutate({ productId, variants });
                            } else {
                              // For new products, save the basic info first to get a product ID
                              sectionSaveMutation.mutate('variants');
                            }
                          }}
                          disabled={variantsMutation.isPending || sectionSaveMutation.isPending}
                          className="ml-auto"
                        >
                          {(variantsMutation.isPending || sectionSaveMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Variants
                        </Button>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-muted-foreground">
                        Create different variants of your product by combining attributes like size, color, and material.
                      </p>
                    </div>
                    
                    <MatrixVariantManager 
                      productId={productId}
                      variants={variants}
                      onChange={setVariants}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* SEO Information Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer border-b"
              onClick={() => toggleSection('seo')}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">SEO Information</h2>
              </div>
              {isSectionActive('seo') ? (
                <ChevronDown className="h-6 w-6 text-gray-500" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-500" />
              )}
            </div>
            
            {isSectionActive('seo') && (
              <div className="p-6 bg-gray-50/50">
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    onClick={() => sectionSaveMutation.mutate('seo')}
                    disabled={sectionSaveMutation.isPending}
                  >
                    {sectionSaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save SEO Info
                  </Button>
                </div>
                <div className="bg-white p-6 rounded-md border shadow-sm">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Tags</FormLabel>
                        <div className="flex flex-wrap gap-2 p-4 border rounded-md bg-white">
                          {field.value?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="py-2 px-3 gap-2">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <XCircle 
                                className="h-3 w-3 ml-1 cursor-pointer" 
                                onClick={() => {
                                  const newTags = [...field.value || []];
                                  newTags.splice(index, 1);
                                  field.onChange(newTags);
                                }}
                              />
                            </Badge>
                          ))}
                          <div className="flex-1 min-w-[200px]">
                            <Input
                              placeholder="Add a tag and press Enter"
                              className="border-0 focus-visible:ring-0 text-base py-2"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const value = input.value.trim();
                                  if (value && (!field.value || !field.value.includes(value))) {
                                    field.onChange([...field.value || [], value]);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        <FormDescription>
                          Add tags to improve product discoverability in search. Press Enter to add a tag.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewProductForm;