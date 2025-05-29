import React, { Suspense } from "react";
import { Switch, Route, Link, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VendorStoreProvider, useVendorStore } from "@/contexts/VendorStoreContext";
import { CartProvider } from "@/contexts/CartContext";
import CategoryNav from "@/components/store/CategoryNav";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import LoginPage from "@/pages/auth/LoginPage";
import BuyerLoginPage from "@/pages/store/BuyerLoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import SuperAdminDashboard from "@/pages/dashboard/SuperAdminDashboard";
import VendorDashboard from "@/pages/dashboard/VendorDashboard";
import VendorsPage from "@/pages/vendors/VendorsPage";
import VendorDetails from "@/pages/vendors/VendorDetails";
import TestStorePage from "@/pages/TestStorePage";
import DomainsPage from "@/pages/domains/DomainsPage";
import DomainDetailPage from "@/pages/domains/DomainDetailPage";
import SubscriptionsPage from "@/pages/subscriptions/SubscriptionsPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import VendorAnalyticsPage from "@/pages/analytics/VendorAnalyticsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductDetails from "./pages/products/ProductDetails";
import ProductCategoriesPage from "./pages/products/ProductCategoriesPage";
import ProductSubcategoriesPage from "./pages/products/ProductSubcategoriesPage";
import OrdersPage from "./pages/orders/OrdersPage";
import CustomersPage from "./pages/customers/CustomersPage";
import StoreDesignPage from "./pages/store/StoreDesignPage";
import StorefrontPage from "./pages/store/StorefrontPage";
import CategoryPage from "./pages/store/CategoryPage";
import PaymentSettingsPage from "./pages/payments/PaymentSettingsPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import MarketingPage from "./pages/marketing/MarketingPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SubscriptionPage from "./pages/vendor/SubscriptionPage";
import S3UploadTestPage from "./pages/s3-upload-test";
import TestCartPage from "./pages/test-cart";
import SimpleTestPage from "./pages/simple-test";
import IndependentCartPage from "./pages/independent-cart";
import PrivateRoute from "@/components/PrivateRoute";

interface NewsletterProps {
  newsletterEmail: string;
  setNewsletterEmail: React.Dispatch<React.SetStateAction<string>>;
  newsletterStatus: null | "success" | "error";
  newsletterLoading: boolean;
  handleNewsletterSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function Router({
  newsletterEmail,
  setNewsletterEmail,
  newsletterStatus,
  newsletterLoading,
  handleNewsletterSubmit
}: NewsletterProps) {
  const { isVendorStore } = useVendorStore();

  // If this is a vendor's custom domain, show the StorefrontPage
  if (isVendorStore) {
    return (
      <Switch>
        <Route path="/buyer-login">
          <BuyerLoginPage />
        </Route>
        <Route path="/category/:slug">
          <CategoryPage />
        </Route>
        <Route path="/">
          <StorefrontPage />
        </Route>
        <Route>
          <StorefrontPage />
        </Route>
      </Switch>
    );
  }

  // Otherwise show the platform's routes
  return (
    <Switch>
      {/* Test Routes - only for development */}
      <Route path="/test-store">
        {process.env.NODE_ENV === 'development' && <TestStorePage />}
      </Route>
      <Route path="/test-cart">
        {process.env.NODE_ENV === 'development' && <TestCartPage />}
      </Route>
      <Route path="/simple-test">
        <SimpleTestPage />
      </Route>
      <Route path="/independent-cart">
        <IndependentCartPage />
      </Route>
      
      {/* Welcome Route */}
      <Route path="/">
        <div className="min-h-screen bg-white">
          {/* Top header - announcement bar */}
          <div className="bg-indigo-600 py-2">
            <div className="container mx-auto px-4 text-center text-white text-sm font-medium">
              Free shipping on orders over $50 • 30-day money-back guarantee
            </div>
          </div>

          {/* Main Navigation */}
          <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md border-gray-200">
            <div className="container mx-auto px-4">
              {/* Top nav with search, account, cart */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span className="text-xl font-bold">ShopEase</span>
                </div>

                {/* Search */}
                <div className="hidden md:flex relative w-full max-w-md mx-4">
                  <input 
                    type="text" 
                    placeholder="Search for products..." 
                    className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Test Store Link - only for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <Link href="/test-store" className="flex items-center text-amber-600 hover:text-amber-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="ml-2 text-sm font-medium hidden sm:inline">Test Stores</span>
                    </Link>
                  )}
                  
                  {/* Account */}
                  <Link href="/login" className="flex items-center text-gray-700 hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Account</span>
                  </Link>

                  {/* Wishlist */}
                  <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Wishlist</span>
                  </a>

                  {/* Cart */}
                  <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="ml-2 text-sm font-medium hidden sm:inline">Cart</span>
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">3</span>
                  </a>
                </div>
              </div>

              {/* Main category navigation - fully dynamic from database */}
              <div className="flex items-center py-2 overflow-x-auto scrollbar-hide">
                <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap mr-2">
                  Home
                </Link>
                
                {/* Dynamic category navigation component */}
                {!isVendorStore ? (
                  // Demo categories for platform homepage
                  <nav className="flex items-center gap-4">
                    <Link href="/category/new-arrivals" className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap">
                      New Arrivals
                    </Link>
                    <Link href="/category/electronics" className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap">
                      Electronics
                    </Link>
                    <Link href="/category/clothing" className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap">
                      Clothing
                    </Link>
                    <Link href="/category/home-kitchen" className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap">
                      Home & Kitchen
                    </Link>
                    <Link href="/category/sale" className="text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap">
                      Sale
                    </Link>
                  </nav>
                ) : (
                  // Dynamic categories from database for vendor stores
                  // <CategoryNav vendorId={vendor.id} className="flex-1" />
                  <div className="flex-1"></div>
                )}
              </div>
            </div>
          </header>

          {/* Hero Banner */}
          <section className="relative">
            <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center">
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-xl text-white">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">Summer Sale</h1>
                  <p className="text-xl mb-6">Up to 50% off on selected items. Limited time offer.</p>
                  <div className="flex space-x-4">
                    <a href="#" className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium">Shop Now</a>
                    <a href="#" className="bg-transparent border border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium">Learn More</a>
                    {process.env.NODE_ENV === 'development' && (
                      <Link href="/test-store" className="bg-amber-500 text-white hover:bg-amber-600 px-6 py-3 rounded-lg font-medium ml-4">
                        Test Vendor Stores
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/60 to-indigo-900/60 mix-blend-multiply"></div>
            </div>
          </section>

          {/* Featured Categories */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">Shop by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="#" className="group">
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square relative">
                    <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium">Electronics</span>
                      </div>
                    </div>
                  </div>
                </a>
                <a href="#" className="group">
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square relative">
                    <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium">Fashion</span>
                      </div>
                    </div>
                  </div>
                </a>
                <a href="#" className="group">
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square relative">
                    <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium">Home</span>
                      </div>
                    </div>
                  </div>
                </a>
                <a href="#" className="group">
                  <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square relative">
                    <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium">Beauty</span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                <a href="#" className="text-indigo-600 font-medium hover:underline">View All</a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Product 1 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SALE</span>
                    </div>
                    <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-gray-700 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Electronics</h3>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">Wireless Bluetooth Headphones</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">$89.99</span>
                        <span className="text-sm text-gray-500 line-through ml-2">$129.99</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700 ml-1">4.5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product 2 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-gray-200"></div>
                    <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-gray-700 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Fashion</h3>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">Men's Casual Shirt</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">$39.99</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700 ml-1">4.2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product 3 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
                    </div>
                    <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-gray-700 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Home</h3>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">Smart LED Light Bulb</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">$24.99</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700 ml-1">4.8</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product 4 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-gray-200"></div>
                    <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-gray-700 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-500 mb-1">Beauty</h3>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">Organic Face Serum</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">$32.99</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700 ml-1">4.7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Deal of the Day */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-lg">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="text-white text-sm font-semibold uppercase tracking-wider mb-2">Deal of the Day</div>
                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Premium Noise-Cancelling Headphones</h2>
                    <p className="text-indigo-100 mb-6">High-quality sound, all-day comfort, and incredible noise cancellation.</p>
                    <div className="mb-6">
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <span className="block text-3xl font-bold text-white">12</span>
                          <span className="text-indigo-200 text-sm">Hours</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-3xl font-bold text-white">45</span>
                          <span className="text-indigo-200 text-sm">Minutes</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-3xl font-bold text-white">30</span>
                          <span className="text-indigo-200 text-sm">Seconds</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="text-3xl font-bold text-white">$149.99</div>
                      <div className="text-2xl text-indigo-200 line-through">$299.99</div>
                      <div className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-bold flex items-center">50% OFF</div>
                    </div>
                    <a href="#" className="mt-8 inline-block bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium text-center shadow-md hover:shadow-lg transition-all w-full md:w-auto">Shop Now</a>
                  </div>
                  <div className="hidden md:flex items-center justify-center py-8">
                    <div className="h-64 w-64 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Newsletter */}
          <section className="py-12 bg-indigo-600">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Sign Up for Our Newsletter</h2>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new products, sales, and special offers delivered right to your inbox.</p>
              <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" onSubmit={handleNewsletterSubmit}>
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow px-4 py-3 rounded-lg focus:outline-none"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  disabled={newsletterLoading}
                />
                <button type="submit" className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium" disabled={newsletterLoading}>
                  {newsletterLoading ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
              {newsletterStatus === "success" && (
                <div className="mt-3 text-green-100 font-medium">Subscribed! 🎉</div>
              )}
              {newsletterStatus === "error" && (
                <div className="mt-3 text-red-200 font-medium">Load Failed. Please enter a valid email.</div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span className="text-xl font-bold">ShopEase</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Your one-stop shop for all your shopping needs. Quality products at affordable prices.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-500 hover:text-indigo-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-500 hover:text-indigo-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-500 hover:text-indigo-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Shop</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">New Arrivals</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Best Sellers</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Sale</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">All Collections</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Customer Service</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Contact Us</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Shipping & Returns</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">FAQ</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Track Order</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">About</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Our Story</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Sustainability</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Store Locations</a></li>
                    <li><a href="#" className="text-gray-600 hover:text-indigo-600">Careers</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-8 mt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-500 mb-4 md:mb-0">© {new Date().getFullYear()} ShopEase. All rights reserved.</p>
                  <div className="flex items-center space-x-6">
                    <a href="#" className="text-gray-600 hover:text-indigo-600 text-sm">Privacy Policy</a>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 text-sm">Terms of Service</a>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 text-sm">Cookie Policy</a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Super Admin Routes */}
      <Route path="/admin">
        <PrivateRoute roles={["super_admin"]}>
          <SuperAdminDashboard />
        </PrivateRoute>
      </Route>
      <Route path="/vendors">
        <PrivateRoute roles={["super_admin"]}>
          <VendorsPage />
        </PrivateRoute>
      </Route>
      <Route path="/vendors/:id">
        {params => (
          <PrivateRoute roles={["super_admin"]}>
            <VendorDetails id={params.id} />
          </PrivateRoute>
        )}
      </Route>
      
      {/* Other Super Admin Routes */}
      <Route path="/domains">
        <PrivateRoute roles={["super_admin"]}>
          <DomainsPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/domains/:id">
        <PrivateRoute roles={["super_admin"]}>
          <DomainDetailPage />
        </PrivateRoute>
      </Route>
      <Route path="/subscriptions">
        <PrivateRoute roles={["super_admin"]}>
          <SubscriptionsPage />
        </PrivateRoute>
      </Route>
      <Route path="/analytics">
        <PrivateRoute roles={["super_admin"]}>
          <AnalyticsPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/users">
        <PrivateRoute roles={["super_admin"]}>
          <UsersManagementPage />
        </PrivateRoute>
      </Route>
      <Route path="/settings">
        <PrivateRoute roles={["super_admin"]}>
          <SettingsPage />
        </PrivateRoute>
      </Route>
      
      {/* Vendor Routes */}
      <Route path="/dashboard">
        <PrivateRoute roles={["vendor"]}>
          <VendorDashboard />
        </PrivateRoute>
      </Route>
      <Route path="/products">
        <PrivateRoute roles={["vendor"]}>
          <ProductsPage />
        </PrivateRoute>
      </Route>
      <Route path="/product-categories">
        <PrivateRoute roles={["vendor"]}>
          <ProductCategoriesPage />
        </PrivateRoute>
      </Route>
      <Route path="/product-subcategories">
        <PrivateRoute roles={["vendor"]}>
          <ProductSubcategoriesPage />
        </PrivateRoute>
      </Route>
      <Route path="/products/:id">
        {params => (
          <PrivateRoute roles={["vendor"]}>
            <ProductDetails product={params.id} />
          </PrivateRoute>
        )}
      </Route>
      <Route path="/orders">
        <PrivateRoute roles={["vendor"]}>
          <OrdersPage />
        </PrivateRoute>
      </Route>
      <Route path="/customers">
        <PrivateRoute roles={["vendor"]}>
          <CustomersPage />
        </PrivateRoute>
      </Route>
      <Route path="/store-design">
        <PrivateRoute roles={["vendor"]}>
          <StoreDesignPage />
        </PrivateRoute>
      </Route>
      <Route path="/vendor-analytics">
        <PrivateRoute roles={["vendor"]}>
          <VendorAnalyticsPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/payment-settings">
        <PrivateRoute roles={["vendor"]}>
          <PaymentSettingsPage />
        </PrivateRoute>
      </Route>

      <Route path="/marketing">
        <PrivateRoute roles={["vendor"]}>
          <MarketingPage />
        </PrivateRoute>
      </Route>
      
      <Route path="/reports">
        <PrivateRoute roles={["vendor"]}>
          <ReportsPage />
        </PrivateRoute>
      </Route>

      {/* S3 Upload test removed */}

      <Route path="/subscription">
        <PrivateRoute roles={["vendor"]}>
          <SubscriptionPage />
        </PrivateRoute>
      </Route>
      
      {/* Fallback to 404 */}
      {/* This will catch any undefined routes including /s3-upload-test */}
      <Route>
        {/* Fallback: just return null to avoid runtime errors */}
        {() => null}
      </Route>
    </Switch>
  );
}

function App() {
  // Newsletter state and handler
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterStatus, setNewsletterStatus] = React.useState<null | "success" | "error">(null);
  const [newsletterLoading, setNewsletterLoading] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewsletterStatus(null);
    setNewsletterLoading(true);
    try {
      // Simulate API call (replace with real API if available)
      await new Promise(res => setTimeout(res, 800));
      if (!newsletterEmail || !newsletterEmail.includes("@")) {
        throw new Error("Invalid email");
      }
      setNewsletterStatus("success");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VendorStoreProvider>
          <CartProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                {/* Force light theme as per user requirement */}
                <div className="light">
                  <ImpersonationBanner />
                  <Router
                    newsletterEmail={newsletterEmail}
                    setNewsletterEmail={setNewsletterEmail}
                    newsletterStatus={newsletterStatus}
                    newsletterLoading={newsletterLoading}
                    handleNewsletterSubmit={handleNewsletterSubmit}
                  />
                </div>
              </TooltipProvider>
            </ThemeProvider>
          </CartProvider>
        </VendorStoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;