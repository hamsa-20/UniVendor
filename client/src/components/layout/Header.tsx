import { useState } from "react";
import { Menu, Bell, Search, ChevronDown, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

type HeaderProps = {
  onToggleSidebar: () => void;
  title: string;
  subtitle?: string;
};

const Header = ({ onToggleSidebar, title, subtitle }: HeaderProps) => {
  const { user, logoutMutation } = useAuth();
  const { getCartSummary } = useCartContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  const { itemCount } = getCartSummary();

  return (
    <header className="bg-white shadow-sm z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-4 md:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Search..."
            />
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
              3
            </span>
          </button>

          {/* Cart */}
          <button
            type="button"
            className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary relative"
            onClick={() => setLocation("/cart")}
          >
            <span className="sr-only">View cart</span>
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center">
              <div className="flex items-center">
                {user?.avatarUrl ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {user?.firstName?.charAt(0) || "U"}
                  </div>
                )}
                <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                logoutMutation.mutate();
                setLocation('/');
              }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
