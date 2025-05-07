import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Check if Stripe public key is available
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Initialize Stripe
let stripePromise: any = null;
if (stripePublicKey) {
  stripePromise = loadStripe(stripePublicKey);
}

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const CheckoutForm = ({ clientSecret, amount, currency, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment/success", // Fallback
        },
        redirect: "if_required",
      });
      
      if (error) {
        setError(error.message || "Something went wrong with your payment.");
        toast({
          title: "Payment failed",
          description: error.message || "There was a problem processing your payment.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: "Payment successful",
          description: "Your payment has been processed successfully.",
        });
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({
        title: "Payment error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)}`
          )}
        </Button>
      </div>
    </form>
  );
};

interface StripeCheckoutProps {
  vendorId: number;
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const StripeCheckout = ({ 
  vendorId, 
  amount, 
  currency = 'USD', 
  orderId,
  onSuccess,
  onCancel
}: StripeCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vendors/${vendorId}/payment/create-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency,
            orderId,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
        toast({
          title: "Payment initialization failed",
          description: err.message || "There was a problem setting up your payment.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [vendorId, amount, currency, orderId, toast]);
  
  if (!stripePromise) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          Stripe payment is not configured. Please contact the store administrator.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }
  
  if (error || !clientSecret) {
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
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm 
        clientSecret={clientSecret} 
        amount={amount} 
        currency={currency}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

export default StripeCheckout;