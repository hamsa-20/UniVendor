import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const AnalyticsPage = () => {
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
  });

  return (
    <DashboardLayout title="Analytics" subtitle="Platform performance and insights">
      {/* Time period selector */}
      <div className="mb-6">
        <Tabs defaultValue="30days" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-4 mb-6">
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
            <TabsTrigger value="year">12 Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">${isLoading ? '--' : '248,719'}</div>
              <div className="bg-green-100 text-green-800 flex items-center text-xs px-2 py-1 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{isLoading ? '--' : '32'}</div>
              <div className="bg-green-100 text-green-800 flex items-center text-xs px-2 py-1 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{isLoading ? '--' : '254'}</div>
              <div className="bg-green-100 text-green-800 flex items-center text-xs px-2 py-1 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{isLoading ? '--' : '2.3%'}</div>
              <div className="bg-red-100 text-red-800 flex items-center text-xs px-2 py-1 rounded">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>+0.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue for the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-full flex items-end space-x-2">
                  {Array.from({ length: 12 }).map((_, index) => (
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Growth</CardTitle>
            <CardDescription>New vendors over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-full relative">
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
                        d="M0,90 L10,85 L20,80 L30,70 L40,60 L50,55 L60,40 L70,35 L80,30 L90,20 L100,10 L100,100 L0,100" 
                        fill="hsl(var(--primary)/0.1)" 
                        strokeWidth="0"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-40 mx-auto">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
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
              )}
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
        
        {/* Top Performing Vendors */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>By revenue in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="ml-auto">
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {[
                    { name: "Tech Haven", revenue: "$42,105", growth: "+15.3%" },
                    { name: "Fashion Forward", revenue: "$38,721", growth: "+12.7%" },
                    { name: "Gourmet Delights", revenue: "$27,890", growth: "+8.4%" },
                    { name: "Fitness Empire", revenue: "$23,456", growth: "+5.6%" },
                    { name: "Home Essentials", revenue: "$19,872", growth: "+3.2%" }
                  ].map((vendor, index) => (
                    <div key={index} className="flex items-center py-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {vendor.name.split(' ').map(word => word[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{index + 1} active stores</p>
                      </div>
                      <div className="ml-auto flex items-center">
                        <p className="text-sm font-semibold">{vendor.revenue}</p>
                        <span className="ml-2 text-xs text-green-600">{vendor.growth}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;