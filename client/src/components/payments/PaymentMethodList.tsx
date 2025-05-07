import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  processingFee?: string;
}

interface PaymentMethodListProps {
  methods: PaymentMethod[];
  vendorId: number;
}

const PaymentMethodList = ({ methods, vendorId }: PaymentMethodListProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Map payment type to friendly name
  const paymentTypeMap: { [key: string]: string } = {
    credit_card: "Credit Card",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    paypal: "PayPal",
    cod: "Cash on Delivery",
    crypto: "Cryptocurrency",
    other: "Other",
  };
  
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/vendors/${vendorId}/payment-methods/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update payment method status");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The payment method status has been updated.",
      });
      
      // Invalidate the payment methods list
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-methods"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vendors/${vendorId}/payment-methods/${id}/set-default`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to set default payment method");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default method updated",
        description: "The default payment method has been updated.",
      });
      
      // Invalidate the payment methods list
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-methods"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error setting default method",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vendors/${vendorId}/payment-methods/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete payment method");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment method deleted",
        description: "The payment method has been removed.",
      });
      
      // Invalidate the payment methods list
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-methods"] });
      
      // Reset delete ID
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting payment method",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset delete ID
      setDeleteId(null);
    },
  });
  
  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4 text-center">
            No payment methods have been added yet. Add your first payment method to start accepting payments.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {methods.map((method) => (
        <Card key={method.id} className={method.isActive ? "" : "opacity-70"}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{method.name}</CardTitle>
                <CardDescription>
                  {paymentTypeMap[method.type] || method.type}
                </CardDescription>
              </div>
              <div className="flex space-x-1">
                {method.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
                <Badge variant={method.isActive ? "default" : "outline"}>
                  {method.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {method.description && (
              <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
            )}
            {method.processingFee && (
              <p className="text-sm">
                <span className="font-medium">Processing Fee:</span> {method.processingFee}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Active</span>
              <Switch
                checked={method.isActive}
                onCheckedChange={(checked) => 
                  toggleActiveMutation.mutate({ id: method.id, isActive: checked })
                }
              />
            </div>
            <div className="flex space-x-2">
              {!method.isDefault && method.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefaultMutation.mutate(method.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <AlertDialog open={deleteId === method.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Delete"
                    onClick={() => setDeleteId(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the payment method
                      from your store and remove it from any customer's saved payment options.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteMethodMutation.mutate(method.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PaymentMethodList;