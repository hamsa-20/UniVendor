import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from "@/components/PayPalButton";

interface PayPalCheckoutProps {
  vendorId: number;
  orderId: number;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PayPalCheckout = ({ 
  vendorId, 
  orderId,
  amount, 
  onSuccess, 
  onCancel 
}: PayPalCheckoutProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For handling successful PayPal payment
  const handlePaymentSuccess = async (paymentData: any) => {
    setLoading(true);
    try {
      // Record the payment in our database
      await apiRequest("POST", `/api/orders/${orderId}/payment`, {
        paymentId: paymentData.orderId,
        paymentMethod: "paypal",
        details: paymentData
      });
      
      toast({
        title: "Payment Successful",
        description: "Your PayPal payment has been processed successfully",
      });
      
      onSuccess();
    } catch (err: any) {
      console.error("Error processing PayPal payment:", err);
      setError("There was an issue recording your payment. Please contact support.");
      toast({
        title: "Payment Error",
        description: "We couldn't process your payment confirmation. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PayPal payment error
  const handlePaymentError = (err: any) => {
    console.error("PayPal payment error:", err);
    setError("There was a problem with your PayPal payment. Please try again or use a different payment method.");
    toast({
      title: "PayPal Error",
      description: "Your PayPal payment could not be completed. Please try again.",
      variant: "destructive",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>
            We encountered an issue with your PayPal payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PayPal Checkout</CardTitle>
        <CardDescription>
          Complete your purchase securely with PayPal
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md mx-auto">
          <PayPalButton
            amount={amount}
            currency="USD"
            intent="CAPTURE"
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="mt-4"
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
};

export default PayPalCheckout;