import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CommissionThreshold {
  threshold: string;
  percentage: string;
}

interface CommissionSettings {
  baseFeePercentage: string;
  transactionFeeFlat: string;
  thresholds: CommissionThreshold[];
}

// Validation schema
const thresholdSchema = z.object({
  threshold: z.string()
    .min(1, "Required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a number",
    })
    .refine(val => parseFloat(val) > 0, {
      message: "Must be greater than 0",
    }),
  percentage: z.string()
    .min(1, "Required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a number",
    })
    .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: "Must be between 0-100",
    }),
});

const commissionSettingsSchema = z.object({
  baseFeePercentage: z.string()
    .min(1, "Required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a number",
    })
    .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: "Must be between 0-100",
    }),
  transactionFeeFlat: z.string()
    .min(1, "Required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Must be a number",
    })
    .refine(val => parseFloat(val) >= 0, {
      message: "Must be greater than or equal to 0",
    }),
  thresholds: z.array(thresholdSchema).optional(),
});

type FormValues = z.infer<typeof commissionSettingsSchema>;

const CommissionSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch current commission settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<CommissionSettings>({
    queryKey: ["/api/platform/commission-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/platform/commission-settings");
      return res.json();
    },
  });

  // Set up form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      baseFeePercentage: settings?.baseFeePercentage || "5",
      transactionFeeFlat: settings?.transactionFeeFlat || "0.30",
      thresholds: settings?.thresholds || [],
    },
    values: settings as FormValues,
  });

  // Handle updating commission settings
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest(
        "PATCH",
        "/api/platform/commission-settings",
        values
      );
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Commission settings have been updated successfully.",
      });
      
      setIsEditing(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/platform/commission-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  // Add a new threshold
  const addThreshold = () => {
    const currentThresholds = form.getValues("thresholds") || [];
    form.setValue("thresholds", [
      ...currentThresholds,
      { threshold: "", percentage: "" },
    ]);
  };

  // Remove a threshold
  const removeThreshold = (index: number) => {
    const currentThresholds = form.getValues("thresholds") || [];
    form.setValue("thresholds", 
      currentThresholds.filter((_, i) => i !== index)
    );
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <CardDescription>
          Configure platform fees and volume-based commission rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Base Fee Percentage</h4>
                <p className="mt-1 font-medium text-xl">
                  {parseFloat(settings?.baseFeePercentage || "0").toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Applied to all transactions
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Transaction Fee</h4>
                <p className="mt-1 font-medium text-xl">
                  ${parseFloat(settings?.transactionFeeFlat || "0").toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Flat fee per transaction
                </p>
              </div>
            </div>

            {settings?.thresholds && settings.thresholds.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Volume-Based Thresholds</h4>
                <div className="bg-muted rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4 font-medium mb-2 text-sm text-muted-foreground">
                    <div>Monthly Sales Volume</div>
                    <div>Commission Rate</div>
                  </div>
                  {settings.thresholds.map((threshold, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 py-2 border-t border-border">
                      <div>
                        ${parseFloat(threshold.threshold).toLocaleString()} and above
                      </div>
                      <div>{parseFloat(threshold.percentage).toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert>
              <AlertTitle>How fees are calculated</AlertTitle>
              <AlertDescription className="text-sm">
                For each transaction, we charge the base fee percentage of the transaction amount plus the flat transaction fee. 
                For vendors with monthly sales volumes that meet the thresholds, the lower commission rate will be applied instead of the base fee.
              </AlertDescription>
            </Alert>
            
            <Button onClick={() => setIsEditing(true)}>
              Edit Settings
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseFeePercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Fee Percentage (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" inputMode="decimal" />
                      </FormControl>
                      <FormDescription>
                        Default percentage fee for all vendors
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionFeeFlat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Transaction Fee ($)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" inputMode="decimal" />
                      </FormControl>
                      <FormDescription>
                        Fixed amount added to each transaction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Volume-Based Thresholds</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addThreshold}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Threshold
                  </Button>
                </div>
                
                {form.watch("thresholds")?.length === 0 ? (
                  <div className="bg-muted/50 rounded-md p-6 text-center">
                    <p className="text-muted-foreground">
                      No volume-based thresholds configured. 
                      Add thresholds to offer lower commission rates to high-volume vendors.
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addThreshold}
                      className="mt-2"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Threshold
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.watch("thresholds")?.map((_, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 rounded-md border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`thresholds.${index}.threshold`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Sales Volume ($)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="text" inputMode="decimal" />
                                </FormControl>
                                <FormDescription>
                                  Sales amount to trigger this rate
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`thresholds.${index}.percentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commission Rate (%)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="text" inputMode="decimal" />
                                </FormControl>
                                <FormDescription>
                                  Rate for sales above threshold
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeThreshold(index)}
                          className="mt-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default CommissionSettings;