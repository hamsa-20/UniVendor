import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Define checkout form schema
const checkoutFormSchema = z.object({
  shippingAddress: z.object({
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  paymentMethod: z.enum(["cod", "paypal", "stripe"], {
    required_error: "Please select a payment method",
  }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface CheckoutFormProps {
  vendorId: number;
  onSuccess?: (orderId: number) => void;
}

export function CheckoutForm({ vendorId, onSuccess }: CheckoutFormProps) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping");

  // Create form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shippingAddress: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      },
      paymentMethod: "cod",
      notes: "",
    },
  });

  // Checkout mutation
  const checkout = useMutation({
    mutationFn: async (data: CheckoutFormValues) => {
      const res = await apiRequest("POST", "/api/checkout", {
        ...data,
        vendorId,
      });
      const result = await res.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed successfully",
        description: `Your order #${data.orderNumber} has been placed successfully`,
      });
      
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        setLocation(`/order-confirmation/${data.id}?vendorId=${vendorId}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Submit handler
  const onSubmit = (values: CheckoutFormValues) => {
    checkout.mutate(values);
  };

  // Next step handler
  const handleNextStep = () => {
    if (step === "shipping") {
      // Validate shipping fields
      const shippingValid = form.trigger("shippingAddress");
      if (shippingValid) {
        setStep("payment");
      }
    } else if (step === "payment") {
      // Validate payment fields
      const paymentValid = form.trigger("paymentMethod");
      if (paymentValid) {
        setStep("review");
      }
    }
  };

  // Previous step handler
  const handlePreviousStep = () => {
    if (step === "payment") {
      setStep("shipping");
    } else if (step === "review") {
      setStep("payment");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {step === "shipping" && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Enter your shipping address details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="shippingAddress.addressLine1"
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
                name="shippingAddress.addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleNextStep}>
                  Next: Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "payment" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cod" id="cod" />
                          <FormLabel htmlFor="cod" className="font-normal cursor-pointer">
                            Cash on Delivery (COD)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="paypal" id="paypal" disabled />
                          <FormLabel htmlFor="paypal" className="font-normal cursor-pointer text-muted-foreground">
                            PayPal (Coming Soon)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="stripe" id="stripe" disabled />
                          <FormLabel htmlFor="stripe" className="font-normal cursor-pointer text-muted-foreground">
                            Credit/Debit Card (Coming Soon)
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special instructions for your order"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handlePreviousStep}>
                  Back: Shipping
                </Button>
                <Button type="button" onClick={handleNextStep}>
                  Next: Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Order</CardTitle>
              <CardDescription>Please review your order details before placing the order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">
                  {form.getValues("shippingAddress.addressLine1")}
                  {form.getValues("shippingAddress.addressLine2") && (
                    <>
                      <br />
                      {form.getValues("shippingAddress.addressLine2")}
                    </>
                  )}
                  <br />
                  {form.getValues("shippingAddress.city")}, {form.getValues("shippingAddress.state")} {form.getValues("shippingAddress.postalCode")}
                  <br />
                  {form.getValues("shippingAddress.country")}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium">Payment Method</h3>
                <p className="text-sm text-muted-foreground">
                  {form.getValues("paymentMethod") === "cod"
                    ? "Cash on Delivery"
                    : form.getValues("paymentMethod") === "paypal"
                    ? "PayPal"
                    : "Credit/Debit Card"}
                </p>
              </div>
              {form.getValues("notes") && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium">Order Notes</h3>
                    <p className="text-sm text-muted-foreground">{form.getValues("notes")}</p>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handlePreviousStep}>
                  Back: Payment
                </Button>
                <Button type="submit" disabled={checkout.isPending}>
                  {checkout.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Place Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}