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
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">MultiVend</h1>
          <p className="mb-4">A multi-tenant SaaS platform for creating and managing single-vendor eCommerce websites with subscription-based pricing.</p>
          <div className="space-x-4">
            <Link href="/login" className="text-blue-500 hover:underline">Login</Link>
            <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
          </div>
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
