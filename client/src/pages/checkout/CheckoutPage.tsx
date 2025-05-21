import { useState, useEffect } from "react";
import { useLocation, useRoute, Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import StripeCheckout from "@/components/checkout/StripeCheckout";
import PayPalCheckout from "@/components/checkout/PayPalCheckout";
import { useAuth } from "@/contexts/AuthContext";

// Types
type CheckoutStep = "cart" | "details" | "payment" | "confirmation";
type PaymentProcessor = "stripe" | "paypal" | "manual";

// Helper function to format currency
const formatCurrency = (amount: string | number, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
};

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendors/:vendorId/checkout");
  const vendorId = params?.vendorId ? parseInt(params.vendorId) : null;
  
  // State
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentProcessor, setPaymentProcessor] = useState<PaymentProcessor | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Fetch cart data
  const { 
    data: cart, 
    isLoading: cartLoading, 
    error: cartError 
  } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!vendorId,
  });
  
  // Fetch vendor data
  const { 
    data: vendor, 
    isLoading: vendorLoading, 
    error: vendorError 
  } = useQuery({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with checkout",
        variant: "destructive",
      });
      setLocation(`/login?redirect=/vendors/${vendorId}/checkout`);
    }
  }, [isAuthenticated, vendorId, setLocation, toast]);
  
  // If not authenticated, don't render the page
  if (!isAuthenticated) {
    return null;
  }
  
  // Determine payment processor when payment method changes
  useEffect(() => {
    if (paymentMethod) {
      // In a real app, you would fetch the payment method details to determine the processor
      if (paymentMethod === "1") {
        setPaymentProcessor("stripe");
      } else if (paymentMethod === "2") {
        setPaymentProcessor("paypal");
      } else {
        setPaymentProcessor("manual");
      }
    }
  }, [paymentMethod]);
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch(`/api/vendors/${vendorId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.id);
      setStep("payment");
      
      toast({
        title: "Order created",
        description: "Your order has been created. Please complete the payment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating order",
        description: error.message || "There was a problem creating your order.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateOrder = (formData: any) => {
    createOrderMutation.mutate({
      ...formData,
      items: cart?.items,
      subtotal: cart?.subtotal,
      total: cart?.total,
      vendorId,
      paymentMethodId: paymentMethod,
    });
  };
  
  const handlePaymentSuccess = (paymentId: string) => {
    // In a real app, update the order with payment details
    toast({
      title: "Payment completed",
      description: "Your payment has been processed successfully.",
    });
    setStep("confirmation");
  };
  
  const handlePaymentCancel = () => {
    setStep("details");
  };
  
  // Loading state
  if (cartLoading || vendorLoading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading checkout...</span>
      </div>
    );
  }
  
  // Error state
  if (cartError || vendorError) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading the checkout information. Please try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link to={`/vendors/${vendorId}`}>Return to Store</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if cart is empty
  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Cart is Empty</CardTitle>
            <CardDescription>
              You don't have any items in your cart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/vendors/${vendorId}`}>Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          asChild
        >
          <Link to={`/vendors/${vendorId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{vendor?.name || "Checkout"}</h1>
        <p className="text-muted-foreground">
          Complete your purchase by following the steps below
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === "cart" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shopping Cart</CardTitle>
                  <CardDescription>
                    Review your items before proceeding to checkout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart?.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center">
                          {item.imageUrl && (
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-4">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.price)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity > 1 ? `${formatCurrency(parseFloat(item.price) * item.quantity)} total` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={() => setStep("details")}>Proceed to Checkout</Button>
              </div>
            </div>
          )}
          
          {step === "details" && (
            <CheckoutForm 
              vendorId={vendorId || 0}
              cart={cart}
              onSuccess={handleCreateOrder}
            />
          )}
          
          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>
                  Complete your payment to finalize your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Select Payment Method</h3>
                    <PaymentMethodSelector
                      vendorId={vendorId || 0}
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                    />
                  </div>
                  
                  <Separator />
                  
                  {paymentProcessor === "stripe" && orderId && (
                    <StripeCheckout
                      vendorId={vendorId || 0}
                      amount={parseFloat(cart?.total || "0") * 100} // Convert to cents
                      currency="INR"
                      orderId={orderId}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handlePaymentCancel}
                    />
                  )}
                  
                  {paymentProcessor === "paypal" && orderId && (
                    <PayPalCheckout
                      vendorId={vendorId || 0}
                      amount={cart?.total || "0"}
                      currency="INR"
                      orderId={orderId}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handlePaymentCancel}
                    />
                  )}
                  
                  {paymentProcessor === "manual" && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertTitle>Manual Payment</AlertTitle>
                        <AlertDescription>
                          This order requires manual payment processing. Please contact the store for payment instructions.
                        </AlertDescription>
                      </Alert>
                      <Button onClick={() => handlePaymentSuccess("manual")}>
                        Mark as Paid (Demo)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {step === "confirmation" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Order Confirmed!</CardTitle>
                <CardDescription>
                  Thank you for your purchase. Your order has been received and is being processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-center">
                    We have sent a confirmation email to your inbox with the order details.
                  </p>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Order Number:</span>
                        <span className="font-medium">{orderId || "ORD12345"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Date:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(cart?.total || "0")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button asChild variant="outline">
                      <Link to={`/vendors/${vendorId}`}>
                        Continue Shopping
                      </Link>
                    </Button>
                    {user && (
                      <Button asChild>
                        <Link to="/account/orders">
                          View Orders
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {cart?.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity} x {item.name}</span>
                        <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cart?.subtotal || "0")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(parseFloat(cart?.subtotal || "0") * 0.0825)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(cart?.total || "0")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;