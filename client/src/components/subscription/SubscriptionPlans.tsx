import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/hooks/use-toast';

type Plan = {
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
  isDefault: boolean;
  trialDays: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
};

type SubscriptionPlanProps = {
  currentPlanId?: number | null;
  onSelectPlan: (planId: number) => void;
  billingCycle?: 'monthly' | 'yearly';
  isLoading?: boolean;
};

export default function SubscriptionPlans({
  currentPlanId,
  onSelectPlan,
  billingCycle = 'monthly',
  isLoading: isActionLoading = false,
}: SubscriptionPlanProps) {
  const { toast } = useToast();
  
  const { 
    data: plans, 
    isLoading, 
    error 
  } = useQuery<Plan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load subscription plans. Please try again later.',
      variant: 'destructive',
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-10 w-3/4 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {plans?.map((plan) => {
        const price = billingCycle === 'yearly' ? plan.yearlyPrice || plan.price : plan.price;
        const isCurrentPlan = currentPlanId === plan.id;
        const showYearlySavings = billingCycle === 'yearly' && plan.yearlyPrice && plan.price;
        
        // Calculate annual savings if on yearly plan
        const yearlySavings = showYearlySavings 
          ? parseFloat(plan.price) * 12 - parseFloat(plan.yearlyPrice || '0')
          : 0;
        
        return (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${isCurrentPlan ? 'border-primary' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{plan.name}</CardTitle>
                {plan.isDefault && (
                  <Badge variant="outline" className="bg-muted">
                    Popular
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-4">
                <div className="text-3xl font-bold">
                  {price ? formatCurrency(parseFloat(price)) : '$0'}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                
                {showYearlySavings && yearlySavings > 0 && (
                  <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <Zap size={14} />
                    Save {formatCurrency(yearlySavings)} per year
                  </div>
                )}
                
                {plan.trialDays > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Includes {plan.trialDays}-day free trial
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {plan.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              {isCurrentPlan ? (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <>Processing</>
                  ) : (
                    <>
                      Select {plan.name} <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}