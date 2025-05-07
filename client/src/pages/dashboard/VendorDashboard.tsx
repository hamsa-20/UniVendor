import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Users, 
  BarChart3, 
  ArrowRight,
  Star,
  Calendar,
  Globe,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const VendorDashboard = () => {
  const { user } = useAuth();
  
  // Get vendor ID
  const vendorId = user?.id;
  
  // Fetch vendor data
  const { data: vendor, isLoading: isLoadingVendor } = useQuery({
    queryKey: ['/api/vendors', vendorId],
    enabled: !!vendorId,
  });
  
  // Fetch vendor's products
  const { data: products } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });
  
  // Fetch vendor's orders
  const { data: orders } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/orders`],
    enabled: !!vendorId,
  });

  // Calculate total revenue
  const totalRevenue = orders?.reduce((total, order) => {
    if (order.paymentStatus === 'paid') {
      return total + parseFloat(order.total.toString());
    }
    return total;
  }, 0) || 0;

  // Calculate conversion rate (mocked for now)
  const conversionRate = 1.51;

  return (
    <DashboardLayout title="Vendor Dashboard" subtitle="Manage your store, products, and view analytics">
      {/* Subscription banner if needed */}
      {vendor?.subscriptionStatus === 'trial' && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Your trial ends in {vendor.trialEndsAt ? 
                    Math.max(0, Math.ceil((new Date(vendor.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 14} days
                </p>
                <p className="text-xs text-amber-700">
                  Upgrade to a paid plan to continue using all features
                </p>
              </div>
            </div>
            <Button variant="default" size="sm">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Orders"
          value={orders?.length || 0}
          icon={<ShoppingBag className="h-5 w-5 text-primary" />}
          change={{
            value: 18.2,
            isPositive: true,
            text: "from last month"
          }}
        />
        <StatCard
          title="Products"
          value={products?.length || 0}
          icon={<Package className="h-5 w-5 text-indigo-600" />}
          change={{
            value: 4,
            isPositive: true,
            text: "new this week"
          }}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          change={{
            value: 12.5,
            isPositive: true,
            text: "from last month"
          }}
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
          change={{
            value: 0.3,
            isPositive: false,
            text: "from last month"
          }}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Recent orders */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <Button variant="ghost" className="h-8 text-xs" asChild>
              <a href="/orders">View all<ArrowRight className="ml-1 h-3 w-3" /></a>
            </Button>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={
                        order.status === 'completed' ? 'success' :
                        order.status === 'processing' ? 'pending' :
                        order.status === 'shipped' ? 'secondary' :
                        order.status === 'canceled' ? 'error' : 'warning'
                      }>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-500 text-lg font-medium mb-1">No orders yet</h3>
                <p className="text-gray-400 text-sm">Orders will appear here when customers make purchases</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right column - store status and domains */}
        <div className="lg:col-span-3 space-y-6">
          {/* Store status card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold">Store Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingVendor ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant={vendor?.status === 'active' ? 'success' : 'warning'}>
                      {vendor?.status.charAt(0).toUpperCase() + vendor?.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Plan:</span>
                    <span className="text-sm font-medium">{vendor?.subscriptionPlan?.name || 'Free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Billing:</span>
                    <span className="text-sm font-medium">
                      {vendor?.nextBillingDate ? formatDate(vendor.nextBillingDate) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" className="w-full text-sm">
                      Manage Subscription
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Domains */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold">Your Domains</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor?.domains && vendor.domains.length > 0 ? (
                <div className="space-y-3">
                  {vendor.domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{domain.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className={cn(
                              "inline-block w-2 h-2 rounded-full mr-1",
                              domain.status === 'active' ? "bg-green-500" :
                              domain.status === 'pending' ? "bg-amber-500" : "bg-red-500"
                            )} />
                            {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                            {domain.isPrimary && (
                              <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">Primary</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Globe className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-gray-500 text-sm font-medium mb-1">No domains configured</h3>
                  <p className="text-gray-400 text-xs mb-3">Add a custom domain to make your store more professional</p>
                  <Button variant="outline" size="sm" className="text-xs">
                    Add Domain
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
