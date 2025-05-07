import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentVendors from '@/components/dashboard/RecentVendors';
import DomainList from '@/components/dashboard/DomainList';
import SubscriptionPlans from '@/components/dashboard/SubscriptionPlans';
import { Store, Globe, DollarSign, AlertCircle, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const SuperAdminDashboard = () => {
  // Fetch platform stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/platform-stats'],
  });

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Platform overview and management">
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {isLoading ? (
          // Loading skeletons for stats
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          // Actual stats cards
          <>
            <StatCard
              title="Active Vendors"
              value={stats?.totalVendors || 0}
              icon={<Store className="h-5 w-5 text-primary" />}
              change={{
                value: 12.5,
                isPositive: true,
                text: "from last month"
              }}
            />
            <StatCard
              title="Active Domains"
              value={stats?.activeDomains || 0}
              icon={<Globe className="h-5 w-5 text-secondary" />}
              change={{
                value: 8.2,
                isPositive: true,
                text: "from last month"
              }}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats?.totalRevenue.toLocaleString() || 0}`}
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              change={{
                value: 15.3,
                isPositive: true,
                text: "from last month"
              }}
            />
            <StatCard
              title="Pending Issues"
              value={stats?.pendingIssues || 0}
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              change={{
                value: 3,
                isPositive: false,
                text: "new since yesterday"
              }}
            />
          </>
        )}
      </div>

      {/* Dashboard tabs */}
      <Tabs defaultValue="vendors" className="mb-6">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-4 h-auto mb-6">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendors">
          <RecentVendors />
        </TabsContent>
        
        <TabsContent value="domains">
          <DomainList 
            onAddDomain={() => {}}
            onEditDomain={() => {}}
            onDeleteDomain={() => {}}
          />
        </TabsContent>
        
        <TabsContent value="plans">
          <SubscriptionPlans />
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Overall platform performance and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium">Revenue Over Time</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">$248,719</p>
                        <p className="text-xs text-green-600 flex items-center justify-end">
                          <BarChart className="h-3 w-3 mr-1" />
                          12.5% from previous period
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mt-4 flex items-end space-x-2">
                      {Array.from({ length: 7 }).map((_, index) => (
                        <div 
                          key={index} 
                          className="bg-primary/20 dark:bg-primary/30 relative flex-1 rounded-t-md"
                          style={{ 
                            height: `${20 + Math.random() * 80}%`,
                          }}
                        >
                          <div
                            className="absolute bottom-0 inset-x-0 bg-primary rounded-t-md"
                            style={{ height: `${60 + Math.random() * 40}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Vendor Growth */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-medium">Vendor Growth</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">254</p>
                        <p className="text-xs text-green-600 flex items-center justify-end">
                          <BarChart className="h-3 w-3 mr-1" />
                          8.2% from previous period
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mt-4 relative">
                      {/* Line chart representation */}
                      <div className="absolute inset-0">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                          <path 
                            d="M0,90 L10,85 L20,80 L30,70 L40,60 L50,55 L60,40 L70,35 L80,30 L90,20 L100,10" 
                            fill="none" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth="2"
                          />
                          <path 
                            d="M0,90 L10,85 L20,80 L30,70 L40,60 L50,55 L60,40 L70,35 L80,30 L90,20 L100,10" 
                            fill="hsl(var(--primary)/0.1)" 
                            strokeWidth="0"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Distribution and activity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Subscription Plan Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-40 mx-auto">
                      {/* Simple pie chart representation */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-8 border-primary relative">
                          <div 
                            className="absolute inset-0 rounded-full border-8 border-blue-500 overflow-hidden" 
                            style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}
                          />
                          <div 
                            className="absolute inset-0 rounded-full border-8 border-green-500 overflow-hidden" 
                            style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 100%, 50% 100%)' }}
                          />
                          <div 
                            className="absolute inset-0 rounded-full border-8 border-gray-300 overflow-hidden" 
                            style={{ clipPath: 'polygon(50% 50%, 0 0, 50% 0)' }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-3 h-3 bg-primary rounded-full mr-2" />
                          <span className="text-sm">Pro (62%)</span>
                        </div>
                        <span className="text-sm font-medium">156</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                          <span className="text-sm">Basic (18%)</span>
                        </div>
                        <span className="text-sm font-medium">45</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                          <span className="text-sm">Enterprise (16%)</span>
                        </div>
                        <span className="text-sm font-medium">41</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-3 h-3 bg-gray-300 rounded-full mr-2" />
                          <span className="text-sm">Free (4%)</span>
                        </div>
                        <span className="text-sm font-medium">12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Platform Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                            ${i % 4 === 0 ? 'bg-green-100 text-green-600' : 
                              i % 4 === 1 ? 'bg-blue-100 text-blue-600' : 
                              i % 4 === 2 ? 'bg-amber-100 text-amber-600' : 
                              'bg-red-100 text-red-600'}
                          `}>
                            {i % 4 === 0 ? <Store className="h-5 w-5" /> : 
                             i % 4 === 1 ? <BarChart className="h-5 w-5" /> : 
                             i % 4 === 2 ? <Globe className="h-5 w-5" /> : 
                             <AlertCircle className="h-5 w-5" />}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm">
                              {i % 4 === 0 && <span className="font-medium">New vendor</span>}
                              {i % 4 === 1 && <span className="font-medium">Plan upgrade</span>}
                              {i % 4 === 2 && <span className="font-medium">New domain</span>}
                              {i % 4 === 3 && <span className="font-medium">SSL Error</span>}
                              {i % 4 === 0 && " Urban Style has registered and selected the Free plan"}
                              {i % 4 === 1 && " Fresh Organics upgraded from Basic to Pro plan"}
                              {i % 4 === 2 && " Tech Haven added a new custom domain: techwearshop.com"}
                              {i % 4 === 3 && " Domain techhaven.com has SSL configuration issues"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {i === 0 ? "Today at 10:32 AM" : 
                               i === 1 ? "Yesterday at 4:15 PM" : 
                               i === 2 ? "Yesterday at 1:45 PM" : 
                               i === 3 ? "Aug 23, 2023" : 
                               "Aug 21, 2023"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
