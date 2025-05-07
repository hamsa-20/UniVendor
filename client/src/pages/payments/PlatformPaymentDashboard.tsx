import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Filter, Calendar, PieChart, TrendingUp, CreditCard, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import DashboardHeader from "@/components/shared/DashboardHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import RevenueChart from "@/components/payments/RevenueChart";
import TransactionHistory from "@/components/payments/TransactionHistory";
import VendorPayouts from "@/components/payments/VendorPayouts";
import CommissionSettings from "@/components/payments/CommissionSettings";

const PlatformPaymentDashboard = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Fetch platform earnings summary
  const { data: earningsSummary, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ["/api/platform/earnings", { dateRange }],
  });
  
  // Fetch revenue data for chart
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/platform/revenue", { dateRange, viewType }],
  });
  
  // Fetch commission data for chart
  const { data: commissionData, isLoading: isLoadingCommission } = useQuery({
    queryKey: ["/api/platform/commissions", { dateRange }],
  });
  
  // Fetch all platform transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/platform/transactions", { dateRange }],
  });
  
  // Fetch pending payouts
  const { data: pendingPayouts, isLoading: isLoadingPendingPayouts } = useQuery({
    queryKey: ["/api/platform/payouts", { status: "pending" }],
  });
  
  if (isLoadingEarnings || !earningsSummary) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <DashboardHeader 
        title="Platform Payment Dashboard" 
        description="Monitor platform revenue, commissions, and manage vendor payouts"
      >
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </DashboardHeader>
      
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Platform Revenue</CardDescription>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {earningsSummary.revenueChange > 0 ? (
                <span className="text-green-600">+{earningsSummary.revenueChange}%</span>
              ) : (
                <span className="text-red-600">{earningsSummary.revenueChange}%</span>
              )} from previous period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Commission Earnings</CardDescription>
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.commissionRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {earningsSummary.commissionChange > 0 ? (
                <span className="text-green-600">+{earningsSummary.commissionChange}%</span>
              ) : (
                <span className="text-red-600">{earningsSummary.commissionChange}%</span>
              )} from previous period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Subscription Revenue</CardDescription>
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.subscriptionRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {earningsSummary.subscriptionChange > 0 ? (
                <span className="text-green-600">+{earningsSummary.subscriptionChange}%</span>
              ) : (
                <span className="text-red-600">{earningsSummary.subscriptionChange}%</span>
              )} from previous period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Payouts</CardDescription>
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.pendingPayouts)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {pendingPayouts?.length || 0} requests awaiting approval
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue and Commission Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Platform Revenue</CardTitle>
              <div className="flex space-x-2">
                <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingRevenue ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : revenueData ? (
              <RevenueChart data={revenueData} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Commission Distribution</CardTitle>
            <CardDescription>
              Commission earnings by vendor category
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingCommission ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : commissionData ? (
              <div className="h-full flex items-center justify-center">
                <PieChart className="h-24 w-24 text-muted-foreground opacity-50" />
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Commission chart visualization will go here</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No commission data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions, Payouts and Settings */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="transactions">Platform Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Vendor Payouts</TabsTrigger>
          <TabsTrigger value="settings">Commission Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Platform Transactions</CardTitle>
              <CardDescription>
                All platform fee collections, subscription payments, and vendor payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <TransactionHistory transactions={transactions} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Payout Requests</CardTitle>
              <CardDescription>
                Manage and process payout requests from vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPendingPayouts ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingPayouts && pendingPayouts.length > 0 ? (
                <VendorPayouts payouts={pendingPayouts} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No pending payout requests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>
                Manage platform fee structure and commission rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformPaymentDashboard;