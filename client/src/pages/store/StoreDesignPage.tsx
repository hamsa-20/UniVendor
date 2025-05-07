import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import StoreDesignForm from '@/components/store/StoreDesignForm';

const StoreDesignPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('theme');
  
  // Fetch vendor data
  const { data: vendor } = useQuery({
    queryKey: ['/api/vendors', user?.id],
    enabled: !!user && user.role === 'vendor',
  });
  
  // Update active tab based on URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['theme', 'branding', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);
  
  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };
  
  return (
    <DashboardLayout title="Store Design" subtitle="Customize your store's appearance">
      <Card>
        <CardHeader>
          <CardTitle>Store Appearance</CardTitle>
          <CardDescription>
            Customize your store's theme, branding, and appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto mb-6">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="theme">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Store Theme</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a theme that best represents your store. Each theme comes with unique layouts, colors, and visual styles.
                  </p>
                  <Separator className="my-6" />
                  <StoreDesignForm />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="branding">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Store Branding</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize your store's brand identity including logo, colors, and typography.
                  </p>
                  <Separator className="my-6" />
                  <StoreDesignForm />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Advanced Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fine-tune your store with advanced customization options including custom CSS and JavaScript.
                  </p>
                  <Separator className="my-6" />
                  <StoreDesignForm />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StoreDesignPage;