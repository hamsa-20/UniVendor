import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CreditCard, Map, Phone, Truck, User } from "lucide-react";
import { PaymentMethod } from "./PaymentMethodSelector";
import { Link, useLocation } from "wouter";

// Form schema for shipping information
const shippingFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface OrderSummaryProps {
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  total: string;
  itemCount: number;
}

// Component for the order summary
const OrderSummary = ({ subtotal, shippingCost, taxAmount, total, itemCount }: OrderSummaryProps) => (
  <div className="space-y-4">
    <div className="font-medium text-lg mb-2">Order Summary</div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
      <span>${subtotal}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Shipping</span>
      <span>${shippingCost}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Tax</span>
      <span>${taxAmount}</span>
    </div>
    <div className="border-t pt-2 mt-2">
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>${total}</span>
      </div>
    </div>
  </div>
);

// The main shipping information form component
const ShippingForm = ({ 
  onSubmit, 
  defaultValues 
}: { 
  onSubmit: (data: ShippingFormValues) => void;
  defaultValues?: Partial<ShippingFormValues>;
}) => {
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apt 4B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="New York" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="10001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
          </Button>
          <Button type="submit">Continue to Payment</Button>
        </div>
      </form>
    </Form>
  );
};

// Type for order information
export interface OrderData {
  id: number;
  vendorId: number;
  customerId: number;
  items: {
    id: number;
    productId: number;
    name: string;
    price: string;
    quantity: number;
    imageUrl?: string;
  }[];
  subtotal: string;
  total: string;
  status: string;
  orderNumber: string;
  shippingAddress: ShippingFormValues;
}

interface CheckoutFormProps {
  vendorId: number;
  orderData: OrderData;
  onShippingComplete: (data: ShippingFormValues) => void;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  onPaymentComplete: (paymentId: string) => void;
  onPaymentCancel: () => void;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  currentStep: "shipping" | "payment" | "confirmation";
  processingPayment: boolean;
}

// The main checkout form component
export const CheckoutForm = ({
  vendorId,
  orderData,
  onShippingComplete,
  onPaymentMethodSelect,
  onPaymentComplete,
  onPaymentCancel,
  availablePaymentMethods,
  selectedPaymentMethod,
  currentStep,
  processingPayment,
}: CheckoutFormProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Estimated values for the order
  const shippingCost = "5.00";
  const taxAmount = (parseFloat(orderData.subtotal) * 0.0825).toFixed(2); // Example tax rate (8.25%)
  const total = orderData.total || 
                (parseFloat(orderData.subtotal) + 
                 parseFloat(shippingCost) + 
                 parseFloat(taxAmount)).toFixed(2);

  return (
    <div className="flex flex-col space-y-8">
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipping" disabled={currentStep !== "shipping"}>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              Shipping
            </div>
          </TabsTrigger>
          <TabsTrigger value="payment" disabled={currentStep !== "payment"}>
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment
            </div>
          </TabsTrigger>
          <TabsTrigger value="confirmation" disabled={currentStep !== "confirmation"}>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Confirmation
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>
                    Please enter your shipping address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShippingForm 
                    onSubmit={onShippingComplete}
                    defaultValues={orderData.shippingAddress}
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderSummary
                    subtotal={orderData.subtotal}
                    shippingCost={shippingCost}
                    taxAmount={taxAmount}
                    total={total}
                    itemCount={orderData.items.length}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Payment methods will be rendered by the parent component */}
            </div>
            <div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderSummary
                    subtotal={orderData.subtotal}
                    shippingCost={shippingCost}
                    taxAmount={taxAmount}
                    total={total}
                    itemCount={orderData.items.length}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="confirmation" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Order Confirmed!
                  </CardTitle>
                  <CardDescription>
                    Your order has been confirmed. You will receive an email confirmation shortly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Order Number: {orderData.orderNumber}</h3>
                    <p className="text-muted-foreground">
                      Please keep this number for your records.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Map className="h-4 w-4 mr-2" />
                        Shipping Address
                      </h3>
                      {orderData.shippingAddress && (
                        <div className="text-sm">
                          <p>{orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}</p>
                          <p>{orderData.shippingAddress.addressLine1}</p>
                          {orderData.shippingAddress.addressLine2 && <p>{orderData.shippingAddress.addressLine2}</p>}
                          <p>
                            {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.postalCode}
                          </p>
                          <p>{orderData.shippingAddress.country}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Information
                      </h3>
                      {orderData.shippingAddress && (
                        <div className="text-sm">
                          <p>{orderData.shippingAddress.email}</p>
                          <p>{orderData.shippingAddress.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setLocation("/")}>
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderSummary
                    subtotal={orderData.subtotal}
                    shippingCost={shippingCost}
                    taxAmount={taxAmount}
                    total={total}
                    itemCount={orderData.items.length}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckoutForm;