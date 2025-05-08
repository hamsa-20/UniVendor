import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Store,
  Globe,
  LayoutDashboard,
  PackageOpen,
  ShoppingCart,
  Users,
  LineChart,
  Settings,
  CreditCard,
  Brush,
  LogOut,
  FolderTree
} from "lucide-react";

type SidebarProps = {
  collapsed?: boolean;
  onCollapse?: () => void;
};

const Sidebar = ({ collapsed = false, onCollapse }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Determine if current user is super admin
  const isSuperAdmin = user?.role === "super_admin";

  // Define navigation items based on role
  const navItems = isSuperAdmin
    ? [
        { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Vendors", path: "/vendors", icon: <Store className="h-5 w-5" /> },
        { label: "Domains", path: "/domains", icon: <Globe className="h-5 w-5" /> },
        { label: "Subscriptions", path: "/subscriptions", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Analytics", path: "/analytics", icon: <LineChart className="h-5 w-5" /> },
        { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
      ]
    : [
        { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Products", path: "/products", icon: <PackageOpen className="h-5 w-5" /> },
        { label: "Categories", path: "/product-categories", icon: <FolderTree className="h-5 w-5" /> },
        { label: "Orders", path: "/orders", icon: <ShoppingCart className="h-5 w-5" /> },
        { label: "Customers", path: "/customers", icon: <Users className="h-5 w-5" /> },
        { label: "Analytics", path: "/vendor-analytics", icon: <LineChart className="h-5 w-5" /> },
        { label: "Store Design", path: "/store-design", icon: <Brush className="h-5 w-5" /> },
        { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
      ];

  return (
    <aside
      className={cn(
        "h-screen fixed top-0 left-0 z-30 flex flex-col bg-white border-r shadow-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex justify-between items-center border-b h-16">
        <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
            MV
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-semibold text-gray-900">MultiVend</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location.startsWith(item.path)
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary",
                collapsed && "justify-center"
              )}
            >
              {item.icon}
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={`${user.firstName} ${user.lastName}`} 
              className="h-9 w-9 rounded-full object-cover" 
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              {user?.firstName?.charAt(0) || "U"}
            </div>
          )}
          
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {isSuperAdmin ? "Super Admin" : "Vendor"}
              </p>
            </div>
          )}
          
          <button 
            onClick={() => logoutMutation.mutate()}
            className={cn(
              "text-gray-400 hover:text-gray-600 transition-colors",
              collapsed ? "ml-auto" : "ml-auto"
            )}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
