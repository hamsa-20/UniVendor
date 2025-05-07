import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  LineChart, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown,
  Calendar 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as ReChartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';

type TimeFrame = '7days' | '30days' | '90days' | 'year' | 'custom';

const VendorAnalyticsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30days');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Calculate date range based on selected time frame
  const getDateRange = () => {
    const now = new Date();
    switch (timeFrame) {
      case '7days':
        return { from: subDays(now, 7), to: now };
      case '30days':
        return { from: subDays(now, 30), to: now };
      case '90days':
        return { from: subDays(now, 90), to: now };
      case 'year':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'custom':
        return dateRange;
      default:
        return { from: subDays(now, 30), to: now };
    }
  };

  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  const range = getDateRange();
  const fromDate = format(range.from, 'yyyy-MM-dd');
  const toDate = format(range.to, 'yyyy-MM-dd');

  // Fetch vendor analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: vendorId ? [`/api/vendors/${vendorId}/analytics`, fromDate, toDate] : null,
    enabled: !!vendorId,
  });

  // Process analytics data for charts
  const processChartData = () => {
    if (!analyticsData || !Array.isArray(analyticsData)) return [];
    
    // Sort analytics by date
    return [...analyticsData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      revenue: parseFloat(item.revenue || '0'),
      orders: item.orders || 0,
      visitors: item.visitors || 0,
      pageViews: item.pageViews || 0,
      conversionRate: parseFloat(item.conversionRate || '0')
    }));
  };

  const chartData = processChartData();
  
  // Calculate summary metrics
  const calculateSummary = () => {
    if (!chartData.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalVisitors: 0,
        avgConversionRate: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        visitorsGrowth: 0,
        conversionGrowth: 0
      };
    }

    const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = chartData.reduce((sum, day) => sum + day.orders, 0);
    const totalVisitors = chartData.reduce((sum, day) => sum + day.visitors, 0);
    const avgConversionRate = chartData.reduce((sum, day) => sum + day.conversionRate, 0) / chartData.length;

    // Calculate growth (simplified - would be more accurate with historical data)
    // In a real app, we'd compare to previous period
    const revenueGrowth = chartData.length > 1 ? 
      ((chartData[chartData.length - 1].revenue / (chartData[0].revenue || 1)) - 1) * 100 : 0;
    const ordersGrowth = chartData.length > 1 ? 
      ((chartData[chartData.length - 1].orders / (chartData[0].orders || 1)) - 1) * 100 : 0;
    const visitorsGrowth = chartData.length > 1 ? 
      ((chartData[chartData.length - 1].visitors / (chartData[0].visitors || 1)) - 1) * 100 : 0;
    const conversionGrowth = chartData.length > 1 ? 
      ((chartData[chartData.length - 1].conversionRate / (chartData[0].conversionRate || 1)) - 1) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalVisitors,
      avgConversionRate,
      revenueGrowth,
      ordersGrowth,
      visitorsGrowth,
      conversionGrowth
    };
  };

  const summary = calculateSummary();

  // Custom colors for charts
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setTimeFrame('custom');
    }
  };

  const handleDownloadCSV = () => {
    if (!chartData.length) {
      toast({
        title: "No data to export",
        description: "There is no analytics data available for export.",
        variant: "destructive",
      });
      return;
    }

    // Generate CSV content
    const headers = "Date,Revenue,Orders,Visitors,Page Views,Conversion Rate\n";
    const rows = chartData.map(day => 
      `${day.date},${day.revenue},${day.orders},${day.visitors},${day.pageViews},${day.conversionRate}`
    ).join("\n");
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `Analytics data from ${fromDate} to ${toDate} has been downloaded.`,
    });
  };

  return (
    <DashboardLayout title="Analytics Dashboard" subtitle="Track your store's performance metrics">
      {/* Time period selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Tabs 
          value={timeFrame} 
          onValueChange={(value) => setTimeFrame(value as TimeFrame)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {timeFrame === 'custom' && (
          <div className="w-full md:w-auto">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        )}
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                <span>Total Revenue</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  `$${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              {!isLoading && (
                <div className={`${summary.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center text-xs px-2 py-1 rounded`}>
                  {summary.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>{summary.revenueGrowth.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1 text-blue-500" />
                <span>Total Orders</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  summary.totalOrders.toLocaleString()
                )}
              </div>
              {!isLoading && (
                <div className={`${summary.ordersGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center text-xs px-2 py-1 rounded`}>
                  {summary.ordersGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>{summary.ordersGrowth.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visitors Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-purple-500" />
                <span>Total Visitors</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  summary.totalVisitors.toLocaleString()
                )}
              </div>
              {!isLoading && (
                <div className={`${summary.visitorsGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center text-xs px-2 py-1 rounded`}>
                  {summary.visitorsGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>{summary.visitorsGrowth.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-1 text-amber-500" />
                <span>Conversion Rate</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${summary.avgConversionRate.toFixed(2)}%`
                )}
              </div>
              {!isLoading && (
                <div className={`${summary.conversionGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center text-xs px-2 py-1 rounded`}>
                  {summary.conversionGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>{summary.conversionGrowth.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>
          
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Export CSV
          </button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {/* Revenue Chart */}
            <TabsContent value="revenue" className="mt-0">
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !chartData.length ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center">
                    <LineChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No data available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There is no revenue data for the selected time period.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickMargin={10}
                        angle={-45}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#4f46e5" 
                        fill="#4f46e5" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            
            {/* Orders Chart */}
            <TabsContent value="orders" className="mt-0">
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !chartData.length ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No data available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There is no order data for the selected time period.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsBarChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickMargin={10}
                        angle={-45}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, 'Orders']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill="#10b981" 
                      />
                    </ReChartsBarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            
            {/* Visitors Chart */}
            <TabsContent value="visitors" className="mt-0">
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !chartData.length ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center">
                    <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No data available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There is no visitor data for the selected time period.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickMargin={10}
                        angle={-45}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(value) => [value, 'Visitors']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="visitors" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        stroke="#475569" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            
            {/* Conversion Rate Chart */}
            <TabsContent value="conversion" className="mt-0">
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !chartData.length ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center">
                    <BarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No data available</h3>
                    <p className="text-muted-foreground max-w-md">
                      There is no conversion rate data for the selected time period.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickMargin={10}
                        angle={-45}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Conversion Rate']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="conversionRate" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Additional metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales By Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              Sales By Hour
            </CardTitle>
            <CardDescription>Sales distribution throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsBarChart
                    data={[
                      { hour: '12am', sales: 5 },
                      { hour: '3am', sales: 2 },
                      { hour: '6am', sales: 8 },
                      { hour: '9am', sales: 15 },
                      { hour: '12pm', sales: 25 },
                      { hour: '3pm', sales: 23 },
                      { hour: '6pm', sales: 30 },
                      { hour: '9pm', sales: 18 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [value, 'Orders']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" />
                  </ReChartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
              Top Products
            </CardTitle>
            <CardDescription>Best selling products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-md mr-3" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))
              ) : (
                <>
                  {[
                    { name: "Premium Headphones", sales: 48, revenue: "$8,640" },
                    { name: "Wireless Earbuds", sales: 36, revenue: "$3,960" },
                    { name: "Smartwatch Pro", sales: 29, revenue: "$7,250" },
                    { name: "Fitness Tracker", sales: 24, revenue: "$2,880" },
                    { name: "Bluetooth Speaker", sales: 18, revenue: "$1,980" }
                  ].map((product, index) => (
                    <div key={index} className="flex items-center py-1">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} units</p>
                      </div>
                      <p className="text-sm font-semibold">{product.revenue}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
              Sales by Category
            </CardTitle>
            <CardDescription>Revenue distribution by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] mb-4">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Electronics', value: 42 },
                        { name: 'Clothing', value: 28 },
                        { name: 'Home', value: 15 },
                        { name: 'Other', value: 15 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[
                        { name: 'Electronics', value: 42 },
                        { name: 'Clothing', value: 28 },
                        { name: 'Home', value: 15 },
                        { name: 'Other', value: 15 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Percentage']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Electronics', color: COLORS[0], value: '$10,560' },
                { name: 'Clothing', color: COLORS[1], value: '$7,056' },
                { name: 'Home', color: COLORS[2], value: '$3,780' },
                { name: 'Other', color: COLORS[3], value: '$3,725' }
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.name}</span>
                  <span className="text-xs font-semibold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorAnalyticsPage;