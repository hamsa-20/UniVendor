import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PayPalButton from "@/components/payments/PayPalButton";

interface PayPalCheckoutProps {
  vendorId: number;
  amount: string;
  currency?: string;
  orderId: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

const PayPalCheckout = ({ 
  vendorId, 
  amount, 
  currency = 'USD', 
  orderId,
  onSuccess,
  onCancel
}: PayPalCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSuccess = (transactionId: string) => {
    toast({
      title: "Payment successful",
      description: "Your payment has been processed successfully.",
    });
    onSuccess(transactionId);
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      title: "Payment failed",
      description: errorMessage || "There was a problem processing your payment.",
      variant: "destructive",
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing PayPal...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>
          {error || "Unable to initialize payment. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md">
        <PayPalButton 
          amount={amount}
          currency={currency}
          intent="CAPTURE"
        />
      </div>
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default PayPalCheckout;