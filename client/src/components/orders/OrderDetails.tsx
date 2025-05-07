import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, MapPin, CreditCard } from 'lucide-react';

type OrderDetailsProps = {
  orderId: number;
};

const OrderDetails = ({ orderId }: OrderDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch order data
  const { data: order, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
  });

  // Update order status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      await apiRequest('PATCH', `/api/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update payment status mutation
  const paymentStatusMutation = useMutation({
    mutationFn: async ({ paymentStatus }: { paymentStatus: string }) => {
      await apiRequest('PATCH', `/api/orders/${orderId}`, { paymentStatus });
    },
    onSuccess: () => {
      toast({
        title: "Payment status updated",
        description: "The payment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payment status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    statusMutation.mutate({ status });
  };

  // Handle payment status change
  const handlePaymentStatusChange = (paymentStatus: string) => {
    paymentStatusMutation.mutate({ paymentStatus });
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-y-2">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order not found</CardTitle>
          <CardDescription>The requested order could not be found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Order #{order.orderNumber}
          </CardTitle>
          <CardDescription>
            Placed on {formatDate(order.createdAt)}
          </CardDescription>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <Select
            defaultValue={order.status}
            onValueChange={handleStatusChange}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <Badge variant={getStatusBadgeVariant(order.status)} className="mr-2">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <span className="hidden md:inline">Update Status</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={order.paymentStatus}
            onValueChange={handlePaymentStatusChange}
            disabled={paymentStatusMutation.isPending}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="mr-2">
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Badge>
              <span className="hidden md:inline">Payment Status</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer and shipping information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              {order.customer ? (
                <div>
                  <p className="font-medium">{`${order.customer.firstName || ''} ${order.customer.lastName || ''}`}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  {order.customer.phone && <p className="text-sm">{order.customer.phone}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">Guest checkout</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Shipping Address</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              {order.shippingAddress ? (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                  <div>
                    <p className="whitespace-pre-line">{order.shippingAddress}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No shipping address provided</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Payment Information</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-start">
                <CreditCard className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {order.paymentMethod || 'Payment method not specified'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order items */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">Order Items</h3>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items in this order</p>
          )}
        </div>

        {/* Order summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
            {parseFloat(order.tax.toString()) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            {parseFloat(order.discount.toString()) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-muted/50 p-4 rounded-md mt-4">
            <h3 className="text-sm font-medium mb-2">Order Notes</h3>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Order actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Print Invoice</Button>
          <Button>Notify Customer</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
