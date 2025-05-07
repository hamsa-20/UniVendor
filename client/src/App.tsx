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
import ProductsPage from "@/pages/products/ProductsPage";
import ProductDetails from "@/pages/products/ProductDetails";
import OrdersPage from "@/pages/orders/OrdersPage";
import StoreDesignPage from "@/pages/store/StoreDesignPage";
import PrivateRoute from "@/components/PrivateRoute";

function Router() {
  return (
    <Switch>
      {/* Simple test route to verify routing is working */}
      <Route path="/">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Hello World - Test Page</h1>
          <p className="mb-4">This is a test to verify the application is rendering correctly.</p>
          <div className="space-x-4">
            <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
            <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
          </div>
        </div>
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
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
