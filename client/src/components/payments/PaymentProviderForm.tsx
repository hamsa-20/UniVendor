import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

// Form schema for Stripe provider settings
const stripeSettingsSchema = z.object({
  configData: z.object({
    publicKey: z.string().min(1, "Public key is required"),
    secretKey: z.string().min(1, "Secret key is required"),
    webhookSecret: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
});

// Form schema for PayPal provider settings
const paypalSettingsSchema = z.object({
  configData: z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    webhookId: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
});

// Union type for provider settings
type ProviderSettings = {
  id?: number;
  vendorId?: number;
  provider: string;
  configData?: any;
  isActive: boolean;
};

interface PaymentProviderFormProps {
  vendorId: number;
  provider: "stripe" | "paypal";
  existingSettings?: ProviderSettings;
}

const PaymentProviderForm = ({
  vendorId,
  provider,
  existingSettings,
}: PaymentProviderFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine which schema to use based on provider
  const formSchema = provider === "stripe" ? stripeSettingsSchema : paypalSettingsSchema;
  type FormValues = z.infer<typeof formSchema>;
  
  // Prepare default values based on provider and existing settings
  const getDefaultValues = (): FormValues => {
    if (provider === "stripe") {
      return {
        configData: {
          publicKey: existingSettings?.configData?.publicKey || "",
          secretKey: existingSettings?.configData?.secretKey || "",
          webhookSecret: existingSettings?.configData?.webhookSecret || "",
        },
        isActive: existingSettings?.isActive || true,
      };
    } else {
      return {
        configData: {
          clientId: existingSettings?.configData?.clientId || "",
          clientSecret: existingSettings?.configData?.clientSecret || "",
          webhookId: existingSettings?.configData?.webhookId || "",
        },
        isActive: existingSettings?.isActive || true,
      };
    }
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch(`/api/vendors/${vendorId}/payment-providers/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save ${provider} settings`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: `${provider === "stripe" ? "Stripe" : "PayPal"} settings have been saved successfully.`,
      });
      
      // Invalidate settings query
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-providers", provider] });
      
      // Close the collapsible
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    saveSettingsMutation.mutate(values);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full">
          {existingSettings ? "Update Settings" : "Configure"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {provider === "stripe" ? (
              // Stripe-specific fields
              <>
                <FormField
                  control={form.control}
                  name="configData.publicKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publishable Key</FormLabel>
                      <FormControl>
                        <Input placeholder="pk_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Stripe publishable key starting with 'pk_'
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="configData.secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="sk_..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Your Stripe secret key starting with 'sk_'
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="configData.webhookSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="whsec_..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook secret for validating Stripe events
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              // PayPal-specific fields
              <>
                <FormField
                  control={form.control}
                  name="configData.clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Your PayPal client ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your PayPal client ID from the developer dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="configData.clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Your PayPal client secret" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Your PayPal client secret from the developer dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="configData.webhookId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your PayPal webhook ID" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Webhook ID for receiving PayPal notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable this payment provider for your store
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
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PaymentProviderForm;