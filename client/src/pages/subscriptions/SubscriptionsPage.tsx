import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, PlusCircle, Edit, Trash2, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency, formatSubscriptionPrice } from '@/lib/formatCurrency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

// Form validation schema for subscription plans
const planFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  description: z.string().min(10, { message: 'Description should be at least 10 characters' }),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Please enter a valid price' }),
  yearlyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Please enter a valid price' }).optional(),
  productLimit: z.string().regex(/^\d+$/, { message: 'Please enter a valid number' }),
  storageLimit: z.string().regex(/^\d+$/, { message: 'Please enter a valid number' }),
  customDomainLimit: z.string().regex(/^\d+$/, { message: 'Please enter a valid number' }),
  supportLevel: z.string(),
  trialDays: z.string().regex(/^\d+$/, { message: 'Please enter a valid number' }).default('7'),
  features: z.string().transform(val => val.split('\n').filter(Boolean)),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  currency: z.string().default('INR'),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

const SubscriptionsPage = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });

  // Mutation for delete plan
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/subscription-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      // Check if it's a 409 conflict error (plan in use)
      if (error.response?.status === 409 || error.message?.includes('in use')) {
        toast({
          title: "Cannot delete plan",
          description: "This plan is currently in use by one or more vendors. Please reassign those vendors to a different plan before deleting.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to delete plan: ${error.message}`,
          variant: "destructive",
        });
      }
      setIsDeleteDialogOpen(false);
    },
  });

  // Form setup
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      yearlyPrice: '',
      productLimit: '',
      storageLimit: '',
      customDomainLimit: '',
      supportLevel: 'email',
      trialDays: '7',
      features: [],
      isActive: true,
      isDefault: false,
      currency: 'INR',
    },
  });

  // Get selected plan for editing
  const selectedPlan = plans?.find(plan => plan.id === selectedPlanId);

  // Reset form with selected plan data
  const resetFormWithPlan = (plan: any) => {
    if (plan) {
      form.reset({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price.toString() || '',
        yearlyPrice: plan.yearlyPrice ? plan.yearlyPrice.toString() : '',
        productLimit: plan.productLimit.toString() || '',
        storageLimit: plan.storageLimit.toString() || '',
        customDomainLimit: plan.customDomainLimit.toString() || '',
        supportLevel: plan.supportLevel || 'email',
        trialDays: plan.trialDays ? plan.trialDays.toString() : '7',
        features: plan.features ? plan.features.join('\n') : '',
        isActive: plan.isActive ?? true,
        isDefault: plan.isDefault ?? false,
        currency: plan.currency || 'INR',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        price: '',
        yearlyPrice: '',
        productLimit: '',
        storageLimit: '',
        customDomainLimit: '',
        supportLevel: 'email',
        trialDays: '7',
        features: '',
        isActive: true,
        isDefault: false,
        currency: 'INR',
      });
    }
  };

  // Mutation for add/edit plan
  const planMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const planData = {
        ...data,
        price: data.price,
        yearlyPrice: data.yearlyPrice || null,
        productLimit: parseInt(data.productLimit),
        storageLimit: parseInt(data.storageLimit),
        customDomainLimit: parseInt(data.customDomainLimit),
        trialDays: parseInt(data.trialDays || '7'),
        currency: data.currency || 'INR',
      };

      if (selectedPlanId) {
        // Update existing plan
        return apiRequest('PATCH', `/api/subscription-plans/${selectedPlanId}`, planData);
      } else {
        // Create new plan
        return apiRequest('POST', '/api/subscription-plans', planData);
      }
    },
    onSuccess: () => {
      toast({
        title: selectedPlanId ? "Plan updated" : "Plan created",
        description: selectedPlanId 
          ? "The subscription plan has been updated successfully." 
          : "The subscription plan has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${selectedPlanId ? 'update' : 'create'} plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddPlan = () => {
    setSelectedPlanId(null);
    resetFormWithPlan(null);
    setIsAddDialogOpen(true);
  };

  const handleEditPlan = (id: number) => {
    setSelectedPlanId(id);
    const plan = plans?.find(p => p.id === id);
    resetFormWithPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleDeletePlan = (id: number) => {
    setSelectedPlanId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPlanId) {
      deleteMutation.mutate(selectedPlanId);
    }
  };

  const onSubmit = (data: PlanFormValues) => {
    planMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Subscription Plans" subtitle="Manage platform subscription plans for vendors">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleAddPlan}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg skeleton-text h-6 w-24 bg-gray-200 rounded"></CardTitle>
                    <div className="mt-4 h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="mt-2 h-16 w-full bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Display subscription plans
              plans?.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "overflow-hidden relative", 
                    plan.name === 'Pro' && "border-2 border-primary"
                  )}
                >
                  {plan.name === 'Pro' && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">Popular</div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-bold">
                        {formatSubscriptionPrice(parseFloat(plan.price), 'monthly')}
                      </span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Features:</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex text-sm">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 px-6 py-4 flex justify-between items-center border-t">
                    <span className="text-sm text-muted-foreground">
                      {/* Placeholder for vendor count */}
                      {plan.name === 'Free' ? '12 vendors' : 
                       plan.name === 'Basic' ? '45 vendors' : 
                       plan.name === 'Pro' ? '156 vendors' : 
                       '41 vendors'}
                    </span>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditPlan(plan.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Features comparison table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Plan Features Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Feature</th>
                      {plans?.map((plan) => (
                        <th key={plan.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Custom Domains</td>
                      {plans?.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {plan.customDomainLimit}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Products</td>
                      {plans?.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {plan.productLimit >= 10000 ? 'Unlimited' : plan.productLimit}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Storage</td>
                      {plans?.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {plan.storageLimit} GB
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Support</td>
                      {plans?.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {plan.supportLevel === 'email' && 'Email'}
                          {plan.supportLevel === 'priority_email' && 'Priority Email'}
                          {plan.supportLevel === 'phone_email' && 'Phone & Email'}
                          {plan.supportLevel === 'dedicated' && 'Dedicated'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Track and analyze subscription plan performance</CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  We're working on detailed analytics for your subscription plans. Check back soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Plan Dialog */}
      <Dialog 
        open={isAddDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPlanId ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlanId 
                ? 'Update the details of this subscription plan' 
                : 'Create a new subscription plan for vendors'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Basic, Pro, Enterprise"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the plan in a few sentences"
                    rows={3}
                    {...form.register('description')}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="price">Monthly Price (₹) *</Label>
                  <Input
                    id="price"
                    placeholder="0.00"
                    {...form.register('price')}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.price.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="yearlyPrice">Yearly Price (₹) (Optional)</Label>
                  <Input
                    id="yearlyPrice"
                    placeholder="0.00"
                    {...form.register('yearlyPrice')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty to disable yearly payment option</p>
                  {form.formState.errors.yearlyPrice && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.yearlyPrice.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="trialDays">Free Trial Days</Label>
                  <Input
                    id="trialDays"
                    placeholder="7"
                    {...form.register('trialDays')}
                  />
                  {form.formState.errors.trialDays && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.trialDays.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="supportLevel">Support Level *</Label>
                  <select
                    id="supportLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('supportLevel')}
                  >
                    <option value="email">Email Support</option>
                    <option value="priority_email">Priority Email Support</option>
                    <option value="phone_email">Phone & Email Support</option>
                    <option value="dedicated">Dedicated Support</option>
                  </select>
                  {form.formState.errors.supportLevel && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.supportLevel.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productLimit">Product Limit *</Label>
                  <Input
                    id="productLimit"
                    placeholder="e.g. 100, 1000, 10000"
                    {...form.register('productLimit')}
                  />
                  {form.formState.errors.productLimit && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.productLimit.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="storageLimit">Storage Limit (GB) *</Label>
                  <Input
                    id="storageLimit"
                    placeholder="e.g. 1, 5, 20"
                    {...form.register('storageLimit')}
                  />
                  {form.formState.errors.storageLimit && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.storageLimit.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="customDomainLimit">Custom Domain Limit *</Label>
                  <Input
                    id="customDomainLimit"
                    placeholder="e.g. 0, 1, 3"
                    {...form.register('customDomainLimit')}
                  />
                  {form.formState.errors.customDomainLimit && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.customDomainLimit.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="features">Features (one per line) *</Label>
                  <Textarea
                    id="features"
                    placeholder="e.g. 1 custom domain&#10;Up to 100 products&#10;Basic analytics"
                    rows={6}
                    {...form.register('features')}
                  />
                  {form.formState.errors.features && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.features.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register('isActive')}
                />
                <Label htmlFor="isActive">Plan is active and available to vendors</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register('isDefault')}
                />
                <Label htmlFor="isDefault">Set as default plan for new vendors</Label>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" title="Only one plan can be the default. Setting this plan as default will remove default status from any other plan." />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={planMutation.isPending}
              >
                {planMutation.isPending && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {selectedPlanId ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription plan.
              Any vendors currently on this plan will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SubscriptionsPage;
