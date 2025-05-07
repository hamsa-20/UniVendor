import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DomainTable from '@/components/domains/DomainTable';
import DomainForm from '@/components/domains/DomainForm';
import VendorForm from '@/components/vendors/VendorForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Store, User, Globe, CreditCard, BarChart3, Package, ShoppingCart } from 'lucide-react';

type VendorDetailsProps = {
  id: string;
};

const VendorDetails = ({ id }: VendorDetailsProps) => {
  const vendorId = parseInt(id);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [isEditDomainOpen, setIsEditDomainOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  
  // Fetch vendor data
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['/api/vendors', vendorId],
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

  // Handlers
  const handleEditVendor = () => {
    setIsEditVendorOpen(true);
  };

  const handleAddDomain = () => {
    setIsAddDomainOpen(true);
  };

  const handleEditDomain = (id: number) => {
    setSelectedDomainId(id);
    setIsEditDomainOpen(true);
  };

  const handleDeleteDomain = (id: number) => {
    // Implementation would go here
    console.log("Delete domain", id);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Vendor Details" subtitle="Loading...">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout title="Vendor Details" subtitle="Vendor not found">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Vendor not found</h2>
            <p className="text-muted-foreground mb-6">The vendor you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <a href="/vendors">Back to Vendors</a>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={vendor.companyName} 
      subtitle={`Vendor ID: ${vendor.id} • Created ${formatDate(vendor.createdAt)}`}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-6 h-auto mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Vendor Information</CardTitle>
                    <CardDescription>Basic details about this vendor</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEditVendor}>
                    Edit Vendor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Details</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium">Company Name</div>
                        <div className="text-sm">{vendor.companyName}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Description</div>
                        <div className="text-sm">{vendor.description || 'No description provided'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Status</div>
                        <Badge 
                          variant={
                            vendor.status === 'active' ? 'success' : 
                            vendor.status === 'pending' ? 'warning' : 'error'
                          }
                        >
                          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner Details</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium">Full Name</div>
                        <div className="text-sm">
                          {vendor.user ? `${vendor.user.firstName} ${vendor.user.lastName}` : 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Email</div>
                        <div className="text-sm">{vendor.user?.email || 'No email provided'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Member Since</div>
                        <div className="text-sm">{formatDate(vendor.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Plan</div>
                      <div className="text-sm">{vendor.subscriptionPlan?.name || 'Free'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <Badge 
                        variant={
                          vendor.subscriptionStatus === 'active' ? 'success' : 
                          vendor.subscriptionStatus === 'trial' ? 'warning' : 'error'
                        }
                      >
                        {vendor.subscriptionStatus.charAt(0).toUpperCase() + vendor.subscriptionStatus.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Next Billing</div>
                      <div className="text-sm">
                        {vendor.nextBillingDate ? formatDate(vendor.nextBillingDate) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Store Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">Products</span>
                    </div>
                    <span className="font-medium">{products?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">Orders</span>
                    </div>
                    <span className="font-medium">{orders?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">Domains</span>
                    </div>
                    <span className="font-medium">{vendor.domains?.length || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">Revenue</span>
                    </div>
                    <span className="font-medium">
                      ${orders?.reduce((total, order) => {
                        if (order.paymentStatus === 'paid') {
                          return total + parseFloat(order.total.toString());
                        }
                        return total;
                      }, 0).toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/vendors/${vendorId}/analytics`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="domains">
          <DomainTable
            vendorId={vendorId}
            onAddDomain={handleAddDomain}
            onEditDomain={handleEditDomain}
            onDeleteDomain={handleDeleteDomain}
          />
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Products offered by this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  The product management interface for this vendor is under development.
                </p>
                <Button asChild>
                  <a href={`/products?vendorId=${vendorId}`}>View Products</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Order history for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  The order management interface for this vendor is under development.
                </p>
                <Button asChild>
                  <a href={`/orders?vendorId=${vendorId}`}>View Orders</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Performance metrics for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  The analytics interface for this vendor is under development.
                </p>
                <Button asChild>
                  <a href={`/analytics?vendorId=${vendorId}`}>View Analytics</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage vendor settings</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorForm vendorId={vendorId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="max-w-3xl">
          <VendorForm
            vendorId={vendorId}
            onSuccess={() => setIsEditVendorOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="max-w-xl">
          <DomainForm
            vendorId={vendorId}
            onSuccess={() => setIsAddDomainOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Domain Dialog */}
      <Dialog open={isEditDomainOpen} onOpenChange={setIsEditDomainOpen}>
        <DialogContent className="max-w-xl">
          <DomainForm
            vendorId={vendorId}
            domainId={selectedDomainId || undefined}
            onSuccess={() => setIsEditDomainOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorDetails;
