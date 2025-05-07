import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import SuperAdminDashboard from "@/pages/dashboard/SuperAdminDashboard";
import VendorDashboard from "@/pages/dashboard/VendorDashboard";
import VendorsPage from "@/pages/vendors/VendorsPage";
import VendorDetails from "@/pages/vendors/VendorDetails";
import DomainsPage from "@/pages/domains/DomainsPage";
import SubscriptionsPage from "@/pages/subscriptions/SubscriptionsPage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductDetails from "./pages/products/ProductDetails";
import OrdersPage from "./pages/orders/OrdersPage";
import StoreDesignPage from "./pages/store/StoreDesignPage";
import PrivateRoute from "@/components/PrivateRoute";

function Router() {
  return (
    <Switch>
      {/* Welcome Route */}
      <Route path="/">
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {/* Navigation */}
          <header className="border-b bg-white dark:bg-slate-950 dark:border-slate-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">MultiVend</span>
              </div>
              <div>
                <Link href="/login" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  Login
                </Link>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text">
                Launch Your eCommerce Store in Minutes
              </h1>
              <p className="text-xl mb-10 text-slate-600 dark:text-slate-300">
                A multi-tenant SaaS platform for creating and managing single-vendor eCommerce websites with flexible subscription-based pricing.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/login" className="px-6 py-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-lg font-medium">
                  Get Started
                </Link>
                <Link href="#features" className="px-6 py-3 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg font-medium">
                  Learn More
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="container mx-auto px-4 py-16 md:py-24">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Flexible Pricing</h3>
                <p className="text-slate-600 dark:text-slate-300">Choose from multiple subscription plans to fit your business needs and scale as you grow.</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Custom Domains</h3>
                <p className="text-slate-600 dark:text-slate-300">Connect your own domain and build your brand with fully customizable storefronts.</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Order Management</h3>
                <p className="text-slate-600 dark:text-slate-300">Comprehensive tools to manage products, inventory, and customer orders all in one place.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8">
            <div className="container mx-auto px-4">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <p>© {new Date().getFullYear()} MultiVend. All rights reserved.</p>
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
      <Route path="/subscriptions">
        <PrivateRoute roles={["super_admin"]}>
          <SubscriptionsPage />
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
      <Route path="/products/:id">
        {params => (
          <PrivateRoute roles={["vendor"]}>
            <ProductDetails id={params.id} />
          </PrivateRoute>
        )}
      </Route>
      <Route path="/orders">
        <PrivateRoute roles={["vendor"]}>
          <OrdersPage />
        </PrivateRoute>
      </Route>
      <Route path="/store-design">
        <PrivateRoute roles={["vendor"]}>
          <StoreDesignPage />
        </PrivateRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
