import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types
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
const commissionThresholdSchema = z.object({
  threshold: z.string()
    .refine(val => !isNaN(Number(val)), "Must be a valid number")
    .refine(val => Number(val) > 0, "Must be greater than 0"),
  percentage: z.string()
    .refine(val => !isNaN(Number(val)), "Must be a valid number")
    .refine(val => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100")
});

const commissionSettingsSchema = z.object({
  baseFeePercentage: z.string()
    .refine(val => !isNaN(Number(val)), "Must be a valid number")
    .refine(val => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100"),
  transactionFeeFlat: z.string()
    .refine(val => !isNaN(Number(val)), "Must be a valid number")
    .refine(val => Number(val) >= 0, "Must be greater than or equal to 0"),
  thresholds: z.array(commissionThresholdSchema)
    .optional()
    .default([])
});

type FormValues = z.infer<typeof commissionSettingsSchema>;

const CommissionSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch commission settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/payments/commission-settings'],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load commission settings",
        variant: "destructive"
      });
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      baseFeePercentage: settings?.baseFeePercentage || "5",
      transactionFeeFlat: settings?.transactionFeeFlat || "0.30",
      thresholds: settings?.thresholds || []
    },
    values: settings as FormValues
  });

  // Add new threshold row
  const addThreshold = () => {
    const currentThresholds = form.getValues("thresholds") || [];
    form.setValue("thresholds", [
      ...currentThresholds,
      { threshold: "", percentage: "" }
    ]);
  };

  // Remove threshold row
  const removeThreshold = (index: number) => {
    const currentThresholds = form.getValues("thresholds") || [];
    form.setValue("thresholds", 
      currentThresholds.filter((_, i) => i !== index)
    );
  };

  // Update settings mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("PUT", "/api/payments/commission-settings", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission settings updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/commission-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update commission settings",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <CardDescription>Configure platform fees and commission structure</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="baseFeePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Fee Percentage (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} placeholder="5.0" />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          %
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionFeeFlat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Fee (Flat)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} placeholder="0.30" />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          $
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-4">Volume Discount Thresholds</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set reduced fee percentages for vendors reaching certain monthly revenue thresholds
              </p>

              {form.watch("thresholds")?.map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`thresholds.${index}.threshold`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Revenue ($)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input {...field} placeholder="1000" />
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                $
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`thresholds.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Percentage (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input {...field} placeholder="4.5" />
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2 flex items-end">
                    <Button 
                      variant="ghost" 
                      type="button" 
                      onClick={() => removeThreshold(index)}
                      className="h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addThreshold}
                className="mt-2"
              >
                Add Threshold
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CommissionSettings;