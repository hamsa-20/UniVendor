import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  processingFee?: string;
}

interface PaymentMethodSelectorProps {
  vendorId: number;
  value: string;
  onChange: (value: string) => void;
}

const PaymentMethodSelector = ({ vendorId, value, onChange }: PaymentMethodSelectorProps) => {
  const { data: paymentMethods, isLoading, error } = useQuery({
    queryKey: ["/api/vendors", vendorId, "payment-methods"],
    enabled: !!vendorId,
  });
  
  // Set default payment method if available
  useEffect(() => {
    if (paymentMethods?.length && !value) {
      const defaultMethod = paymentMethods.find((method: PaymentMethod) => method.isDefault);
      if (defaultMethod) {
        onChange(defaultMethod.id.toString());
      } else if (paymentMethods[0]) {
        onChange(paymentMethods[0].id.toString());
      }
    }
  }, [paymentMethods, value, onChange]);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load payment methods. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Payment Methods</AlertTitle>
        <AlertDescription>
          No payment methods are available for this vendor.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Helper function to get icon based on payment type
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "credit_card":
        return <CreditCard className="h-4 w-4" />;
      case "paypal":
        return <span className="text-[#0070ba] font-semibold">PayPal</span>;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };
  
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="space-y-2"
    >
      {paymentMethods.map((method: PaymentMethod) => (
        <div
          key={method.id}
          className={`flex items-center space-x-2 rounded-md border p-4 ${
            value === method.id.toString() ? "border-primary bg-primary/5" : ""
          }`}
        >
          <RadioGroupItem value={method.id.toString()} id={`payment-${method.id}`} />
          <Label
            htmlFor={`payment-${method.id}`}
            className="flex flex-1 items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              {getPaymentIcon(method.type)}
              <span>{method.name}</span>
              {method.isDefault && (
                <span className="inline-flex items-center ml-2 text-xs text-primary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Default
                </span>
              )}
            </div>
            {method.processingFee && (
              <span className="text-sm text-muted-foreground">
                {method.processingFee}
              </span>
            )}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default PaymentMethodSelector;