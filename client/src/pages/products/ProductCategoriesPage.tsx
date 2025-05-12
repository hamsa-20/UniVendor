import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderTree, Search, Pencil, Trash2, AlertCircle, Package, Image, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import S3FileUpload from '@/components/common/S3FileUpload';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Category = {
  id: number;
  name: string;
  description?: string;
  vendorId?: number | null;
  parentId?: number | null;
  level?: number;
  productCount?: number;
  imageUrl?: string | null;
  slug?: string | null;
  isGlobal?: boolean;
};

// Helper function to generate a slug from a string
const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with dashes
    .replace(/[^\w\-]+/g, '')       // Remove all non-word characters
    .replace(/\-\-+/g, '-')         // Replace multiple dashes with single dash
    .replace(/^-+/, '')             // Trim dash from start
    .replace(/-+$/, '');            // Trim dash from end
};

const ProductCategoriesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    parentId: null as number | null,
    imageUrl: '' as string | null,
    slug: '' as string | null,
    isGlobal: false,
  });

  const vendorId = user?.role === 'vendor' ? user.id : undefined;

  // Fetch vendor-specific categories
  const { data: vendorCategories = [], isLoading: isLoadingVendorCategories } = useQuery<Category[]>({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });
  
  // Fetch global categories (available to all)
  const { data: globalCategories = [], isLoading: isLoadingGlobalCategories } = useQuery<Category[]>({
    queryKey: [`/api/global-product-categories`],
  });
  
  // Combine vendor and global categories
  const categories = useMemo(() => {
    return [...vendorCategories, ...globalCategories];
  }, [vendorCategories, globalCategories]);
  
  const isLoading = isLoadingVendorCategories || isLoadingGlobalCategories;

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description: string; 
      parentId: number | null;
      imageUrl: string | null;
      slug: string | null;
      isGlobal?: boolean;
      vendorId?: number | null;
    }) => {
      // If it has a parent, set level to 2, otherwise 1
      const level = data.parentId ? 2 : 1;
      
      // Ensure we have a slug if one wasn't provided
      const slug = data.slug || generateSlug(data.name);
      
      // Determine if this is a global category
      const isGlobal = !!data.isGlobal;
      
      // For global categories (admin only), don't set a vendorId
      // For vendor categories, use the current vendorId
      const vendorIdToUse = isGlobal ? null : vendorId;
      
      return apiRequest('POST', '/api/product-categories', {
        ...data,
        slug,
        vendorId: vendorIdToUse,
        level,
        isGlobal,
      });
    },
    onSuccess: () => {
      // Invalidate queries for both vendor-specific and global categories
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/global-product-categories`] });
      
      setIsAddCategoryOpen(false);
      // Reset form completely, including isGlobal
      setCategoryFormData({ 
        name: '', 
        description: '', 
        parentId: null, 
        imageUrl: null, 
        slug: null,
        isGlobal: false 
      });
      
      toast({
        title: 'Category created',
        description: 'Category has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: { 
        name: string; 
        description: string; 
        parentId: number | null;
        imageUrl: string | null;
        slug: string | null;
        isGlobal?: boolean;
        vendorId?: number | null;
      } 
    }) => {
      // If it has a parent, set level to 2, otherwise 1
      const level = data.parentId ? 2 : 1;
      
      // Ensure we have a slug if one wasn't provided
      const slug = data.slug || generateSlug(data.name);
      
      // Determine if this is a global category
      const isGlobal = !!data.isGlobal;
      
      // For global categories (admin only), don't set a vendorId
      // For vendor categories, use the current vendorId
      const vendorIdToUse = isGlobal ? null : vendorId;
      
      return apiRequest('PATCH', `/api/product-categories/${id}`, {
        ...data,
        slug,
        level,
        isGlobal,
        vendorId: vendorIdToUse,
      });
    },
    onSuccess: () => {
      // Invalidate queries for both vendor-specific and global categories
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/global-product-categories`] });
      
      setIsAddCategoryOpen(false);
      setSelectedCategory(null);
      // Reset form completely, including isGlobal
      setCategoryFormData({ 
        name: '', 
        description: '', 
        parentId: null, 
        imageUrl: null, 
        slug: null,
        isGlobal: false 
      });
      
      toast({
        title: 'Category updated',
        description: 'Category has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/product-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: 'Category deleted',
        description: 'Category has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter categories based on search query
  const filteredCategories = categories?.filter((category: Category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate slug from name
  useEffect(() => {
    if (categoryFormData.name) {
      const slug = generateSlug(categoryFormData.name);
      setCategoryFormData(prev => ({ ...prev, slug }));
    }
  }, [categoryFormData.name]);

  // Handle image upload
  const handleImageUploaded = (url: string) => {
    setCategoryFormData(prev => ({ ...prev, imageUrl: url }));
    toast({
      title: 'Image uploaded',
      description: 'Category image has been uploaded successfully',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    // Ensure slug is set
    const submissionData = {
      ...categoryFormData,
      slug: categoryFormData.slug || generateSlug(categoryFormData.name),
    };

    if (selectedCategory) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        data: submissionData,
      });
    } else {
      addCategoryMutation.mutate(submissionData);
    }
  };

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || null,
      imageUrl: category.imageUrl || null,
      slug: category.slug || generateSlug(category.name),
      isGlobal: category.isGlobal || false,
    });
    setIsAddCategoryOpen(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle view products in category
  const handleViewProducts = (categoryId: number) => {
    navigate(`/products?category=${categoryId}`);
  };

  return (
    <DashboardLayout title="Product Categories" subtitle="Manage your product categories">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/products">
            <Button variant="outline" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
        <Button onClick={() => {
          setSelectedCategory(null);
          setCategoryFormData({ name: '', description: '', parentId: null, imageUrl: null, slug: null });
          setIsAddCategoryOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Category Form Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Update your category details' : 'Create a new category for your products'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="required">Name</Label>
                <Input
                  id="name"
                  placeholder="Category name"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Category description (optional)"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parent">Parent Category</Label>
                <Select
                  value={categoryFormData.parentId?.toString() || ""}
                  onValueChange={(value) => setCategoryFormData({ 
                    ...categoryFormData, 
                    parentId: value ? parseInt(value) : null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (top-level category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent (top-level category)</SelectItem>
                    {filteredCategories?.filter((cat: Category) => 
                      // Only show top-level categories (level 1 or undefined)
                      (cat.level === 1 || cat.level === undefined) && 
                      // Don't show the category itself as a potential parent when editing
                      (!selectedCategory || cat.id !== selectedCategory.id)
                    ).map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a parent to make this a subcategory
                </p>
              </div>
              
              {/* Category image upload section */}
              <div className="grid gap-2">
                <Label htmlFor="image">Category Image</Label>
                {categoryFormData.imageUrl ? (
                  <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden mb-2">
                    <img
                      src={categoryFormData.imageUrl}
                      alt={categoryFormData.name || "Category image"}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setCategoryFormData({ ...categoryFormData, imageUrl: null })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
                    <Image className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload an image for this category
                    </p>
                    <S3FileUpload
                      onSuccess={handleImageUploaded}
                      endpoint="product-image"
                      acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                    >
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </S3FileUpload>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 800x600px. Max size: 5MB.
                </p>
              </div>

              {/* Slug field - autogenerated but can be edited */}
              <div className="grid gap-2">
                <Label htmlFor="slug">SEO-Friendly URL</Label>
                <Input
                  id="slug"
                  placeholder="category-slug"
                  value={categoryFormData.slug || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name. Edit if needed for better SEO.
                </p>
              </div>
              
              {/* Global category option (only for super admin) */}
              {user?.role === 'admin' && (
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isGlobal"
                      checked={categoryFormData.isGlobal}
                      onCheckedChange={(checked) => setCategoryFormData({ 
                        ...categoryFormData, 
                        isGlobal: !!checked,
                        // If global, remove vendorId
                        vendorId: checked ? null : vendorId
                      })}
                    />
                    <Label htmlFor="isGlobal" className="font-medium">
                      Global Category
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full">Admin Only</span>
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Global categories are available to all vendors in the platform and will display on all storefronts.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {(addCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                {selectedCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}".
              {selectedCategory?.productCount ? (
                <div className="mt-2 flex items-center text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>This category contains {selectedCategory.productCount} products. They will not be deleted but will no longer be categorized.</span>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCategory && deleteCategoryMutation.mutate(selectedCategory.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCategoryMutation.isPending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Categories Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          </CardContent>
        </Card>
      ) : filteredCategories?.length ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* First render top-level categories */}
                {filteredCategories
                  ?.filter((category: Category) => !category.parentId)
                  .map((category: Category) => (
                    <React.Fragment key={category.id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {category.name}
                            {category.isGlobal && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                Global
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{category.description || '—'}</TableCell>
                        <TableCell>
                          {category.imageUrl ? (
                            <div className="h-10 w-10 bg-muted rounded-md overflow-hidden">
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto" 
                            onClick={() => handleViewProducts(category.id)}
                          >
                            {category.productCount || 0} products
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Render subcategories right after their parent */}
                      {filteredCategories
                        ?.filter((subcat: Category) => subcat.parentId === category.id)
                        .map((subcategory: Category) => (
                          <TableRow key={subcategory.id} className="bg-muted/30">
                            <TableCell className="font-medium pl-8">
                              <div className="flex items-center">
                                <div className="w-4 border-l-2 border-b-2 h-4 border-muted-foreground/30 mr-2"></div>
                                <div className="flex items-center gap-2">
                                  {subcategory.name}
                                  {subcategory.isGlobal && (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                      Global
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{subcategory.description || '—'}</TableCell>
                            <TableCell>
                              {subcategory.imageUrl ? (
                                <div className="h-10 w-10 bg-muted rounded-md overflow-hidden">
                                  <img
                                    src={subcategory.imageUrl}
                                    alt={subcategory.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                  <Image className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto" 
                                onClick={() => handleViewProducts(subcategory.id)}
                              >
                                {subcategory.productCount || 0} products
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(subcategory)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(subcategory)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <FolderTree className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start organizing your products by creating categories.
            </p>
            <Button onClick={() => {
              setSelectedCategory(null);
              setCategoryFormData({ name: '', description: '', parentId: null, imageUrl: null, slug: null });
              setIsAddCategoryOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default ProductCategoriesPage;