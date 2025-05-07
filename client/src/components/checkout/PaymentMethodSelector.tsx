import { useState } from "react";
import { CardContent, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { SiPaypal, SiStripe } from "react-icons/si";

export type PaymentMethod = "stripe" | "paypal" | "bank_transfer" | "manual"; // manual = Cash on Delivery (COD)

interface PaymentMethodSelectorProps {
  vendorId: number;
  availableMethods: PaymentMethod[];
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PaymentMethodSelector = ({
  vendorId,
  availableMethods,
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) => {
  // Helper function to check if a method is available
  const isMethodAvailable = (method: PaymentMethod) => availableMethods.includes(method);

  // Payment method item styling
  const methodItemClass = "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all";
  const methodItemActiveClass = `${methodItemClass} border-primary bg-primary/5`;
  const methodItemInactiveClass = `${methodItemClass} border-border hover:border-primary/50`;
  const methodItemDisabledClass = `${methodItemClass} border-border opacity-50 cursor-not-allowed`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Select your preferred payment method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onSelectMethod(value as PaymentMethod)}
          className="space-y-4"
        >
          {/* Credit/Debit Card (Stripe) */}
          <div 
            className={
              isMethodAvailable("stripe")
                ? selectedMethod === "stripe"
                  ? methodItemActiveClass
                  : methodItemInactiveClass
                : methodItemDisabledClass
            }
            onClick={() => isMethodAvailable("stripe") && onSelectMethod("stripe")}
          >
            <RadioGroupItem 
              value="stripe" 
              id="stripe" 
              disabled={!isMethodAvailable("stripe")} 
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <SiStripe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Label htmlFor="stripe" className="font-medium">
                    Credit/Debit Card
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pay securely with your card
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div 
            className={
              isMethodAvailable("paypal")
                ? selectedMethod === "paypal"
                  ? methodItemActiveClass
                  : methodItemInactiveClass
                : methodItemDisabledClass
            }
            onClick={() => isMethodAvailable("paypal") && onSelectMethod("paypal")}
          >
            <RadioGroupItem 
              value="paypal" 
              id="paypal" 
              disabled={!isMethodAvailable("paypal")}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <SiPaypal className="h-6 w-6 text-blue-800" />
                </div>
                <div>
                  <Label htmlFor="paypal" className="font-medium">
                    PayPal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pay with your PayPal account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div 
            className={
              isMethodAvailable("bank_transfer")
                ? selectedMethod === "bank_transfer"
                  ? methodItemActiveClass
                  : methodItemInactiveClass
                : methodItemDisabledClass
            }
            onClick={() => isMethodAvailable("bank_transfer") && onSelectMethod("bank_transfer")}
          >
            <RadioGroupItem 
              value="bank_transfer" 
              id="bank_transfer" 
              disabled={!isMethodAvailable("bank_transfer")}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <Landmark className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="bank_transfer" className="font-medium">
                    Bank Transfer
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pay via bank wire transfer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Payment */}
          <div 
            className={
              isMethodAvailable("manual")
                ? selectedMethod === "manual"
                  ? methodItemActiveClass
                  : methodItemInactiveClass
                : methodItemDisabledClass
            }
            onClick={() => isMethodAvailable("manual") && onSelectMethod("manual")}
          >
            <RadioGroupItem 
              value="manual" 
              id="manual" 
              disabled={!isMethodAvailable("manual")}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-md">
                  <Wallet className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="manual" className="font-medium">
                    Pay on Delivery
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pay cash or card when your order arrives
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;