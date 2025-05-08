import React from 'react';
import { UsersList } from '@/components/admin/UsersList';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UsersManagementPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only super_admin can access this page
  if (!isAuthenticated || user?.role !== 'super_admin') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the user management section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            This page is only accessible to super administrators.
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all platform users including vendors and administrators. As a super admin, you can impersonate users to assist them with their account.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="all-users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users" className="space-y-4">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Users</CardTitle>
              <CardDescription>
                Manage vendor accounts and their access to the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Vendor filtering will be implemented soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Users</CardTitle>
              <CardDescription>
                Manage administrator accounts and their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Administrator filtering will be implemented soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}