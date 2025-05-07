import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Edit, Trash2, Check, CreditCard, AlertCircle } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/payment-methods/${id}/set-default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default method updated",
        description: "The default payment method has been updated successfully.",
      });
      
      // Invalidate payment methods query
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-methods"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating default method",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete payment method");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Payment method deleted",
        description: "The payment method has been deleted successfully.",
      });
      
      // Invalidate payment methods query
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "payment-methods"] });
      setMethodToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting payment method",
        description: error.message,
        variant: "destructive",
      });
      setMethodToDelete(null);
    },
  });

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteMethodMutation.mutate(id);
  };

  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No payment methods</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first payment method to start accepting payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {methods.map((method) => (
        <Card key={method.id} className={!method.isActive ? "opacity-75" : ""}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{method.name}</CardTitle>
              <div className="flex gap-1">
                {method.isDefault && (
                  <Badge variant="default" className="ml-1">Default</Badge>
                )}
                {!method.isActive && (
                  <Badge variant="outline" className="ml-1">Inactive</Badge>
                )}
              </div>
            </div>
            <CardDescription>{method.type}</CardDescription>
          </CardHeader>
          <CardContent>
            {method.description && (
              <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
            )}
            {method.processingFee && (
              <div className="flex items-center mt-2 text-sm">
                <AlertCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Processing fee: {method.processingFee}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-1">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {/* TODO: Implement edit functionality */}}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              
              <AlertDialog open={methodToDelete === method.id} onOpenChange={(open) => !open && setMethodToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => setMethodToDelete(method.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete payment method</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this payment method? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(method.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {!method.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleSetDefault(method.id)}
                disabled={setDefaultMutation.isPending}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Set as default
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PaymentMethodList;