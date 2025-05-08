import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VendorImpersonation } from '@/components/admin/VendorImpersonation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect if not a super_admin
  if (user && user.role !== 'super_admin') {
    setLocation('/');
    return null;
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage platform vendors, subscriptions, and system settings.
        </p>
      </div>

      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <VendorImpersonation />
            
            {/* Additional vendor management components can be added here */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Key metrics about vendors on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Total Vendors</span>
                    <span className="text-2xl font-bold">23</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Active Vendors</span>
                    <span className="text-2xl font-bold">18</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">New This Month</span>
                    <span className="text-2xl font-bold">5</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Pending Approval</span>
                    <span className="text-2xl font-bold">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Manage platform subscription plans and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Subscription management will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domain Management</CardTitle>
              <CardDescription>Manage vendor domains and SSL certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Domain management will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure global platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Platform settings will be implemented soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}