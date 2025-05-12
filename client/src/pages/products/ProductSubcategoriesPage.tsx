import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { Edit, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Form schema for subcategory creation/editing
const subcategoryFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().min(1, 'Parent category is required'),
  isGlobal: z.boolean().optional().default(false),
});

type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;

const ProductSubcategoriesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Define the category type
  type Category = {
    id: number;
    name: string;
    description?: string;
    vendorId?: number | null;
    parentId?: number | null;
    level?: number;
    slug?: string;
    isActive?: boolean;
    isGlobal?: boolean;
  };

  // Fetch categories data for the vendor
  const { data: vendorCategories = [] } = useQuery<Category[]>({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });
  
  // Fetch global categories
  const { data: globalCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/global-categories'],
  });
  
  // Combine vendor categories and global categories
  const categories = [...vendorCategories, ...globalCategories];
  
  // Get only main categories for parent selection
  const mainCategories = categories.filter((cat) => !cat.parentId);
  
  // Get only subcategories to display
  const subcategories = categories.filter((cat) => cat.parentId);
  
  // Form for creating/editing subcategories
  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: mainCategories.length > 0 ? mainCategories[0].id.toString() : '0',
      isGlobal: false,
    },
  });

  // Reset form when opening create dialog
  const openCreateDialog = () => {
    form.reset({
      name: '',
      description: '',
      parentId: mainCategories.length > 0 ? mainCategories[0].id.toString() : '0',
      isGlobal: false,
    });
    setIsCreateDialogOpen(true);
  };

  // Set form values when opening edit dialog
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId?.toString() || '',
      isGlobal: category.isGlobal || false,
    });
    setIsEditDialogOpen(true);
  };

  // Confirm delete dialog
  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SubcategoryFormValues) => {
      // Prepare category data
      const categoryData = {
        ...data,
        parentId: parseInt(data.parentId),
        vendorId: data.isGlobal ? null : vendorId,
        isActive: true,
      };
      
      // Create API request - use appropriate endpoint based on whether it's global
      const endpoint = data.isGlobal 
        ? '/api/global-categories' 
        : `/api/vendors/${vendorId}/product-categories`;
        
      return await apiRequest('POST', endpoint, categoryData);
    },
    onSuccess: () => {
      toast({
        title: 'Subcategory created',
        description: 'The subcategory has been created successfully.',
      });
      setIsCreateDialogOpen(false);
      // Invalidate both vendor categories and global categories
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      queryClient.invalidateQueries({ queryKey: ['/api/global-categories'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create subcategory: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SubcategoryFormValues) => {
      if (!selectedCategory) {
        throw new Error("No category selected for update");
      }
      
      // Prepare category data
      const categoryData = {
        ...data,
        parentId: parseInt(data.parentId),
        vendorId: data.isGlobal ? null : vendorId,
      };
      
      // Determine the appropriate endpoint based on whether it's a global category
      const endpoint = selectedCategory.isGlobal || data.isGlobal
        ? `/api/global-categories/${selectedCategory.id}`
        : `/api/vendors/${vendorId}/product-categories/${selectedCategory.id}`;
      
      // Update API request
      return await apiRequest('PATCH', endpoint, categoryData);
    },
    onSuccess: () => {
      toast({
        title: 'Subcategory updated',
        description: 'The subcategory has been updated successfully.',
      });
      setIsEditDialogOpen(false);
      // Invalidate both vendor categories and global categories
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      queryClient.invalidateQueries({ queryKey: ['/api/global-categories'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update subcategory: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) {
        throw new Error("No category selected for deletion");
      }
      
      // Determine the appropriate endpoint based on whether it's a global category
      const endpoint = selectedCategory.isGlobal
        ? `/api/global-categories/${selectedCategory.id}`
        : `/api/vendors/${vendorId}/product-categories/${selectedCategory.id}`;
        
      return await apiRequest('DELETE', endpoint);
    },
    onSuccess: () => {
      toast({
        title: 'Subcategory deleted',
        description: 'The subcategory has been deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      // Invalidate both vendor categories and global categories
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/product-categories`] });
      queryClient.invalidateQueries({ queryKey: ['/api/global-categories'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete subcategory: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: SubcategoryFormValues) => {
    if (isEditDialogOpen) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Get parent category name by ID
  const getParentCategoryName = (parentId: number) => {
    const parent = categories.find((cat: Category) => cat.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <DashboardLayout title="Product Subcategories">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Product Subcategories</h1>
            <p className="text-muted-foreground">
              Manage subcategories for organizing your products
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Subcategory
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
            <CardDescription>
              These subcategories will be available when adding or editing products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>List of subcategories for your store</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No subcategories found. Create your first subcategory to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  subcategories.map((category: Category) => (
                    <TableRow key={category.id}>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getParentCategoryName(category.parentId)}
                          {categories.find(c => c.id === category.parentId)?.isGlobal && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 font-medium">
                              Global
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Subcategory Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>
              Create a new subcategory for organizing your products
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subcategory name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mainCategories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                            {category.isGlobal && " (Global)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This is the main category this subcategory belongs to
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
                        placeholder="Enter subcategory description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Global Category Checkbox - Only visible for admin users */}
              {user?.role === 'admin' && (
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Global Category</FormLabel>
                        <FormDescription>
                          Make this subcategory available to all vendors on the platform
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Subcategory'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
            <DialogDescription>
              Make changes to the subcategory
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subcategory name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mainCategories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                            {category.isGlobal && " (Global)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This is the main category this subcategory belongs to
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
                        placeholder="Enter subcategory description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Global Category Checkbox - Only visible for admin users */}
              {user?.role === 'admin' && (
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Global Category</FormLabel>
                        <FormDescription>
                          Make this subcategory available to all vendors on the platform
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subcategory. Products in this subcategory will not be deleted, but they may need to be recategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ProductSubcategoriesPage;