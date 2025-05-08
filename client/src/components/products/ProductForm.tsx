import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import ProductVariantsManager from './ProductVariantsManager';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Image, X, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Validation schema for product form
const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  compareAtPrice: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  inventoryQuantity: z.string().transform(val => val === '' ? '0' : val),
  status: z.string().default('draft'),
  categoryId: z.string().optional(),
  featuredImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  hasVariants: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type ProductFormProps = {
  productId?: number;
  onSuccess?: () => void;
};

const ProductForm = ({ productId, onSuccess }: ProductFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  
  // Get vendor ID from user context
  const vendorId = user?.role === 'vendor' ? user.id : undefined;

  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });

  // Fetch product data if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });

  // Initialize form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      sku: '',
      barcode: '',
      weight: '',
      dimensions: '',
      inventoryQuantity: '0',
      status: 'draft',
      categoryId: '',
      featuredImageUrl: '',
      images: [],
      tags: [],
      hasVariants: false,
    },
  });

  // Update form values when product data is loaded
  useEffect(() => {
    if (product && productId) {
      form.reset({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        weight: product.weight?.toString() || '',
        dimensions: product.dimensions || '',
        inventoryQuantity: product.inventoryQuantity?.toString() || '0',
        status: product.status,
        categoryId: product.categoryId?.toString() || '',
        featuredImageUrl: product.featuredImageUrl || '',
        images: product.images || [],
        tags: product.tags || [],
        hasVariants: product.hasVariants || false,
      });
    }
  }, [product, productId, form]);

  // Product mutation for create/update
  const mutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const numericFields = {
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        weight: data.weight || null,
        inventoryQuantity: parseInt(data.inventoryQuantity || '0'),
      };

      const productData = {
        ...data,
        ...numericFields,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        vendorId: vendorId,
      };

      if (productId) {
        // Update existing product
        await apiRequest('PATCH', `/api/products/${productId}`, productData);
      } else {
        // Create new product
        await apiRequest('POST', '/api/products', productData);
      }
    },
    onSuccess: () => {
      toast({
        title: productId ? "Product updated" : "Product created",
        description: productId ? "The product has been updated successfully." : "The product has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
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

  // Form submission handler
  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  if (isLoadingProduct && productId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productId ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="additional">Additional Info</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your product" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Draft products are not visible in your store
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('pricing')}>
                      Next: Pricing & Inventory
                    </Button>
                  </div>
                </TabsContent>

                {/* Pricing & Inventory Tab */}
                <TabsContent value="pricing" className="space-y-6">
                  {/* Hide price fields if product has variants since pricing is per-variant */}
                  {!form.watch('hasVariants') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">$</span>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  className="pl-7"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compareAtPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compare-at Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">$</span>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  className="pl-7"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Original price for showing a discount
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Product Variants</FormLabel>
                          <FormDescription>
                            Enable if this product comes in multiple variants like different sizes or colors
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
                  
                  {form.watch('hasVariants') && (
                    <div className="mt-4 border rounded-md p-4 bg-background/50">
                      <h3 className="text-lg font-medium mb-4">Manage Product Variants</h3>
                      <ProductVariantsManager 
                        productId={productId}
                        // We would fetch these from API in a real implementation
                        initialOptions={[]}
                        initialVariants={[]}
                      />
                    </div>
                  )}
                  
                  <Separator />

                  {/* Hide basic inventory fields if product has variants */}
                  {!form.watch('hasVariants') && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter SKU" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="barcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Barcode (ISBN, UPC, GTIN, etc.)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter barcode" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="inventoryQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inventory Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="1" 
                                placeholder="0"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="flex justify-between space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                      Back: Basic Info
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('images')}>
                      Next: Images
                    </Button>
                  </div>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="featuredImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Image URL</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 gap-4">
                            <Input placeholder="Enter image URL" {...field} />
                            {field.value && (
                              <div className="relative w-full h-64 bg-neutral-100 rounded-md overflow-hidden">
                                <img 
                                  src={field.value} 
                                  alt="Featured product" 
                                  className="w-full h-full object-contain" 
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => field.onChange('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the URL for the main product image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('pricing')}>
                      Back: Pricing & Inventory
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('additional')}>
                      Next: Additional Info
                    </Button>
                  </div>
                </TabsContent>

                {/* Additional Info Tab */}
                <TabsContent value="additional" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (in kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="0.00"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions (LxWxH)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 10x5x2 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('images')}>
                      Back: Images
                    </Button>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {productId ? 'Update Product' : 'Create Product'}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
