import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import OrderDetails from '@/components/orders/OrderDetails';
import OrderUpdateForm from '@/components/orders/OrderUpdateForm';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const OrderDetailPage = () => {
  const [activeTab, setActiveTab] = useState('details');
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get order ID from URL
  const path = useLocation()[0];
  const orderId = parseInt(path.split('/').pop() || '0');

  // If user is not a vendor, we can't load orders yet
  const vendorId = user?.vendorId;

  // Fetch order details
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      if (!orderId) throw new Error('Invalid order ID');
      return fetch(`/api/orders/${orderId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
      });
    },
    enabled: !!orderId && !!vendorId,
  });

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: order ? `Order-${order.orderNumber}` : 'Order-Details',
    onAfterPrint: () => {
      toast({
        title: 'Print successful',
        description: 'The order details have been sent to your printer.',
      });
    },
  });

  // Navigate back to orders list
  const handleBackToOrders = () => {
    setLocation('/orders');
  };

  // Callback after order update
  const handleOrderUpdate = () => {
    refetch();
    setActiveTab('details');
    toast({
      title: 'Order Updated',
      description: 'The order has been successfully updated.',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBackToOrders}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? (
                <Skeleton className="h-9 w-48 inline-block" />
              ) : error ? (
                'Order Details'
              ) : (
                `Order #${order.orderNumber}`
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-5 w-64" />
              ) : error ? (
                'Error loading order details'
              ) : (
                `Manage and update order information`
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={isLoading || !!error}
            className="flex items-center"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            There was an error loading this order. Please try again or contact support.
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="update">Update Order</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div ref={printRef} className="print:p-4">
                <div className="hidden print:block mb-8">
                  <h1 className="text-2xl font-bold mb-2">Order #{order.orderNumber}</h1>
                  <Separator />
                </div>
                <OrderDetails order={order} />
              </div>
            </TabsContent>
            <TabsContent value="update">
              <OrderUpdateForm order={order} onSuccess={handleOrderUpdate} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default OrderDetailPage;