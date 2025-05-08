import React from "react";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorStore } from "@/contexts/VendorStoreContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeVendor } = useVendorStore();
  const { toast } = useToast();

  const handleDownloadReport = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Report downloading will be available in a future update.",
    });
  };

  return (
    <DashboardLayout title="Reports" subtitle="Detailed analytics and business reports">
      <Helmet>
        <title>Reports | {activeVendor?.companyName || "MultiVend"}</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Business Reports</h1>
        <div className="flex space-x-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">₹89,452</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-green-600 text-xs font-semibold">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    12.5%
                  </div>
                  <span className="text-xs text-gray-500 ml-2">vs prev. period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Orders</p>
                <h3 className="text-2xl font-bold mt-1">324</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-green-600 text-xs font-semibold">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    8.2%
                  </div>
                  <span className="text-xs text-gray-500 ml-2">vs prev. period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <h3 className="text-2xl font-bold mt-1">198</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-green-600 text-xs font-semibold">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    24.6%
                  </div>
                  <span className="text-xs text-gray-500 ml-2">vs prev. period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                <h3 className="text-2xl font-bold mt-1">₹276</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center text-red-600 text-xs font-semibold">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    3.8%
                  </div>
                  <span className="text-xs text-gray-500 ml-2">vs prev. period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-6">
          <TabsTrigger value="sales">
            <DollarSign className="h-4 w-4 mr-2" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="products">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Product Performance
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customer Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales & Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart */}
              <div className="w-full h-64 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center mb-6">
                <div className="text-gray-500 flex flex-col items-center">
                  <BarChart2 className="h-10 w-10 mb-2" />
                  <p>Sales trend chart will appear here</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Sales by Time</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-500">Today</td>
                        <td className="py-2 text-right font-medium">₹1,245</td>
                        <td className="py-2 text-right">
                          <span className="text-green-600 text-xs font-medium">+12.5%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">This Week</td>
                        <td className="py-2 text-right font-medium">₹8,976</td>
                        <td className="py-2 text-right">
                          <span className="text-green-600 text-xs font-medium">+5.3%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">This Month</td>
                        <td className="py-2 text-right font-medium">₹32,456</td>
                        <td className="py-2 text-right">
                          <span className="text-green-600 text-xs font-medium">+18.2%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">This Year</td>
                        <td className="py-2 text-right font-medium">₹239,845</td>
                        <td className="py-2 text-right">
                          <span className="text-green-600 text-xs font-medium">+28.6%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Payment Methods</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-500">Credit Card</td>
                        <td className="py-2 text-right font-medium">₹45,672 (51%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">UPI</td>
                        <td className="py-2 text-right font-medium">₹28,934 (32%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Debit Card</td>
                        <td className="py-2 text-right font-medium">₹10,452 (12%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Net Banking</td>
                        <td className="py-2 text-right font-medium">₹4,394 (5%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Taxes & Fees</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 text-gray-500">GST Collected</td>
                        <td className="py-2 text-right font-medium">₹16,102</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Platform Fees</td>
                        <td className="py-2 text-right font-medium">₹4,472</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Payment Processing</td>
                        <td className="py-2 text-right font-medium">₹2,683</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Net Revenue</td>
                        <td className="py-2 text-right font-medium text-green-600">₹66,195</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Top Selling Products</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-500 font-medium">Product</th>
                        <th className="px-4 py-3 text-left text-gray-500 font-medium">SKU</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Units Sold</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Revenue</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Premium Green Tea</td>
                        <td className="px-4 py-3 text-gray-500">TEA-PGT-100</td>
                        <td className="px-4 py-3 text-right">125</td>
                        <td className="px-4 py-3 text-right">₹12,500</td>
                        <td className="px-4 py-3 text-right text-green-600">42%</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Organic Oolong Tea</td>
                        <td className="px-4 py-3 text-gray-500">TEA-OOL-250</td>
                        <td className="px-4 py-3 text-right">84</td>
                        <td className="px-4 py-3 text-right">₹10,080</td>
                        <td className="px-4 py-3 text-right text-green-600">38%</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Classic Earl Grey</td>
                        <td className="px-4 py-3 text-gray-500">TEA-CEG-150</td>
                        <td className="px-4 py-3 text-right">76</td>
                        <td className="px-4 py-3 text-right">₹7,600</td>
                        <td className="px-4 py-3 text-right text-green-600">35%</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Premium Tea Gift Box</td>
                        <td className="px-4 py-3 text-gray-500">TEA-GFT-001</td>
                        <td className="px-4 py-3 text-right">52</td>
                        <td className="px-4 py-3 text-right">₹15,600</td>
                        <td className="px-4 py-3 text-right text-green-600">45%</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Herbal Tea Sampler</td>
                        <td className="px-4 py-3 text-gray-500">TEA-HRB-MIX</td>
                        <td className="px-4 py-3 text-right">48</td>
                        <td className="px-4 py-3 text-right">₹5,760</td>
                        <td className="px-4 py-3 text-right text-green-600">32%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Inventory Status</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">In Stock (75%)</span>
                          <span className="text-sm text-gray-500">148 products</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Low Stock (15%)</span>
                          <span className="text-sm text-gray-500">32 products</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Out of Stock (10%)</span>
                          <span className="text-sm text-gray-500">22 products</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: "10%" }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button variant="outline" size="sm" className="w-full">View Inventory Report</Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Product Categories Performance</h3>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Green Tea</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">₹18,450</span>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Black Tea</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">₹15,200</span>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+8%</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Herbal Tea</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">₹12,780</span>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+15%</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Tea Gift Sets</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">₹21,300</span>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+22%</span>
                        </div>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm">Tea Accessories</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">₹9,820</span>
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">-5%</span>
                        </div>
                      </li>
                    </ul>
                    <div className="mt-6">
                      <Button variant="outline" size="sm" className="w-full">View Category Report</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Customer Demographics</h3>
                  <div className="space-y-4 mt-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">18-24 years</span>
                        <span className="text-sm text-gray-500">15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">25-34 years</span>
                        <span className="text-sm text-gray-500">42%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "42%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">35-44 years</span>
                        <span className="text-sm text-gray-500">28%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "28%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">45+ years</span>
                        <span className="text-sm text-gray-500">15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Top Locations</h3>
                  <ul className="space-y-3 mt-4">
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Delhi NCR</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">28%</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Mumbai</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">24%</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Bangalore</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">18%</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Hyderabad</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Chennai</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">8%</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">Others</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Customer Retention</h3>
                  <div className="space-y-4 mt-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">New Customers</span>
                        <span className="text-sm font-medium">62 (31%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: "31%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Returning Customers</span>
                        <span className="text-sm font-medium">136 (69%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "69%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Customer Lifetime Value</p>
                        <p className="text-xl font-semibold">₹4,850</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Retention Rate</p>
                        <p className="text-xl font-semibold">68%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Top Customers by Revenue</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-500 font-medium">Customer</th>
                        <th className="px-4 py-3 text-left text-gray-500 font-medium">Orders</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Total Spent</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Last Order</th>
                        <th className="px-4 py-3 text-right text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Amit Sharma</td>
                        <td className="px-4 py-3 text-gray-500">12</td>
                        <td className="px-4 py-3 text-right font-medium">₹24,820</td>
                        <td className="px-4 py-3 text-right text-gray-500">3 days ago</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Priya Patel</td>
                        <td className="px-4 py-3 text-gray-500">8</td>
                        <td className="px-4 py-3 text-right font-medium">₹18,460</td>
                        <td className="px-4 py-3 text-right text-gray-500">1 week ago</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Rahul Mehta</td>
                        <td className="px-4 py-3 text-gray-500">6</td>
                        <td className="px-4 py-3 text-right font-medium">₹15,780</td>
                        <td className="px-4 py-3 text-right text-gray-500">2 weeks ago</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Sunita Gupta</td>
                        <td className="px-4 py-3 text-gray-500">5</td>
                        <td className="px-4 py-3 text-right font-medium">₹12,340</td>
                        <td className="px-4 py-3 text-right text-gray-500">1 month ago</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            At Risk
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Vivek Singh</td>
                        <td className="px-4 py-3 text-gray-500">4</td>
                        <td className="px-4 py-3 text-right font-medium">₹10,680</td>
                        <td className="px-4 py-3 text-right text-gray-500">6 weeks ago</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            At Risk
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ReportsPage;