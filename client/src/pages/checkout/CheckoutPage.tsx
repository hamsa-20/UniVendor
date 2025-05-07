import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

import CheckoutForm, { OrderData, ShippingFormValues } from "@/components/checkout/CheckoutForm";
import PaymentMethodSelector, { PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import StripeCheckout from "@/components/checkout/StripeCheckout";
import PayPalCheckout from "@/components/checkout/PayPalCheckout";
import CashOnDeliveryCheckout from "@/components/checkout/CashOnDeliveryCheckout";

const CheckoutPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Checkout state
  const [currentStep, setCurrentStep] = useState<"shipping" | "payment" | "confirmation">("shipping");
  const [shippingInfo, setShippingInfo] = useState<ShippingFormValues | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("stripe");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Generate a more readable orderNumber for display purposes
  const generateOrderNumber = () => {
    return `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
  };
  
  // Get the current vendor from the URL (in a real app, this would come from the route)
  // For this example, we'll use a dummy vendorId
  const vendorId = 1;  
  
  // Fetch the cart data
  const { 
    data: cartData, 
    isLoading: cartLoading, 
    error: cartError 
  } = useQuery({ 
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cart");
      return await response.json();
    },
  });
  
  // Handle shipping information submission
  const handleShippingComplete = (data: ShippingFormValues) => {
    setShippingInfo(data);
    setCurrentStep("payment");
  };
  
  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!cartData || !shippingInfo) return null;
      
      // Prepare order data
      const orderData = {
        vendorId,
        items: cartData.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: shippingInfo,
        orderNumber: generateOrderNumber(),
        subtotal: cartData.subtotal,
        total: cartData.total,
        status: "pending"
      };
      
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/orders`, orderData);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data && data.id) {
        setOrderId(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create order",
        description: error.message || "There was an error creating your order. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Function to handle payment completion
  const handlePaymentComplete = (paymentId: string) => {
    // Update order status to paid
    setProcessingPayment(false);
    setCurrentStep("confirmation");
    
    // In a real application, invalidate the cart query to refresh it
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
  };
  
  // Function to handle payment cancellation
  const handlePaymentCancel = () => {
    setProcessingPayment(false);
  };
  
  // If we're at the payment step and we don't have an orderId yet, create one
  useEffect(() => {
    if (currentStep === "payment" && !orderId && !createOrderMutation.isPending) {
      createOrderMutation.mutate();
    }
  }, [currentStep, orderId, createOrderMutation]);
  
  // Redirect to cart if cart is empty
  useEffect(() => {
    if (cartData && (!cartData.items || cartData.items.length === 0) && !cartLoading) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some items before checkout.",
      });
      setLocation("/cart");
    }
  }, [cartData, cartLoading, toast, setLocation]);
  
  // Handle loading and error states
  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading your cart...</p>
        </div>
      </div>
    );
  }
  
  if (cartError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <p className="font-semibold">Error loading cart</p>
            <p className="text-sm mt-2">There was an error loading your cart information. Please try again.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mr-2">
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/cart">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Return to Cart
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Placeholder for order data - in a real app, this would come from an API call
  const orderData: OrderData = {
    id: orderId || 0,
    vendorId,
    customerId: user?.id || 0,
    items: cartData?.items || [],
    subtotal: cartData?.subtotal || "0.00",
    total: cartData?.total || "0.00",
    status: "pending",
    orderNumber: generateOrderNumber(),
    shippingAddress: shippingInfo || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  };
  
  // Available payment methods - in a real app, this would come from vendor settings
  const availablePaymentMethods: PaymentMethod[] = ["stripe", "paypal", "manual"];
  
  // Render the appropriate payment method component based on selection
  const renderPaymentMethod = () => {
    if (processingPayment) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    switch (selectedPaymentMethod) {
      case "stripe":
        return (
          <StripeCheckout
            vendorId={vendorId}
            orderId={orderId || 0}
            amount={orderData.total}
            onSuccess={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        );
      case "paypal":
        return (
          <PayPalCheckout
            vendorId={vendorId}
            orderId={orderId || 0}
            amount={orderData.total}
            onSuccess={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        );
      case "manual":
        return (
          <CashOnDeliveryCheckout
            orderId={orderId || 0}
            total={orderData.total}
            onSuccess={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        );
      default:
        return (
          <div className="text-center p-8">
            <p>Please select a payment method</p>
          </div>
        );
    }
  };
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <CheckoutForm
        vendorId={vendorId}
        orderData={orderData}
        onShippingComplete={handleShippingComplete}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        onPaymentComplete={handlePaymentComplete}
        onPaymentCancel={handlePaymentCancel}
        availablePaymentMethods={availablePaymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        currentStep={currentStep}
        processingPayment={processingPayment}
      />
      
      {/* Render payment method selector and payment component */}
      {currentStep === "payment" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            <PaymentMethodSelector
              vendorId={vendorId}
              availableMethods={availablePaymentMethods}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={handlePaymentMethodSelect}
            />
            
            <div className="mt-6">
              {renderPaymentMethod()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;