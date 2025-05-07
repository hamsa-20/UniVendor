import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import PaymentMethodList from "@/components/payments/PaymentMethodList";
import PaymentMethodForm from "@/components/payments/PaymentMethodForm";
import PaymentProviderForm from "@/components/payments/PaymentProviderForm";
import DashboardHeader from "@/components/shared/DashboardHeader";

const PaymentSettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("methods");
  const [showAddMethod, setShowAddMethod] = useState(false);

  // Get current vendor ID
  const { data: vendor, isLoading: isLoadingVendor } = useQuery({
    queryKey: ["/api/vendors/current"],
    enabled: !!user,
  });

  // Get vendor payment methods
  const { data: paymentMethods, isLoading: isLoadingMethods } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "payment-methods"],
    enabled: !!vendor?.id,
  });

  // Get payment provider settings
  const { data: stripeSettings, isLoading: isLoadingStripe } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "payment-providers", "stripe"],
    enabled: !!vendor?.id,
  });

  const { data: paypalSettings, isLoading: isLoadingPaypal } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "payment-providers", "paypal"],
    enabled: !!vendor?.id,
  });

  // Commission settings
  const { data: commissionSettings, isLoading: isLoadingCommission } = useQuery({
    queryKey: ["/api/payments/commission-settings"],
    enabled: !!user,
  });

  // Toggle payment provider active status
  const toggleProviderMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/payment-providers/${id}/toggle-active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update provider status");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Provider status updated",
        description: "The payment provider status has been updated successfully.",
      });
      
      // Invalidate provider settings queries
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendor?.id, "payment-providers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating provider status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingVendor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <h2 className="text-2xl font-semibold">Vendor not found</h2>
        <p className="text-muted-foreground">
          You need to create a vendor account to access payment settings.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader
        title="Payment Settings"
        description="Manage your store's payment settings and connected payment providers."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="providers">Payment Providers</TabsTrigger>
          <TabsTrigger value="fees">Fees & Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Available Payment Methods</h3>
            <Button onClick={() => setShowAddMethod(!showAddMethod)}>
              {showAddMethod ? "Cancel" : "Add Method"}
            </Button>
          </div>

          {showAddMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
                <CardDescription>
                  Add a new payment method to your store.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodForm 
                  vendorId={vendor.id} 
                  onSuccess={() => {
                    setShowAddMethod(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendor.id, "payment-methods"] });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {isLoadingMethods ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <PaymentMethodList 
              methods={paymentMethods || []} 
              vendorId={vendor.id}
            />
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stripe Integration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Stripe</CardTitle>
                  <CardDescription>
                    Accept credit cards and more with Stripe
                  </CardDescription>
                </div>
                {stripeSettings && (
                  <Switch
                    checked={stripeSettings.isActive}
                    onCheckedChange={(checked) => {
                      toggleProviderMutation.mutate({
                        id: stripeSettings.id,
                        isActive: checked,
                      });
                    }}
                  />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingStripe ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                ) : stripeSettings ? (
                  <div className="space-y-2">
                    <Badge variant={stripeSettings.isActive ? "default" : "outline"}>
                      {stripeSettings.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="mt-4">
                      {stripeSettings.configData?.publicKey && (
                        <p className="text-sm text-muted-foreground">Configuration complete</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Stripe is not configured</p>
                )}
              </CardContent>
              <CardFooter>
                <PaymentProviderForm 
                  vendorId={vendor.id}
                  provider="stripe"
                  existingSettings={stripeSettings}
                />
              </CardFooter>
            </Card>

            {/* PayPal Integration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>PayPal</CardTitle>
                  <CardDescription>
                    Accept PayPal payments and PayPal Credit
                  </CardDescription>
                </div>
                {paypalSettings && (
                  <Switch
                    checked={paypalSettings.isActive}
                    onCheckedChange={(checked) => {
                      toggleProviderMutation.mutate({
                        id: paypalSettings.id,
                        isActive: checked,
                      });
                    }}
                  />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingPaypal ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                ) : paypalSettings ? (
                  <div className="space-y-2">
                    <Badge variant={paypalSettings.isActive ? "default" : "outline"}>
                      {paypalSettings.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="mt-4">
                      {paypalSettings.configData?.clientId && (
                        <p className="text-sm text-muted-foreground">Configuration complete</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">PayPal is not configured</p>
                )}
              </CardContent>
              <CardFooter>
                <PaymentProviderForm 
                  vendorId={vendor.id}
                  provider="paypal"
                  existingSettings={paypalSettings}
                />
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fees & Commissions</CardTitle>
              <CardDescription>
                View the current fee structure for your sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCommission ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : commissionSettings ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Base Fee</h4>
                    <p className="text-2xl font-bold">{commissionSettings.baseFeePercentage}%</p>
                    <p className="text-sm text-muted-foreground">
                      Plus ${commissionSettings.transactionFeeFlat} per transaction
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Volume Discounts</h4>
                    <div className="border rounded-lg divide-y">
                      <div className="grid grid-cols-2 p-3 font-medium">
                        <span>Monthly Revenue</span>
                        <span>Fee Percentage</span>
                      </div>
                      {commissionSettings.thresholds.map((threshold: any, index: number) => (
                        <div className="grid grid-cols-2 p-3" key={index}>
                          <span>${threshold.monthlyRevenue}+</span>
                          <span>{threshold.feePercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Fee information not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettingsPage;