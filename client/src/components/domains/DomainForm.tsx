import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Validation schema for domain form
const domainFormSchema = z.object({
  vendorId: z.number(),
  name: z.string().min(2, 'Domain name is required'),
  type: z.enum(['subdomain', 'custom']),
  isPrimary: z.boolean().default(false),
});

type DomainFormValues = z.infer<typeof domainFormSchema>;

type DomainFormProps = {
  domainId?: number;
  vendorId?: number;
  onSuccess?: () => void;
};

const DomainForm = ({ domainId, vendorId, onSuccess }: DomainFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ['/api/vendors'],
    enabled: !vendorId, // Only fetch vendors if no vendorId is provided
  });

  // Fetch domain data if editing
  const { data: domain, isLoading: isLoadingDomain } = useQuery({
    queryKey: ['/api/domains', domainId],
    enabled: !!domainId,
  });

  // Initialize form
  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      vendorId: vendorId || 0,
      name: '',
      type: 'subdomain',
      isPrimary: false,
    },
  });

  // Update form values when domain data is loaded
  useEffect(() => {
    if (domain && domainId) {
      form.reset({
        vendorId: domain.vendorId,
        name: domain.name,
        type: domain.type as 'subdomain' | 'custom',
        isPrimary: domain.isPrimary,
      });
    } else if (vendorId) {
      form.setValue('vendorId', vendorId);
    }
  }, [domain, domainId, vendorId, form]);

  // Domain mutation for create/update
  const mutation = useMutation({
    mutationFn: async (data: DomainFormValues) => {
      if (domainId) {
        // Update existing domain
        await apiRequest('PATCH', `/api/domains/${domainId}`, data);
      } else {
        // Create new domain
        await apiRequest('POST', '/api/domains', data);
      }
    },
    onSuccess: () => {
      toast({
        title: domainId ? "Domain updated" : "Domain created",
        description: domainId ? "The domain has been updated successfully." : "The domain has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
      if (vendorId) {
        queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'domains'] });
      }
      if (domainId) {
        queryClient.invalidateQueries({ queryKey: ['/api/domains', domainId] });
      }
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${domainId ? 'update' : 'create'} domain: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: DomainFormValues) => {
    mutation.mutate(data);
  };

  const selectedType = form.watch('type');

  if (isLoadingDomain && domainId) {
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
        <CardTitle>{domainId ? 'Edit Domain' : 'Add New Domain'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!vendorId && (
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors?.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Type *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="subdomain">Subdomain</SelectItem>
                      <SelectItem value="custom">Custom Domain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name *</FormLabel>
                  {selectedType === 'subdomain' ? (
                    <div className="flex">
                      <FormControl>
                        <Input placeholder="yourdomain" {...field} />
                      </FormControl>
                      <span className="flex items-center ml-2 text-gray-500">.multivend.com</span>
                    </div>
                  ) : (
                    <FormControl>
                      <Input placeholder="yourdomain.com" {...field} />
                    </FormControl>
                  )}
                  <FormDescription>
                    {selectedType === 'custom' 
                      ? "Enter your custom domain name. You'll need to configure DNS records." 
                      : "Enter your desired subdomain."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary Domain</FormLabel>
                    <FormDescription>
                      Set as the primary domain for this vendor
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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
                {domainId ? 'Update Domain' : 'Create Domain'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DomainForm;
