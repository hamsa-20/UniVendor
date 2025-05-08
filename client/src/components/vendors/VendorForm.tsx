import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
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
import { Loader2 } from 'lucide-react';

// Validation schema for vendor form
const vendorFormSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  userId: z.number().optional(),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  subscriptionPlanId: z.number().optional(),
  subdomainName: z.string().min(3, 'Subdomain must be at least 3 characters').optional(),
  createSubdomain: z.boolean().default(true),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

type VendorFormProps = {
  vendorId?: number;
  onSuccess?: () => void;
};

const VendorForm = ({ vendorId, onSuccess }: VendorFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Fetch subscription plans
  const { data: subscriptionPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });

  // Fetch vendor data if editing
  const { data: vendor, isLoading: isLoadingVendor } = useQuery({
    queryKey: ['/api/vendors', vendorId],
    enabled: !!vendorId,
  });

  // Initialize form
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      companyName: '',
      description: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      createSubdomain: true,
      subdomainName: '',
    },
  });

  // Update form values when vendor data is loaded
  useEffect(() => {
    if (vendor && vendorId) {
      form.reset({
        companyName: vendor.companyName,
        description: vendor.description || '',
        subscriptionPlanId: vendor.subscriptionPlanId,
        // Add user data if available
        ...(vendor.user && {
          email: vendor.user.email,
          firstName: vendor.user.firstName,
          lastName: vendor.user.lastName,
        }),
      });
      setIsCreatingUser(false);
    } else {
      setIsCreatingUser(true);
    }
  }, [vendor, vendorId, form]);

  // Create/update vendor mutation
  const mutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      if (vendorId) {
        // Update existing vendor
        await apiRequest('PATCH', `/api/vendors/${vendorId}`, {
          companyName: data.companyName,
          description: data.description,
          subscriptionPlanId: data.subscriptionPlanId,
        });
      } else {
        // Create new vendor
        if (isCreatingUser) {
          // Create user first, then vendor
          const userData = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: data.password,
            role: 'vendor',
          };
          
          const userResponse = await apiRequest('POST', '/api/auth/register', userData);
          const user = await userResponse.json();
          
          // Create vendor with the new user
          await apiRequest('POST', '/api/vendors', {
            userId: user.id,
            companyName: data.companyName,
            description: data.description,
            subscriptionPlanId: data.subscriptionPlanId,
            createSubdomain: data.createSubdomain,
            subdomainName: data.subdomainName,
          });
        } else {
          // Just update vendor data
          await apiRequest('POST', '/api/vendors', {
            companyName: data.companyName,
            description: data.description,
            subscriptionPlanId: data.subscriptionPlanId,
          });
        }
      }
    },
    onSuccess: () => {
      toast({
        title: vendorId ? "Vendor updated" : "Vendor created",
        description: vendorId ? "The vendor has been updated successfully." : "The vendor has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      if (vendorId) {
        queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId] });
      }
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${vendorId ? 'update' : 'create'} vendor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: VendorFormValues) => {
    mutation.mutate(data);
  };

  if (isLoadingVendor && vendorId) {
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
        <CardTitle>{vendorId ? 'Edit Vendor' : 'Add New Vendor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
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
                          placeholder="Brief description of the vendor" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscriptionPlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Plan</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subscriptionPlans?.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name} - ${parseFloat(plan.price).toFixed(2)}/month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isCreatingUser && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="createSubdomain"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create subdomain</FormLabel>
                          <p className="text-sm text-gray-500">
                            Automatically create a subdomain for this vendor
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('createSubdomain') && (
                    <FormField
                      control={form.control}
                      name="subdomainName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomain Name *</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input placeholder="subdomain" {...field} />
                            </FormControl>
                            <span className="flex items-center ml-2 text-gray-500">.multivend.com</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {vendorId ? 'Update Vendor' : 'Create Vendor'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VendorForm;
