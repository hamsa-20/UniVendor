import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThemeSelector from './ThemeSelector';
import ColorPalette from './ColorPalette';
import FontSelector from './FontSelector';
import ThemePreview from './ThemePreview';
import { Separator } from '@/components/ui/separator';

// Validation schema for store design form
const storeDesignFormSchema = z.object({
  storeTheme: z.string().min(1, 'Please select a theme'),
  customCss: z.string().optional(),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  colorPalette: z.string().default('default'),
  fontSettings: z.object({
    headingFont: z.string().default('inter'),
    bodyFont: z.string().default('inter'),
    fontSize: z.number().min(12).max(20).default(16),
    useCustomFonts: z.boolean().default(false),
    customHeadingFont: z.string().optional(),
    customBodyFont: z.string().optional(),
  }).optional().default({
    headingFont: 'inter',
    bodyFont: 'inter',
    fontSize: 16,
    useCustomFonts: false,
  }),
});

type StoreDesignFormValues = z.infer<typeof storeDesignFormSchema>;

const StoreDesignForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('theme');

  // Get vendor ID
  const vendorId = user?.role === 'vendor' ? user.id : undefined;

  // Fetch vendor data
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['/api/vendors', vendorId],
    enabled: !!vendorId,
  });

  // Initialize form
  const form = useForm<StoreDesignFormValues>({
    resolver: zodResolver(storeDesignFormSchema),
    defaultValues: {
      storeTheme: 'default',
      customCss: '',
      logoUrl: '',
      companyName: '',
      description: '',
      colorPalette: 'default',
      fontSettings: {
        headingFont: 'inter',
        bodyFont: 'inter',
        fontSize: 16,
        useCustomFonts: false
      },
    },
  });

  // Update form values when vendor data is loaded
  useEffect(() => {
    if (vendor) {
      form.reset({
        storeTheme: vendor.storeTheme || 'default',
        customCss: vendor.customCss || '',
        logoUrl: vendor.logoUrl || '',
        companyName: vendor.companyName,
        description: vendor.description || '',
        colorPalette: vendor.colorPalette || 'default',
        fontSettings: vendor.fontSettings || {
          headingFont: 'inter',
          bodyFont: 'inter',
          fontSize: 16,
          useCustomFonts: false,
        },
      });
    }
  }, [vendor, form]);

  // Store design update mutation
  const mutation = useMutation({
    mutationFn: async (data: StoreDesignFormValues) => {
      if (!vendorId) return;
      
      await apiRequest('PATCH', `/api/vendors/${vendorId}`, {
        storeTheme: data.storeTheme,
        customCss: data.customCss,
        logoUrl: data.logoUrl,
        companyName: data.companyName,
        description: data.description,
        colorPalette: data.colorPalette,
        fontSettings: data.fontSettings,
      });
    },
    onSuccess: () => {
      toast({
        title: "Store design updated",
        description: "Your store design has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update store design: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: StoreDesignFormValues) => {
    mutation.mutate(data);
  };

  if (isLoading) {
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
        <CardTitle>Store Design</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="theme" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Theme Tab */}
                <TabsContent value="theme" className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="storeTheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Theme</FormLabel>
                            <ThemeSelector 
                              value={field.value} 
                              onChange={field.onChange} 
                            />
                            <FormDescription>
                              Choose a theme for your store's frontend appearance
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="colorPalette"
                        render={({ field }) => (
                          <FormItem>
                            <ColorPalette
                              value={field.value}
                              onChange={(value, colors) => {
                                field.onChange(value);
                                // Additional logic if needed with colors
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fontSettings"
                        render={({ field }) => (
                          <FormItem>
                            <FontSelector
                              value={field.value}
                              onChange={(fontSettings) => {
                                field.onChange(fontSettings);
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <ThemePreview 
                        themeName={form.watch('storeTheme')} 
                        vendorId={vendorId} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('branding')}>
                      Next: Branding
                    </Button>
                  </div>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of your store logo image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store/Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Store Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will appear in your store header and footer
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
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your store in a few sentences" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used for SEO and may appear in your store footer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('theme')}>
                      Back: Theme
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setActiveTab('advanced')}>
                      Next: Advanced
                    </Button>
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customCss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom CSS</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder=".my-custom-class { color: #ff0000; }" 
                            className="min-h-[200px] font-mono" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Add custom CSS to further customize your store's appearance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> Custom CSS is an advanced feature. Incorrect CSS may break your store's layout or functionality.
                    </p>
                  </div>

                  <div className="flex justify-between space-x-2">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('branding')}>
                      Back: Branding
                    </Button>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
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

export default StoreDesignForm;
