import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Loader2, PlusCircle, Trash } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const commissionFormSchema = z.object({
  baseFeePercentage: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Must be a valid number",
    })
    .refine(val => Number(val) >= 0 && Number(val) <= 100, {
      message: "Must be between 0 and 100",
    }),
  transactionFeeFlat: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Must be a valid number",
    })
    .refine(val => Number(val) >= 0, {
      message: "Must be a positive number",
    }),
  thresholds: z.array(
    z.object({
      monthlyRevenue: z.string()
        .refine(val => !isNaN(Number(val)), {
          message: "Must be a valid number",
        })
        .refine(val => Number(val) > 0, {
          message: "Must be greater than 0",
        }),
      feePercentage: z.string()
        .refine(val => !isNaN(Number(val)), {
          message: "Must be a valid number",
        })
        .refine(val => Number(val) >= 0 && Number(val) <= 100, {
          message: "Must be between 0 and 100",
        }),
    })
  ).min(1, "At least one threshold is required"),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

const CommissionSettings = () => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Fetch current commission settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/payments/commission-settings"],
  });
  
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      baseFeePercentage: settings?.baseFeePercentage || "2.5",
      transactionFeeFlat: settings?.transactionFeeFlat || "0.30",
      thresholds: settings?.thresholds || [
        { monthlyRevenue: "1000", feePercentage: "2.5" },
        { monthlyRevenue: "5000", feePercentage: "2.25" },
        { monthlyRevenue: "10000", feePercentage: "2.0" },
      ],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "thresholds",
  });
  
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (values: CommissionFormValues) => {
      const response = await apiRequest("PUT", "/api/payments/commission-settings", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Commission settings have been updated successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/payments/commission-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: CommissionFormValues) => {
    // Validate revenue thresholds are in ascending order
    const thresholds = values.thresholds.map(t => ({
      ...t,
      monthlyRevenue: Number(t.monthlyRevenue),
    })).sort((a, b) => a.monthlyRevenue - b.monthlyRevenue);
    
    // Check for duplicate thresholds
    const hasDuplicates = thresholds.some((t, i) => 
      i > 0 && t.monthlyRevenue === thresholds[i - 1].monthlyRevenue
    );
    
    if (hasDuplicates) {
      toast({
        title: "Validation error",
        description: "Monthly revenue thresholds must be unique.",
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmation(true);
  };
  
  const confirmSave = () => {
    saveSettingsMutation.mutate(form.getValues());
    setShowConfirmation(false);
  };
  
  const addThreshold = () => {
    append({ monthlyRevenue: "", feePercentage: "" });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="baseFeePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Fee Percentage</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        %
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Default fee percentage for all vendors
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
                  <FormLabel>Transaction Fee (Flat)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        $
                      </div>
                      <Input
                        {...field}
                        className="pl-8"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Fixed fee added to each transaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Revenue Thresholds</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addThreshold}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Threshold
              </Button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`thresholds.${index}.monthlyRevenue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Revenue Threshold</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                $
                              </div>
                              <Input
                                {...field}
                                className="pl-8"
                                type="number"
                                min="0"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            When monthly revenue exceeds this amount
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`thresholds.${index}.feePercentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Percentage</FormLabel>
                          <FormControl>
                            <div className="relative flex items-center">
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                %
                              </div>
                              
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 text-destructive hover:text-destructive/90"
                                  onClick={() => remove(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Applied fee rate for this threshold
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={saveSettingsMutation.isPending || !form.formState.isDirty}
            className="w-full md:w-auto"
          >
            {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Commission Settings
          </Button>
        </form>
      </Form>
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the commission settings? This will affect all vendors and future transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionSettings;