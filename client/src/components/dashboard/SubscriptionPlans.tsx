import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SubscriptionPlans = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage platform subscription plans for vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div className="p-6">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-8 w-32 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="px-6 pt-2 pb-6">
                  <Skeleton className="h-4 w-32 mb-4" />
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage platform subscription plans for vendors</CardDescription>
        </div>
        <Button>
          Create New Plan
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan) => (
            <div key={plan.id} className={`
              bg-white rounded-lg shadow-sm border overflow-hidden
              ${plan.name === 'Pro' ? 'border-2 border-primary relative' : 'border-gray-200'}
            `}>
              {plan.name === 'Pro' && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">Popular</div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold">${parseFloat(plan.price).toFixed(2)}</span>
                  <span className="ml-1 text-gray-500">/month</span>
                </div>
                <p className="mt-5 text-sm text-gray-500">{plan.description}</p>
              </div>
              <div className="px-6 pt-3 pb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Features:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex text-sm">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {/* This would be a query to count vendors with this plan */}
                    {plan.name === 'Free' ? '12 vendors' : 
                     plan.name === 'Basic' ? '45 vendors' : 
                     plan.name === 'Pro' ? '156 vendors' : 
                     '41 vendors'}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlans;
