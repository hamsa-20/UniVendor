import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Form schema for payment method
const paymentMethodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Payment type is required"),
  description: z.string().optional(),
  processingFee: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  vendorId: number;
  onSuccess?: () => void;
  initialData?: PaymentMethodFormValues;
}

const PaymentMethodForm = ({ 
  vendorId, 
  onSuccess,
  initialData 
}: PaymentMethodFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: initialData || {
      name: "",
      type: "",
      description: "",
      processingFee: "",
      isActive: true,
    },
  });

  const createMethodMutation = useMutation({
    mutationFn: async (values: PaymentMethodFormValues) => {
      const response = await fetch(`/api/vendors/${vendorId}/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment method");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment method created",
        description: "The payment method has been created successfully.",
      });
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PaymentMethodFormValues) => {
    createMethodMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Method Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Credit Card, Cash on Delivery" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this payment method.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The type of payment this method represents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide additional details about this payment method" 
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="processingFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Processing Fee</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., 2.9% + $0.30" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional processing fee information to display to customers.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Make this payment method available to customers.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createMethodMutation.isPending}
        >
          {createMethodMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Payment Method
        </Button>
      </form>
    </Form>
  );
};

export default PaymentMethodForm;