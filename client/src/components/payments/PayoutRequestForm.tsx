import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Validation schema
const payoutRequestSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Amount must be a valid number",
    })
    .refine(val => parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  accountType: z.string().min(1, "Account type is required"),
  accountDetails: z.string().min(1, "Account details are required"),
  notes: z.string().optional(),
});

type PayoutRequestValues = z.infer<typeof payoutRequestSchema>;

interface PayoutRequestFormProps {
  vendorId: number;
  availableBalance: string;
  onSuccess?: () => void;
}

const PayoutRequestForm: React.FC<PayoutRequestFormProps> = ({
  vendorId,
  availableBalance,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set up form with validation
  const form = useForm<PayoutRequestValues>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amount: "",
      accountType: "",
      accountDetails: "",
      notes: "",
    },
  });

  // Handle payout request submission
  const payoutMutation = useMutation({
    mutationFn: async (values: PayoutRequestValues) => {
      // Format data for API
      const requestData = {
        vendorId,
        amount: values.amount,
        status: "pending",
        paymentMethod: values.accountType,
        accountDetails: values.accountDetails,
        notes: values.notes || null,
      };
      
      const response = await apiRequest(
        "POST",
        `/api/vendors/${vendorId}/payouts`,
        requestData
      );
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout request submitted",
        description: "Your payout request has been submitted for review.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/payouts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/earnings`] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit payout request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: PayoutRequestValues) => {
    // Check if requested amount exceeds available balance
    if (parseFloat(values.amount) > parseFloat(availableBalance)) {
      toast({
        title: "Invalid amount",
        description: "Payout amount cannot exceed your available balance.",
        variant: "destructive",
      });
      return;
    }
    
    payoutMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payout</CardTitle>
        <CardDescription>
          Available balance: <span className="font-medium">${parseFloat(availableBalance).toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        placeholder="0.00"
                        {...field}
                        className="pl-7"
                        type="text"
                        inputMode="decimal"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the amount you'd like to withdraw.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how you want to receive your funds.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your payment details..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch("accountType") === "bank_transfer" && "Enter your bank name, account number, and routing number."}
                    {form.watch("accountType") === "paypal" && "Enter your PayPal email address."}
                    {form.watch("accountType") === "venmo" && "Enter your Venmo username or phone number."}
                    {form.watch("accountType") === "zelle" && "Enter your Zelle email or phone number."}
                    {form.watch("accountType") === "other" && "Enter details for your preferred payment method."}
                    {!form.watch("accountType") && "Enter details for receiving your payout."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes..."
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={
                payoutMutation.isPending ||
                parseFloat(availableBalance) <= 0 ||
                !form.formState.isValid
              }
            >
              {payoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Request Payout"
              )}
            </Button>
            
            {parseFloat(availableBalance) <= 0 && (
              <p className="text-center text-sm text-muted-foreground">
                You need to have funds available to request a payout.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PayoutRequestForm;