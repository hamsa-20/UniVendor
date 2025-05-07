import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Eye, Filter } from 'lucide-react';
import OrderStatus from '@/components/orders/OrderStatus';
import PaymentStatus from '@/components/orders/PaymentStatus';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

const OrdersPage = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [user?.vendorId ? `/api/vendors/${user.vendorId}/orders` : null],
    enabled: !!user?.vendorId,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? null : value);
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    setPaymentStatusFilter(value === 'all' ? null : value);
  };

  const filteredOrders = orders
    ? orders.filter((order) => {
        const matchesSearch =
          !searchQuery ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesPaymentStatus = !paymentStatusFilter || order.paymentStatus === paymentStatusFilter;

        return matchesSearch && matchesStatus && matchesPaymentStatus;
      })
    : [];

  if (!user?.vendorId) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Vendor Access</h1>
        <p className="mb-4">You need to be associated with a vendor to view orders.</p>
        <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Filters</CardTitle>
          <CardDescription>Filter and search your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by order # or customer"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>

            <div>
              <Select onValueChange={handleStatusFilterChange} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select onValueChange={handlePaymentStatusFilterChange} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
              <p className="text-gray-500">
                {orders && orders.length > 0
                  ? 'Try adjusting your filters or search query'
                  : 'No orders have been placed yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt || new Date())}</TableCell>
                      <TableCell>
                        {order.customerName ? (
                          <>
                            <div>{order.customerName}</div>
                            {order.customerEmail && (
                              <div className="text-sm text-gray-500">{order.customerEmail}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">Guest</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(order.total))}</TableCell>
                      <TableCell>
                        <OrderStatus status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatus status={order.paymentStatus || 'pending'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;