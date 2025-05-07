import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, CreditCard, Settings, ChevronsUpDown, ChevronDown } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import DashboardHeader from "@/components/shared/DashboardHeader";
import PaymentMethodList from "@/components/payments/PaymentMethodList";
import PaymentMethodForm from "@/components/payments/PaymentMethodForm";
import PaymentProviderForm from "@/components/payments/PaymentProviderForm";

const PaymentSettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  
  // Fetch vendor payment methods
  const { 
    data: paymentMethods = [],
    isLoading: isLoadingMethods,
    error: methodsError 
  } = useQuery({
    queryKey: ["/api/vendors", user?.id, "payment-methods"],
    enabled: !!user?.id,
  });
  
  // Fetch vendor payment providers
  const { 
    data: stripeSettings,
    isLoading: isLoadingStripe,
  } = useQuery({
    queryKey: ["/api/vendors", user?.id, "payment-providers", "stripe"],
    enabled: !!user?.id,
  });
  
  const { 
    data: paypalSettings,
    isLoading: isLoadingPaypal,
  } = useQuery({
    queryKey: ["/api/vendors", user?.id, "payment-providers", "paypal"],
    enabled: !!user?.id,
  });
  
  // Fetch vendor commission settings
  const { 
    data: commissionSettings,
    isLoading: isLoadingCommissionSettings,
    error: commissionError 
  } = useQuery({
    queryKey: ["/api/payments/commission-settings"],
    enabled: !!user?.id,
  });
  
  // Form schema for commission thresholds
  const thresholdFormSchema = z.object({
    baseFeePercentage: z.string().min(1, "Required"),
    transactionFeeFlat: z.string().min(1, "Required"),
    thresholds: z.array(
      z.object({
        threshold: z.string().min(1, "Required"),
        percentage: z.string().min(1, "Required"),
      })
    ),
  });
  
  type ThresholdFormValues = z.infer<typeof thresholdFormSchema>;
  
  const form = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdFormSchema),
    defaultValues: {
      baseFeePercentage: commissionSettings?.baseFeePercentage || "2.9",
      transactionFeeFlat: commissionSettings?.transactionFeeFlat || "0.30",
      thresholds: commissionSettings?.thresholds || [
        { threshold: "1000", percentage: "2.5" },
        { threshold: "10000", percentage: "2.2" },
        { threshold: "50000", percentage: "1.9" },
      ],
    },
  });
  
  const isLoading = isLoadingMethods || isLoadingStripe || isLoadingPaypal || isLoadingCommissionSettings;
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (methodsError || commissionError) {
    toast({
      title: "Error loading payment settings",
      description: "There was a problem loading your payment settings.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="container mx-auto p-6">
      <DashboardHeader 
        title="Payment Settings" 
        description="Manage your store's payment methods and provider integrations"
      />
      
      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="providers">Payment Providers</TabsTrigger>
          <TabsTrigger value="fees">Fees & Commission</TabsTrigger>
          <TabsTrigger value="payouts">Payout Settings</TabsTrigger>
        </TabsList>
        
        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Payment Methods</h2>
            <Dialog open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Create a new payment method that your customers can use at checkout.
                  </DialogDescription>
                </DialogHeader>
                <PaymentMethodForm
                  vendorId={user?.id}
                  onSuccess={() => setIsAddMethodOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <PaymentMethodList 
            methods={paymentMethods || []} 
            vendorId={user?.id}
          />
        </TabsContent>
        
        {/* Payment Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Integration</CardTitle>
              <CardDescription>
                Connect your Stripe account to accept credit card payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Status: {stripeSettings?.isActive ? "Connected" : "Not Connected"}</h4>
                  {stripeSettings?.isActive && (
                    <p className="text-sm text-muted-foreground">
                      Connected with account ending in {stripeSettings.configData?.publicKey?.slice(-4)}
                    </p>
                  )}
                </div>
                <PaymentProviderForm 
                  vendorId={user?.id}
                  provider="stripe"
                  existingSettings={stripeSettings}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>PayPal Integration</CardTitle>
              <CardDescription>
                Connect your PayPal account to accept PayPal payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Status: {paypalSettings?.isActive ? "Connected" : "Not Connected"}</h4>
                  {paypalSettings?.isActive && (
                    <p className="text-sm text-muted-foreground">
                      Connected with account ID {paypalSettings.configData?.clientId?.slice(-6)}
                    </p>
                  )}
                </div>
                <PaymentProviderForm 
                  vendorId={user?.id}
                  provider="paypal"
                  existingSettings={paypalSettings}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Fees & Commission Tab */}
        <TabsContent value="fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Fees & Commission</CardTitle>
              <CardDescription>
                View the current fee structure applied to your sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Base Fee</h4>
                    <div className="text-2xl font-bold">{commissionSettings?.baseFeePercentage || "2.9"}%</div>
                    <p className="text-sm text-muted-foreground">
                      Standard commission on all transactions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Processing Fee</h4>
                    <div className="text-2xl font-bold">${commissionSettings?.transactionFeeFlat || "0.30"}</div>
                    <p className="text-sm text-muted-foreground">
                      Flat fee per transaction
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Volume Discounts</h4>
                  <div className="space-y-3">
                    {(commissionSettings?.thresholds || []).map((threshold, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-md">
                        <div>
                          <div className="text-xs text-muted-foreground">Monthly Sales</div>
                          <div className="font-medium">${threshold.threshold}+</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Fee</div>
                          <div className="font-medium">{threshold.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fee Calculator</CardTitle>
              <CardDescription>
                Calculate your estimated fees based on a transaction amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="grow">
                  <label className="text-sm font-medium mb-1 block">Transaction Amount</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                    <Input type="number" className="pl-8" placeholder="100.00" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">&nbsp;</label>
                  <Button className="mt-1">Calculate</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Platform Fee</div>
                  <div className="text-lg font-semibold">$2.90</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Processing Fee</div>
                  <div className="text-lg font-semibold">$0.30</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">You Receive</div>
                  <div className="text-lg font-semibold">$96.80</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payout Settings Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive payouts from your sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Payout Schedule</h3>
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Weekly</div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Payouts are processed every Monday for the previous week's sales.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Minimum Payout</h3>
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">$100.00</div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Payouts will be held until your balance reaches this amount.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Payout Method</h3>
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Bank Account (ACH)</div>
                        <div className="text-sm text-muted-foreground">Ending in 1234</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-4">Payout History</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-3 text-sm">May 1, 2023</td>
                        <td className="px-4 py-3 text-sm font-medium">$1,245.00</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">April 24, 2023</td>
                        <td className="px-4 py-3 text-sm font-medium">$987.50</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">April 17, 2023</td>
                        <td className="px-4 py-3 text-sm font-medium">$1,102.25</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-4">
                  <Button variant="outline">View All Payouts</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettingsPage;