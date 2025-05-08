import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

const OrderTable = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { user } = useAuth();

  // Get vendor ID from user
  const vendorId = user?.role === 'vendor' ? user.id : undefined;

  // Fetch orders for the vendor
  const { data: orders, isLoading } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/orders`],
    enabled: !!vendorId,
  });

  // Filter orders based on search query and filters
  const filteredOrders = orders
    ? orders.filter((order) => {
        // Search filter
        const searchMatch =
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;

        return searchMatch && statusMatch;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  // Status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'pending';
      case 'shipped':
        return 'secondary';
      case 'canceled':
        return 'error';
      default:
        return 'secondary';
    }
  };

  // Payment status badge variant
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage your store orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 w-full md:flex-1" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Manage your store orders</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders table */}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          {order.orderNumber}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {order.customer ? (
                          <div>
                            <div className="font-medium">{`${order.customer.firstName || ''} ${order.customer.lastName || ''}`}</div>
                            <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right font-medium">
                        ${parseFloat(order.total.toString()).toFixed(2)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      No orders found. Adjust filters or check back later.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * perPage + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(page * perPage, filteredOrders.length)}
              </span>{" "}
              of <span className="font-medium">{filteredOrders.length}</span> orders
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTable;
