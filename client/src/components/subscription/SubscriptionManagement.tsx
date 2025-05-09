import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, CreditCard, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import SubscriptionPlans from './SubscriptionPlans';

interface SubscriptionInfo {
  id: number;
  vendorId: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  renewalDate: string | null;
  billingCycle: 'monthly' | 'yearly';
  amount: string | null;
  currency: string;
  plan: {
    id: number;
    name: string;
    description: string;
    price: string;
    yearlyPrice: string | null;
    features: string[] | null;
    productLimit: number;
    storageLimit: number;
    customDomainLimit: number;
    supportLevel: string;
  };
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'plans'>('current');
  
  // Fetch current subscription data
  const { 
    data: subscription, 
    isLoading, 
    error,
    isError
  } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/vendor/subscription'],
    retry: false,
  });

  // Mutation for starting a trial
  const startTrialMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/vendor/subscription/start-trial', { planId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/subscription'] });
      setSelectedTab('current');
      toast({
        title: 'Trial started',
        description: 'Your subscription trial has been started successfully.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to start trial',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for changing plans
  const changePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/vendor/subscription/change-plan', { planId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/subscription'] });
      setSelectedTab('current');
      toast({
        title: 'Plan changed',
        description: 'Your subscription plan has been updated successfully.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to change plan',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for changing billing cycle
  const changeBillingCycleMutation = useMutation({
    mutationFn: async (billingCycle: 'monthly' | 'yearly') => {
      const res = await apiRequest('POST', '/api/vendor/subscription/change-billing-cycle', { billingCycle });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/subscription'] });
      toast({
        title: 'Billing cycle changed',
        description: 'Your billing cycle has been updated successfully.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to change billing cycle',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for canceling subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (options: { cancelAtPeriodEnd: boolean; cancelReason: string }) => {
      const res = await apiRequest('POST', '/api/vendor/subscription/cancel', options);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/subscription'] });
      setIsCancelDialogOpen(false);
      toast({
        title: 'Subscription canceled',
        description: 'Your subscription has been canceled successfully.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to cancel subscription',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Function to handle plan selection
  const handlePlanSelect = (planId: number) => {
    if (!subscription) {
      // No current subscription, start a trial
      startTrialMutation.mutate(planId);
    } else if (subscription.planId !== planId) {
      // Change the current plan
      changePlanMutation.mutate(planId);
    }
  };

  // Format a date string
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If there's no subscription or an error, show plans directly
  if (!subscription || isError) {
    return (
      <div className="space-y-6">
        {isError && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">No active subscription found</h3>
                  <p className="text-sm text-muted-foreground">
                    Please select a subscription plan below to get started with your account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose a Subscription Plan</h2>
          <SubscriptionPlans
            onSelectPlan={handlePlanSelect}
            isLoading={startTrialMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue="current"
      value={selectedTab}
      onValueChange={(value) => setSelectedTab(value as 'current' | 'plans')}
    >
      <TabsList className="mb-6">
        <TabsTrigger value="current">Current Subscription</TabsTrigger>
        <TabsTrigger value="plans">Change Plan</TabsTrigger>
      </TabsList>
      
      <TabsContent value="current">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {subscription.plan.name} Plan
                </CardTitle>
                <CardDescription>{subscription.plan.description}</CardDescription>
              </div>
              <div>{getStatusBadge(subscription.status)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Plan Details</h3>
                  <div className="text-lg font-semibold">
                    {subscription.amount 
                      ? formatCurrency(parseFloat(subscription.amount)) 
                      : formatCurrency(parseFloat(
                          subscription.billingCycle === 'yearly'
                            ? subscription.plan.yearlyPrice || subscription.plan.price
                            : subscription.plan.price
                        ))
                    }
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      /{subscription.billingCycle}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <CreditCard className="h-4 w-4" />
                    Billing cycle: {subscription.billingCycle}
                  </div>
                </div>
                
                {subscription.status === 'trialing' && subscription.trialEndsAt && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Trial Period</div>
                      <div className="text-sm text-muted-foreground">
                        Your trial ends on {formatDate(subscription.trialEndsAt)}
                      </div>
                    </div>
                  </div>
                )}
                
                {subscription.cancelAtPeriodEnd && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Subscription Ending</div>
                      <div className="text-sm text-muted-foreground">
                        Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Subscription Dates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start date:</span>
                      <span>{formatDate(subscription.startDate)}</span>
                    </div>
                    {subscription.currentPeriodStart && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current period start:</span>
                        <span>{formatDate(subscription.currentPeriodStart)}</span>
                      </div>
                    )}
                    {subscription.currentPeriodEnd && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current period end:</span>
                        <span>{formatDate(subscription.currentPeriodEnd)}</span>
                      </div>
                    )}
                    {subscription.renewalDate && !subscription.cancelAtPeriodEnd && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next renewal:</span>
                        <span>{formatDate(subscription.renewalDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Plan Limits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Products:</span>
                      <span>Up to {subscription.plan.productLimit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Storage:</span>
                      <span>{subscription.plan.storageLimit / 1000} GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custom domains:</span>
                      <span>Up to {subscription.plan.customDomainLimit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-x-4 sm:space-y-0">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              {subscription.billingCycle === 'monthly' && subscription.plan.yearlyPrice && (
                <Button 
                  variant="outline"
                  onClick={() => changeBillingCycleMutation.mutate('yearly')}
                  disabled={changeBillingCycleMutation.isPending}
                >
                  {changeBillingCycleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Switch to Yearly Billing
                </Button>
              )}
              {subscription.billingCycle === 'yearly' && (
                <Button 
                  variant="outline"
                  onClick={() => changeBillingCycleMutation.mutate('monthly')}
                  disabled={changeBillingCycleMutation.isPending}
                >
                  {changeBillingCycleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Switch to Monthly Billing
                </Button>
              )}
            </div>
            
            {!subscription.cancelAtPeriodEnd && subscription.status !== 'canceled' && (
              <Button 
                variant="outline" 
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="plans">
        <div className="space-y-6">
          <Card className="bg-muted/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Change your subscription plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a new plan below. Your billing will be prorated for the time remaining in your current billing period.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <SubscriptionPlans
            currentPlanId={subscription.planId}
            onSelectPlan={handlePlanSelect}
            billingCycle={subscription.billingCycle}
            isLoading={changePlanMutation.isPending}
          />
        </div>
      </TabsContent>
      
      {/* Cancel Subscription Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to premium features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscriptionMutation.mutate({ 
                cancelAtPeriodEnd: true,
                cancelReason: 'User requested cancellation'
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelSubscriptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}