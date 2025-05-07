import { FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OrderStatus from "./OrderStatus";
import PaymentStatus from "./PaymentStatus";
import OrderTimeline from "./OrderTimeline";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem, Product } from "@shared/schema";

interface OrderDetailsProps {
  order: Order & {
    items?: (OrderItem & {
      product?: Product;
    })[];
  };
  isLoading?: boolean;
}

export const OrderDetails: FC<OrderDetailsProps> = ({ order, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Order #{order.orderNumber}</CardTitle>
            <CardDescription>
              Placed on {new Date(order.createdAt ?? "").toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <OrderStatus status={order.status as any} size="lg" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment</p>
                <PaymentStatus status={order.paymentStatus as any} size="lg" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{order.paymentMethod || "Not specified"}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold text-lg mb-4">Order Timeline</h3>
            <OrderTimeline status={order.status as any} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {item.product?.featuredImageUrl && (
                        <img
                          src={item.product.featuredImageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(parseFloat(item.price.toString()))}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(parseFloat(item.total.toString()))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-gray-500">No items in this order</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(parseFloat(order.subtotal.toString()))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{formatCurrency(parseFloat(order.shippingCost?.toString() || "0"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(parseFloat(order.tax?.toString() || "0"))}</span>
              </div>
              {parseFloat(order.discount?.toString() || "0") > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">
                    -{formatCurrency(parseFloat(order.discount.toString()))}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(order.total.toString()))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Shipping Address</h4>
                <p className="whitespace-pre-line mt-1">
                  {order.shippingAddress || "No shipping address provided"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-500">Billing Address</h4>
                <p className="whitespace-pre-line mt-1">
                  {order.billingAddress || "Same as shipping address"}
                </p>
              </div>

              {order.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">Order Notes</h4>
                  <p className="whitespace-pre-line mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;