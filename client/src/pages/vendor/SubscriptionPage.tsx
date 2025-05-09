import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import { Helmet } from 'react-helmet';

export default function SubscriptionPage() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Subscription Management | LeLeKart Vendor Dashboard</title>
        <meta name="description" content="Manage your vendor subscription plan, billing cycle, and account details." />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan, billing cycle, and account details.
          </p>
        </div>

        <div className="mt-8">
          <SubscriptionManagement />
        </div>
      </div>
    </DashboardLayout>
  );
}