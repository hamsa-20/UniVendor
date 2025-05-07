import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, CreditCard, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CashOnDeliveryCheckoutProps {
  orderId: number;
  total: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const CashOnDeliveryCheckout = ({
  orderId,
  total,
  onSuccess,
  onCancel
}: CashOnDeliveryCheckoutProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<"cash" | "card">("cash");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Record the COD payment in our database
      const response = await apiRequest("POST", `/api/orders/${orderId}/payment`, {
        paymentMethod: "manual",
        paymentOption,
        notes,
        status: "pending" // COD payments are pending until delivery
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process order");
      }

      const paymentData = await response.json();
      
      toast({
        title: "Order Confirmed",
        description: "Your order has been placed successfully. Payment will be collected upon delivery.",
      });
      
      // Use the order ID as the payment ID for tracking
      onSuccess(`cod-${orderId}`);
    } catch (err: any) {
      console.error("Error processing Cash on Delivery order:", err);
      setError(err.message || "There was an issue processing your order. Please try again.");
      toast({
        title: "Order Error",
        description: "We couldn't process your Cash on Delivery request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          Pay on Delivery
        </CardTitle>
        <CardDescription>
          Pay with cash or card when your order arrives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="payment-option">Payment Option</Label>
            <RadioGroup
              value={paymentOption}
              onValueChange={(value) => setPaymentOption(value as "cash" | "card")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center cursor-pointer w-full">
                  <div className="bg-green-100 p-2 rounded-md mr-3">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cash</p>
                    <p className="text-sm text-muted-foreground">Pay with cash when your order arrives</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer w-full">
                  <div className="bg-blue-100 p-2 rounded-md mr-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Card on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay with card when your order arrives</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions for delivery?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Payment on Delivery</AlertTitle>
            <AlertDescription className="text-amber-700">
              You'll be charged ${total} when your order is delivered.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Back
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Place Order
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CashOnDeliveryCheckout;