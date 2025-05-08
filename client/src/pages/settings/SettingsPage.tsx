import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Check, Save } from 'lucide-react';

// Form validation schema
const generalSettingsSchema = z.object({
  platformName: z.string().min(2, 'Platform name must be at least 2 characters'),
  supportEmail: z.string().email('Please enter a valid email address'),
  websiteUrl: z.string().url('Please enter a valid URL'),
  defaultCurrency: z.string().min(3, 'Please select a currency'),
  logo: z.any().optional(),
  favicon: z.any().optional(),
});

// API Keys form schema
const apiKeysSchema = z.object({
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  sendgridApiKey: z.string().optional(),
  googleMapsApiKey: z.string().optional(),
});

// Email settings form schema
const emailSettingsSchema = z.object({
  emailHost: z.string().min(1, 'SMTP host is required'),
  emailPort: z.coerce.number().int('Port must be a number'),
  emailUser: z.string().min(1, 'SMTP username is required'),
  emailPassword: z.string().min(1, 'SMTP password is required'),
  emailFromAddress: z.string().email('Please enter a valid email address'),
  emailFromName: z.string().min(1, 'From name is required'),
});

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // General settings form
  const generalForm = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      platformName: 'MultiVend',
      supportEmail: 'support@multivend.com',
      websiteUrl: 'https://multivend.com',
      defaultCurrency: 'USD',
    },
  });

  // API keys form
  const apiKeysForm = useForm({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      stripePublicKey: '',
      stripeSecretKey: '',
      sendgridApiKey: '',
      googleMapsApiKey: '',
    },
  });

  // Email settings form
  const emailForm = useForm({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      emailHost: 'smtp.hostinger.com',
      emailPort: 465,
      emailUser: 'verification@lelekart.com',
      emailPassword: '',
      emailFromAddress: 'verification@lelekart.com',
      emailFromName: 'MultiVend Platform',
    },
  });

  // Save general settings
  const onSaveGeneralSettings = async (data) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/settings/general', data);
      toast({
        title: "Settings updated",
        description: "Your general settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save API keys
  const onSaveApiKeys = async (data) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/settings/api-keys', data);
      toast({
        title: "API keys updated",
        description: "Your API keys have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save email settings
  const onSaveEmailSettings = async (data) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/settings/email', data);
      toast({
        title: "Email settings updated",
        description: "Your email settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your email settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Configure platform settings and integrations">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full md:w-auto grid grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic platform settings and preferences</CardDescription>
            </CardHeader>
            <form onSubmit={generalForm.handleSubmit(onSaveGeneralSettings)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input 
                      id="platformName" 
                      placeholder="MultiVend" 
                      {...generalForm.register('platformName')} 
                    />
                    {generalForm.formState.errors.platformName && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.platformName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input 
                      id="supportEmail" 
                      type="email" 
                      placeholder="support@multivend.com" 
                      {...generalForm.register('supportEmail')} 
                    />
                    {generalForm.formState.errors.supportEmail && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.supportEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input 
                      id="websiteUrl" 
                      placeholder="https://multivend.com" 
                      {...generalForm.register('websiteUrl')} 
                    />
                    {generalForm.formState.errors.websiteUrl && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.websiteUrl.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <select 
                      id="defaultCurrency" 
                      className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      {...generalForm.register('defaultCurrency')}
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                    {generalForm.formState.errors.defaultCurrency && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.defaultCurrency.message}</p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Branding</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo</Label>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-primary text-lg font-bold">
                          MV
                        </div>
                        <Input 
                          id="logo" 
                          type="file" 
                          className="max-w-sm"
                          {...generalForm.register('logo')} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon</Label>
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-xs font-bold">
                          MV
                        </div>
                        <Input 
                          id="favicon" 
                          type="file" 
                          className="max-w-sm"
                          {...generalForm.register('favicon')} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableMaintenance">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">Enable maintenance mode to temporarily block access to the platform</p>
                      </div>
                      <Switch id="enableMaintenance" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableRegistration">Enable Vendor Registration</Label>
                        <p className="text-sm text-muted-foreground">Allow new vendors to register on the platform</p>
                      </div>
                      <Switch id="enableRegistration" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableAutoApproval">Auto-approve Vendors</Label>
                        <p className="text-sm text-muted-foreground">Automatically approve new vendor accounts</p>
                      </div>
                      <Switch id="enableAutoApproval" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Integrations</CardTitle>
              <CardDescription>Configure third-party service integrations</CardDescription>
            </CardHeader>
            <form onSubmit={apiKeysForm.handleSubmit(onSaveApiKeys)}>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Stripe Integration</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                      <Input 
                        id="stripePublicKey" 
                        placeholder="pk_..." 
                        {...apiKeysForm.register('stripePublicKey')} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                      <Input 
                        id="stripeSecretKey" 
                        type="password" 
                        placeholder="sk_..." 
                        {...apiKeysForm.register('stripeSecretKey')} 
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">SendGrid Integration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input 
                      id="sendgridApiKey" 
                      type="password" 
                      placeholder="SG..." 
                      {...apiKeysForm.register('sendgridApiKey')} 
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Google Maps Integration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsApiKey">Google Maps API Key</Label>
                    <Input 
                      id="googleMapsApiKey" 
                      placeholder="AIza..." 
                      {...apiKeysForm.register('googleMapsApiKey')} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email server settings and templates</CardDescription>
            </CardHeader>
            <form onSubmit={emailForm.handleSubmit(onSaveEmailSettings)}>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">SMTP Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailHost">SMTP Host</Label>
                      <Input 
                        id="emailHost" 
                        placeholder="smtp.example.com" 
                        {...emailForm.register('emailHost')} 
                      />
                      {emailForm.formState.errors.emailHost && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailHost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPort">SMTP Port</Label>
                      <Input 
                        id="emailPort" 
                        type="number" 
                        placeholder="587" 
                        {...emailForm.register('emailPort')} 
                      />
                      {emailForm.formState.errors.emailPort && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailPort.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailUser">SMTP Username</Label>
                      <Input 
                        id="emailUser" 
                        placeholder="username" 
                        {...emailForm.register('emailUser')} 
                      />
                      {emailForm.formState.errors.emailUser && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailUser.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">SMTP Password</Label>
                      <Input 
                        id="emailPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        {...emailForm.register('emailPassword')} 
                      />
                      {emailForm.formState.errors.emailPassword && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailFromAddress">From Email Address</Label>
                      <Input 
                        id="emailFromAddress" 
                        type="email" 
                        placeholder="noreply@example.com" 
                        {...emailForm.register('emailFromAddress')} 
                      />
                      {emailForm.formState.errors.emailFromAddress && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailFromAddress.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailFromName">From Name</Label>
                      <Input 
                        id="emailFromName" 
                        placeholder="MultiVend Platform" 
                        {...emailForm.register('emailFromName')} 
                      />
                      {emailForm.formState.errors.emailFromName && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.emailFromName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-lg font-medium">Test Email Configuration</h3>
                      <p className="text-sm text-muted-foreground">Send a test email to verify your settings</p>
                    </div>
                    <Button type="button" variant="outline">
                      Send Test Email
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Templates</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Welcome Email</h4>
                        <Button type="button" variant="outline" size="sm">
                          Edit Template
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Sent to new users when they register an account</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Password Reset</h4>
                        <Button type="button" variant="outline" size="sm">
                          Edit Template
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Sent when users request a password reset</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">OTP Verification</h4>
                        <Button type="button" variant="outline" size="sm">
                          Edit Template
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Sent with one-time password for account verification</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SettingsPage;