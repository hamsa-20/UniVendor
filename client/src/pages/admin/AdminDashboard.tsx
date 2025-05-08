import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3, Building, DollarSign, ShieldCheck, Users } from 'lucide-react';
import { VendorImpersonation } from '@/components/admin/VendorImpersonation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch platform stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/platform-stats'],
    enabled: !!user && user.role === 'super_admin'
  });

  // Redirect non-admin users or show access denied
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Platform Administration" 
      subtitle="Manage vendors, subscriptions, and platform settings"
    >
      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm">Total Vendors</span>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalVendors || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm">Active Domains</span>
              <Building className="h-5 w-5 text-green-500" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{stats?.activeDomains || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm">Platform Revenue</span>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground text-sm">Pending Issues</span>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{stats?.pendingIssues || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vendor impersonation */}
        <div className="lg:col-span-2">
          <VendorImpersonation />
        </div>
        
        {/* Admin actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Quick access to common administrator tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Card className="hover:bg-gray-50 cursor-pointer border-dashed">
                  <CardContent className="flex items-center p-4">
                    <ShieldCheck className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <h4 className="text-sm font-medium">Platform Settings</h4>
                      <p className="text-xs text-muted-foreground">Configure global platform settings</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:bg-gray-50 cursor-pointer border-dashed">
                  <CardContent className="flex items-center p-4">
                    <BarChart3 className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium">Reporting & Analytics</h4>
                      <p className="text-xs text-muted-foreground">View platform performance metrics</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:bg-gray-50 cursor-pointer border-dashed">
                  <CardContent className="flex items-center p-4">
                    <DollarSign className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium">Financial Overview</h4>
                      <p className="text-xs text-muted-foreground">Monitor revenue and payments</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}