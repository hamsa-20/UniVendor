import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Edit, Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatSubscriptionPrice } from '@/lib/formatCurrency';

interface SubscriptionPlanProps {
  onAddPlan?: () => void;
  onEditPlan?: (planId: number) => void;
  onDeletePlan?: (planId: number) => void;
}

const SubscriptionPlans = ({ onAddPlan, onEditPlan, onDeletePlan }: SubscriptionPlanProps) => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });
  
  const { data: subscriptionStats } = useQuery({
    queryKey: ['/api/subscription-stats'],
    // If this endpoint doesn't exist, you can add a fallback
    enabled: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage platform subscription plans for vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div className="p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-8 w-32 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="px-6 pt-2 pb-6">
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, featureIndex) => (
                      <Skeleton key={featureIndex} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">Subscription Plans</CardTitle>
          <CardDescription>Manage platform subscription plans for vendors</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="plans" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <Button onClick={onAddPlan} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          </div>
          
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan) => {
                // Check if it's the popular plan
                const isPopular = plan.isDefault;
                
                return (
                  <div key={plan.id} className={`
                    bg-white rounded-lg border overflow-hidden
                    ${isPopular ? 'border-blue-500 border-2' : 'border-gray-200'}
                  `}>
                    {isPopular && (
                      <div className="absolute right-0 top-0">
                        <Badge className="bg-blue-500 text-white rounded-bl-lg rounded-tr-md">
                          Popular
                        </Badge>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-bold">
                          {formatSubscriptionPrice(parseFloat(plan.price), 'monthly')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-500">{plan.description}</p>
                    </div>
                    <div className="px-6 pb-6">
                      <ul className="space-y-2">
                        {plan.features?.map((feature, index) => (
                          <li key={index} className="flex text-sm items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {/* In production, use actual count from API */}
                          {Math.floor(Math.random() * 100)} vendors
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" 
                            onClick={() => onEditPlan && onEditPlan(plan.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm"
                            onClick={() => onDeletePlan && onDeletePlan(plan.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="rounded-md border p-8 h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Subscription analytics will be displayed here</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlans;
