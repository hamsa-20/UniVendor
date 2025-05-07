import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderDetails from '@/components/orders/OrderDetails';
import OrderUpdateForm from '@/components/orders/OrderUpdateForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, OrderItem, Product } from '@shared/schema';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

type OrderWithItemsAndProducts = Order & {
  items?: (OrderItem & {
    product?: Product;
  })[];
};

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderWithItemsAndProducts>({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id,
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Order-${order?.orderNumber || id}`,
    copyStyles: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-gray-500 mb-4">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/orders">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/orders">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            Order #{order.orderNumber}
          </h1>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Order
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="update">Update Order</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div ref={printRef} className="print:p-4">
            <div className="print:mb-6 print:text-center print:block hidden">
              <h1 className="text-2xl font-bold">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-500">
                {new Date(order.createdAt || new Date()).toLocaleDateString()}
              </p>
            </div>
            <OrderDetails order={order} />
          </div>
        </TabsContent>
        
        <TabsContent value="update">
          <OrderUpdateForm order={order} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDetailPage;