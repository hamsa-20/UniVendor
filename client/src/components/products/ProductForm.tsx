import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, AlertCircle, Image as ImageIcon, X, Plus, Tag, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  purchasePrice: z.number().min(0).optional().nullable(),
  sellingPrice: z.number().min(0, "Selling price is required"),
  mrp: z.number().min(0).optional().nullable(),
  gst: z.number().min(0).max(100).optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  dimensions: z.object({
    length: z.number().min(0).optional().nullable(),
    width: z.number().min(0).optional().nullable(),
    height: z.number().min(0).optional().nullable(),
  }).optional().nullable(),
  inventoryQuantity: z.number().min(0).optional().nullable(),
  status: z.string().optional().default("active"),
  categoryId: z.number().optional().nullable(),
  featuredImageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: any;
  isEditing?: boolean;
}

const ProductForm = ({ product, isEditing = false }: ProductFormProps) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [tag, setTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user } = useAuth() || {};
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      purchasePrice: product?.purchasePrice || null,
      sellingPrice: product?.sellingPrice || 0,
      mrp: product?.mrp || null,
      gst: product?.gst || null,
      sku: product?.sku || null,
      barcode: product?.barcode || null,
      weight: product?.weight || null,
      dimensions: {
        length: product?.dimensions?.length || null,
        width: product?.dimensions?.width || null,
        height: product?.dimensions?.height || null,
      },
      inventoryQuantity: product?.inventoryQuantity || 0,
      status: product?.status || "active",
      categoryId: product?.categoryId || null,
      featuredImageUrl: product?.featuredImageUrl || null,
      images: product?.images || [],
      tags: product?.tags || [],
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/product-categories"],
    queryFn: () => fetch("/api/product-categories").then(res => res.json()),
    refetchOnWindowFocus: false,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("PUT", `/api/products/${product.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await updateProductMutation.mutateAsync(values);
        
        toast({
          title: activeSection ? `${activeSection} saved` : "Product updated",
          description: activeSection 
            ? `${activeSection} information has been saved.` 
            : "The product has been updated successfully.",
        });
      } else {
        await createProductMutation.mutateAsync(values);
        
        toast({
          title: activeSection ? `${activeSection} saved` : "Product created",
          description: activeSection 
            ? `${activeSection} information has been saved.` 
            : "The product has been created successfully.",
        });
      }
      
      // Reset active section after successful save
      setActiveSection(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (url: string) => {
    const currentImages = form.getValues("images") || [];
    const updatedImages = currentImages.filter(image => image !== url);
    form.setValue("images", updatedImages);
  };

  const removeFeaturedImage = () => {
    form.setValue("featuredImageUrl", null);
  };
  
  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/s3/upload/product-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      form.setValue("featuredImageUrl", data.url);
      toast({
        title: "Image uploaded",
        description: "Featured image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const uploadAdditionalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/s3/upload/product-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, data.url]);
      toast({
        title: "Image uploaded",
        description: "Additional image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (!tag) return;
    
    const currentTags = form.getValues("tags") || [];
    if (currentTags.includes(tag)) {
      setTag("");
      return;
    }
    
    form.setValue("tags", [...currentTags, tag]);
    setTag("");
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags") || [];
    const updatedTags = currentTags.filter((_, i) => i !== index);
    form.setValue("tags", updatedTags);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="category">Categorization</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the basic details of your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive name for your product.
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter product description" 
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of your product, including features and benefits.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Product Status
                          </FormLabel>
                          <FormDescription>
                            Active products are visible in your store.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "active"}
                            onCheckedChange={(checked) => {
                              field.onChange(checked ? "active" : "inactive");
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="button" onClick={() => setActiveTab("pricing")}>
                  Next: Pricing
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                  <CardDescription>Configure your product's pricing details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            The price you're selling this product for.
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
                          <FormLabel>MRP (Maximum Retail Price)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0.00" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            The recommended retail price before any discounts.
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
                          <FormLabel>Purchase Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0.00" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            The price you paid to purchase or produce this item.
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
                          <FormLabel>GST Percentage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            The applicable GST percentage for this product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  Previous: Basic Info
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Pricing");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("inventory")}>
                    Next: Inventory
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>Configure stock and inventory details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="inventoryQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value ? parseInt(e.target.value) : null);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The number of items in stock.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter SKU" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for your product.
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
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter barcode" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            The barcode number (EAN, UPC, etc.) for your product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (in grams)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The weight of your product in grams.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-base">Dimensions (in cm)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="dimensions.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dimensions.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dimensions.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value ? parseFloat(e.target.value) : null);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("pricing")}>
                  Previous: Pricing
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Inventory");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("category")}>
                    Next: Categorization
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="category" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorization</CardTitle>
                  <CardDescription>Organize your product with categories and tags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value) || null)} 
                          defaultValue={field.value ? field.value.toString() : ""}
                          value={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">None</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign this product to a category to help customers find it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.watch("tags")?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="py-1.5">
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                            onClick={() => removeTag(index)}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        onClick={addTag}
                        type="button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Press Enter or click Add to add a tag. Tags help customers find your products.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("inventory")}>
                  Previous: Inventory
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Categorization");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("media")}>
                    Next: Media
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                  <CardDescription>Add images for your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Featured Image</Label>
                    <div className="border rounded-md p-4">
                      {form.watch("featuredImageUrl") ? (
                        <div className="relative group">
                          <AspectRatio ratio={16 / 9}>
                            <img
                              src={form.watch("featuredImageUrl")}
                              alt="Featured product image"
                              className="rounded-md object-cover w-full h-full"
                            />
                          </AspectRatio>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={removeFeaturedImage}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-md border-muted-foreground/25">
                          <ImageIcon className="h-12 w-12 mb-2 text-muted-foreground/50" />
                          <p className="text-muted-foreground mb-2">No featured image</p>
                          <input
                            type="file"
                            id="featuredImage"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadFeaturedImage}
                          />
                          <Button 
                            variant="outline" 
                            className="mt-2" 
                            type="button"
                            onClick={() => document.getElementById('featuredImage')?.click()}
                          >
                            Upload Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Label>Additional Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <div 
                        className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/40 transition-colors"
                        onClick={() => document.getElementById('additionalImage')?.click()}
                      >
                        <input
                          type="file"
                          id="additionalImage"
                          accept="image/*"
                          className="hidden"
                          onChange={uploadAdditionalImage}
                        />
                        <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground/50" />
                        <span className="text-xs text-center">Add Image</span>
                      </div>
                      
                      {form.watch("images")?.map((image, index) => (
                        <div key={index} className="aspect-square relative group">
                          <img 
                            src={image} 
                            alt={`Product image ${index + 1}`} 
                            className="w-full h-full object-cover rounded-md" 
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeImage(image)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add up to 8 additional images to showcase your product from different angles.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("category")}>
                  Previous: Categorization
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Media");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("attributes")}>
                    Next: Attributes
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="variants" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>Configure variants of this product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <Package className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                      <h3 className="text-lg font-medium">No Variants Created Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        You can create variants like different sizes and colors after saving the product.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("media")}>
                  Previous: Media
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Variants");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("attributes")}>
                    Next: Attributes
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="attributes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Attributes</CardTitle>
                  <CardDescription>
                    Define product-specific attributes for better organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <Tag className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                      <h3 className="text-lg font-medium">No Attributes Defined</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        You can define product-specific attributes like color, size, material, etc.
                        in the Variants tab after saving the product.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("variants")}>
                  Previous: Variants
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={form.handleSubmit((data) => {
                      setActiveSection("Attributes");
                      onSubmit(data);
                    })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? "Update Product" : "Create Product"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;