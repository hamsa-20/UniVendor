import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PayoutRequestFormProps {
  availableBalance: number;
  vendorId: number;
}

const payoutFormSchema = z.object({
  amount: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Amount must be a valid number",
    })
    .refine(val => Number(val) > 0, {
      message: "Amount must be greater than zero",
    }),
  method: z.string({
    required_error: "Please select a payout method",
  }),
  notes: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof payoutFormSchema>;

const PayoutRequestForm = ({ availableBalance, vendorId }: PayoutRequestFormProps) => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      amount: "",
      method: "",
      notes: "",
    },
  });
  
  const payoutMutation = useMutation({
    mutationFn: async (values: PayoutFormValues) => {
      const payload = {
        vendorId,
        amount: values.amount,
        method: values.method,
        notes: values.notes,
        currency: "USD", // Default to USD
      };
      
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/payouts`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout requested successfully",
        description: "Your payout request has been submitted and will be processed shortly.",
      });
      
      // Reset form
      form.reset();
      setShowConfirmation(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/payouts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/earnings`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to request payout",
        description: error.message || "An error occurred while processing your request.",
        variant: "destructive",
      });
      setShowConfirmation(false);
    },
  });
  
  const onSubmit = (values: PayoutFormValues) => {
    // Validate amount against available balance
    if (Number(values.amount) > availableBalance) {
      form.setError("amount", {
        type: "manual",
        message: "Amount cannot exceed your available balance",
      });
      return;
    }
    
    // Show confirmation before submitting
    setShowConfirmation(true);
  };
  
  const confirmPayout = () => {
    payoutMutation.mutate(form.getValues());
  };
  
  return (
    <div>
      {showConfirmation ? (
        <div>
          <Alert className="mb-6">
            <AlertTitle>Confirm Payout Request</AlertTitle>
            <AlertDescription>
              You are about to request a payout of {formatCurrency(Number(form.getValues().amount))} using {form.getValues().method}.
              Are you sure you want to proceed?
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={payoutMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={confirmPayout} disabled={payoutMutation.isPending}>
              {payoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payout
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row md:space-x-6 mb-6">
            <Card className="w-full md:w-1/3 mb-4 md:mb-0">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-2">Available for payout</div>
                <div className="text-3xl font-bold">{formatCurrency(availableBalance)}</div>
              </CardContent>
            </Card>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-2/3 space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            placeholder="0.00"
                            {...field}
                            className="pl-8"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the amount you would like to withdraw
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payout method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how you would like to receive your funds
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
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional information about this payout request"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                  Request Payout
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutRequestForm;