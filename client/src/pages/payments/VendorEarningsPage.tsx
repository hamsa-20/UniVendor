import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Filter, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import DashboardHeader from "@/components/shared/DashboardHeader";
import RevenueChart from "@/components/payments/RevenueChart";
import TransactionHistory from "@/components/payments/TransactionHistory";
import PayoutRequestForm from "@/components/payments/PayoutRequestForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VendorEarningsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Fetch vendor details
  const { data: vendor } = useQuery({
    queryKey: ["/api/vendors/current"],
    enabled: !!user?.id,
  });
  
  // Fetch earnings summary
  const { data: earningsSummary, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "earnings", { dateRange }],
    enabled: !!vendor?.id,
  });
  
  // Fetch revenue data for chart
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "revenue", { dateRange, viewType }],
    enabled: !!vendor?.id,
  });
  
  // Fetch transaction history
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "transactions", { dateRange }],
    enabled: !!vendor?.id,
  });
  
  // Fetch payout history
  const { data: payouts, isLoading: isLoadingPayouts } = useQuery({
    queryKey: ["/api/vendors", vendor?.id, "payouts"],
    enabled: !!vendor?.id,
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
        title="Earnings Dashboard" 
        description="Track your earnings, request payouts, and view transaction history"
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
      
      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
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
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">{earningsSummary.totalOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {earningsSummary.ordersChange > 0 ? (
                <span className="text-green-600">+{earningsSummary.ordersChange}%</span>
              ) : (
                <span className="text-red-600">{earningsSummary.ordersChange}%</span>
              )} from previous period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Balance</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.availableBalance)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Ready for payout
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(earningsSummary.processingBalance)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Will be available in 7 days
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Revenue Overview</CardTitle>
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
      
      {/* Transactions and Payouts */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="request">Request Payout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your sales, refunds, and platform fees
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
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Track the status of your payout requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayouts ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payouts && payouts.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Method</th>
                        <th className="px-6 py-3">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">{new Date(payout.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium">{formatCurrency(payout.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium 
                              ${payout.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                payout.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                payout.status === 'failed' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">{payout.method}</td>
                          <td className="px-6 py-4">{payout.gatewayPayoutId || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No payout history found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
              <CardDescription>
                Request a payout of your available balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutRequestForm 
                availableBalance={earningsSummary.availableBalance} 
                vendorId={vendor?.id} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorEarningsPage;