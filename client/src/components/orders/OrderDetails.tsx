import { formatCurrency, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Order, OrderItem, Product } from '@shared/schema';
import OrderStatus from './OrderStatus';
import PaymentStatus from './PaymentStatus';
import OrderTimeline from './OrderTimeline';
import { ExternalLink } from 'lucide-react';

interface OrderDetailsProps {
  order: Order & {
    items?: (OrderItem & {
      product?: Product;
    })[];
  };
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  // Helper function to render the address block
  const renderAddressBlock = (address: any, title: string) => {
    if (!address) return null;
    
    try {
      // If address is a string, try to parse it as JSON
      const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
      
      return (
        <div className="mb-6">
          <h3 className="font-medium text-sm text-gray-500 mb-2">{title}</h3>
          <div className="text-sm">
            <p className="font-medium">{addressObj.name}</p>
            <p>{addressObj.addressLine1}</p>
            {addressObj.addressLine2 && (
              <p>{addressObj.addressLine2}</p>
            )}
            <p>
              {addressObj.city}, {addressObj.state} {addressObj.postalCode}
            </p>
            <p>{addressObj.country}</p>
            {addressObj.phone && <p className="mt-1">Phone: {addressObj.phone}</p>}
          </div>
        </div>
      );
    } catch (e) {
      // If parsing fails, just render the string
      return (
        <div className="mb-6">
          <h3 className="font-medium text-sm text-gray-500 mb-2">{title}</h3>
          <div className="text-sm whitespace-pre-line">
            {address}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Order Summary Column */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              Order #{order.orderNumber} • {formatDate(order.createdAt || new Date())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Status</h3>
                <OrderStatus status={order.status} size="lg" />
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Payment Status</h3>
                <PaymentStatus status={order.paymentStatus || 'pending'} size="lg" />
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-500 mb-2">Payment Method</h3>
                <p>{order.paymentMethod || 'Not specified'}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-500">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="font-medium">{order.customerName || 'Guest Customer'}</p>
                  {order.customerEmail && <p className="text-sm">{order.customerEmail}</p>}
                  {order.customerPhone && <p className="text-sm">Phone: {order.customerPhone}</p>}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {renderAddressBlock(order.shippingAddress, 'Shipping Address')}
              {renderAddressBlock(order.billingAddress, 'Billing Address')}
            </div>

            {order.trackingNumber && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-2">Tracking Information</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <p>Tracking #: {order.trackingNumber}</p>
                    {order.trackingUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7" 
                        onClick={() => window.open(order.trackingUrl, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Track
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {order.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-2">Order Notes</h3>
                  <p className="text-sm whitespace-pre-line">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.product?.sku && (
                            <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(item.price))}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(item.total))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No items found for this order
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(parseFloat(order.subtotal))}</span>
              </div>
              
              {parseFloat(order.shippingCost || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatCurrency(parseFloat(order.shippingCost || '0'))}</span>
                </div>
              )}
              
              {parseFloat(order.tax || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(parseFloat(order.tax || '0'))}</span>
                </div>
              )}
              
              {parseFloat(order.discount || '0') > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-red-600">-{formatCurrency(parseFloat(order.discount || '0'))}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Column */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <OrderTimeline order={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;