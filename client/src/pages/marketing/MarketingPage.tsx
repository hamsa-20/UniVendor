import React from "react";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorStore } from "@/contexts/VendorStoreContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Megaphone, Gift, Tag, SearchCode, MessageSquare, BarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketingPage: React.FC = () => {
  const { user } = useAuth();
  const { activeVendor } = useVendorStore();
  const { toast } = useToast();

  const handleCreateCampaign = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Campaign creation will be available in a future update.",
    });
  };

  return (
    <DashboardLayout title="Marketing" subtitle="Promote your products and engage with customers">
      <Helmet>
        <title>Marketing | {activeVendor?.companyName || "MultiVend"}</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
        <Button onClick={handleCreateCampaign}>
          <Send className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="mb-6">
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email Marketing
          </TabsTrigger>
          <TabsTrigger value="promotions">
            <Megaphone className="h-4 w-4 mr-2" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="seo">
            <SearchCode className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="social">
            <MessageSquare className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <Mail className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Newsletter</h3>
                  <p className="text-gray-500 mb-4">Send regular updates about your products and promotions</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Create Newsletter
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <Gift className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Special Offers</h3>
                  <p className="text-gray-500 mb-4">Create exclusive deals and discounts for your customers</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Create Offer
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <Tag className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Product Announcements</h3>
                  <p className="text-gray-500 mb-4">Announce new products or features to your customers</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Create Announcement
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Recent Campaigns</h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Campaign Name</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Type</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Sent</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Opens</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Clicks</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Summer Collection Launch</td>
                        <td className="px-4 py-3 text-gray-500">Newsletter</td>
                        <td className="px-4 py-3 text-gray-500">523</td>
                        <td className="px-4 py-3 text-gray-500">342 (65%)</td>
                        <td className="px-4 py-3 text-gray-500">168 (32%)</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">Special Monsoon Discount</td>
                        <td className="px-4 py-3 text-gray-500">Promotion</td>
                        <td className="px-4 py-3 text-gray-500">856</td>
                        <td className="px-4 py-3 text-gray-500">512 (60%)</td>
                        <td className="px-4 py-3 text-gray-500">246 (29%)</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Completed
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

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions & Discounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Monsoon Sale</h3>
                      <p className="text-gray-500 text-sm">Valid until Sep 30, 2023</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2 font-medium">30% off on all products</p>
                  <p className="text-gray-500 mb-4 text-sm">Coupon code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">MONSOON30</span></p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Used: 245 times</span>
                    <span>Revenue: ₹38,450</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">New Customer Discount</h3>
                      <p className="text-gray-500 text-sm">Valid until Dec 31, 2023</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2 font-medium">15% off on first purchase</p>
                  <p className="text-gray-500 mb-4 text-sm">Coupon code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">WELCOME15</span></p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Used: 187 times</span>
                    <span>Revenue: ₹22,640</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Festive Season Offer</h3>
                      <p className="text-gray-500 text-sm">Starting Oct 15, 2023</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2 font-medium">Buy 1 Get 1 Free on select items</p>
                  <p className="text-gray-500 mb-4 text-sm">Coupon code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">FESTIVE2023</span></p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Cancel</Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button>
                  <Gift className="mr-2 h-4 w-4" />
                  Create New Promotion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold mb-4">SEO Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Organic Traffic</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold">1,245</p>
                      <span className="text-green-600 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +12.5%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Keywords Ranking</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold">28</p>
                      <span className="text-green-600 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +5
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Avg. Position</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold">4.2</p>
                      <span className="text-green-600 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +0.8
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Keyword</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Position</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Traffic</th>
                        <th className="px-4 py-3 text-gray-500 font-medium text-sm">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">premium tea brands</td>
                        <td className="px-4 py-3 text-gray-500">3</td>
                        <td className="px-4 py-3 text-gray-500">425</td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 text-sm font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +2
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">organic green tea</td>
                        <td className="px-4 py-3 text-gray-500">5</td>
                        <td className="px-4 py-3 text-gray-500">312</td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 text-sm font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +1
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">loose leaf tea online</td>
                        <td className="px-4 py-3 text-gray-500">2</td>
                        <td className="px-4 py-3 text-gray-500">298</td>
                        <td className="px-4 py-3">
                          <span className="text-red-600 text-sm font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                            </svg>
                            -1
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">buy tea online India</td>
                        <td className="px-4 py-3 text-gray-500">6</td>
                        <td className="px-4 py-3 text-gray-500">210</td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 text-sm font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +3
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

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.48 8.86c-.35-.12-1.08-.34-1.93-.42-.9-.09-1.88.04-2.65.4-.83.41-1.5 1.06-1.95 1.89-.47.87-.6 1.84-.59 2.76.01.89.12 1.76.39 2.61.26.84.66 1.63 1.2 2.32-1.34-.11-2.36-.43-3.44-1-.95-.49-1.74-1.17-2.41-1.96-.7-.84-1.22-1.81-1.55-2.86-.33-1.06-.45-2.17-.38-3.28.07-1.04.32-2.06.76-3 .43-.93 1.01-1.76 1.73-2.45.77-.75 1.71-1.3 2.73-1.63 1.02-.33 2.11-.41 3.19-.25 1.04.15 2.02.54 2.9 1.12.94.62 1.71 1.48 2.24 2.48-1.02.35-1.75.9-2.25 1.72-.5.82-.69 1.7-.62 2.49.07.7.29 1.26.63 1.68z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold">Facebook</h3>
                      <p className="text-gray-500 text-sm">Connected</p>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-sm text-gray-500">PERFORMANCE OVERVIEW</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Followers</p>
                        <p className="text-lg font-semibold">3,245</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Engagement</p>
                        <p className="text-lg font-semibold">12.4%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Reach</p>
                        <p className="text-lg font-semibold">8,932</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-[#C13584] flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.055-.059 1.37-.059 4.04 0 2.67.01 2.986.059 4.04.044.976.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.046 1.37.058 4.04.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.047-1.054.059-1.37.059-4.04 0-2.67-.01-2.986-.059-4.04-.044-.976-.207-1.504-.344-1.857a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.054-.048-1.37-.058-4.04-.058zm0 3.063a5.136 5.136 0 110 10.27 5.136 5.136 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.469a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold">Instagram</h3>
                      <p className="text-gray-500 text-sm">Connected</p>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-sm text-gray-500">PERFORMANCE OVERVIEW</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Followers</p>
                        <p className="text-lg font-semibold">5,782</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Engagement</p>
                        <p className="text-lg font-semibold">18.2%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Reach</p>
                        <p className="text-lg font-semibold">12,459</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Connect Social Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default MarketingPage;