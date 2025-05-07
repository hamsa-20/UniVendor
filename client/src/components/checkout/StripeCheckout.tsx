import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Load Stripe outside of the component to avoid recreating it on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  orderId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// The form displayed inside the Stripe Elements
const CheckoutForm = ({ clientSecret, orderId, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message || "An unexpected error occurred");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Record the successful payment on the server
        await apiRequest("POST", `/api/orders/${orderId}/payment`, {
          paymentIntentId: paymentIntent.id,
          paymentMethod: "stripe",
        });
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
        
        onSuccess();
      } else {
        setError("Payment status: " + (paymentIntent?.status || "unknown"));
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={processing}
        >
          Back
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || !elements || processing}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </form>
  );
};

interface StripeCheckoutProps {
  vendorId: number;
  orderId: number;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripeCheckout = ({ 
  vendorId, 
  orderId,
  amount, 
  onSuccess, 
  onCancel 
}: StripeCheckoutProps) => {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a PaymentIntent as soon as the component loads
    const fetchPaymentIntent = async () => {
      setLoading(true);
      try {
        const response = await apiRequest("POST", `/api/vendors/${vendorId}/payment/create-intent`, {
          amount,
          orderId,
          currency: "usd", // You might want to make this configurable
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment. Please try again.");
        toast({
          title: "Payment Error",
          description: "Could not initialize payment processing. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [vendorId, amount, orderId, toast]);

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
            We encountered an issue initializing your payment
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

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Payment</CardTitle>
        <CardDescription>
          Complete your purchase securely with Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clientSecret && (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm 
              clientSecret={clientSecret} 
              orderId={orderId}
              onSuccess={onSuccess} 
              onCancel={onCancel} 
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeCheckout;