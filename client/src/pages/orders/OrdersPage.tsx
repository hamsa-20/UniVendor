import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Calendar, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const OrdersPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  // Fetch vendor's orders
  const { data: orders, isLoading } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/orders`],
    enabled: !!vendorId,
  });
  
  // Filter and sort orders
  const filteredOrders = orders
    ? orders
        .filter(order => 
          (statusFilter === 'all' || order.status === statusFilter) &&
          (searchQuery === '' || 
           order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        })
    : [];
  
  // Get badge variant based on order status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'shipped': return 'secondary';
      case 'canceled': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <DashboardLayout title="Orders" subtitle="Manage customer orders">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage all customer orders</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-32 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                    <div className="h-4 w-20 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="bg-muted w-10 h-10 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Order #{order.orderNumber}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)} • {order.customer?.email || 'Guest customer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
              <div className="py-4 text-center text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'When customers place orders, they will appear here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default OrdersPage;