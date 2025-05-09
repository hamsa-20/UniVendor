import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Define address form schema
const addressFormSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface CustomerAddress {
  id: number;
  customerId: number;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean | null;
  createdAt: string;
}

interface AddressFormProps {
  vendorId: number;
  onComplete: () => void;
  onCancel: () => void;
  addressData?: CustomerAddress;
}

export function AddressForm({ vendorId, onComplete, onCancel, addressData }: AddressFormProps) {
  const { toast } = useToast();
  const isEditing = !!addressData;

  // Create form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      addressLine1: addressData?.addressLine1 || "",
      addressLine2: addressData?.addressLine2 || "",
      city: addressData?.city || "",
      state: addressData?.state || "",
      postalCode: addressData?.postalCode || "",
      country: addressData?.country || "India",
      isDefault: addressData?.isDefault || false,
    },
  });

  // Create address mutation
  const createAddress = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      const res = await apiRequest("POST", "/api/addresses", {
        ...data,
        vendorId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', vendorId] });
      toast({
        title: "Address saved",
        description: "Your address has been saved successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Update address mutation
  const updateAddress = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      const res = await apiRequest("PUT", `/api/addresses/${addressData?.id}`, {
        ...data,
        vendorId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', vendorId] });
      toast({
        title: "Address updated",
        description: "Your address has been updated successfully",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Submit handler
  const onSubmit = (values: AddressFormValues) => {
    if (isEditing) {
      updateAddress.mutate(values);
    } else {
      createAddress.mutate(values);
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Address" : "Add New Address"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="addressLine1"
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
              name="addressLine2"
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
                name="city"
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
                name="state"
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
                name="postalCode"
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
                name="country"
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
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default address</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Address" : "Save Address"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}