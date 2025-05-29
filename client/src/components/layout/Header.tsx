// import { useState } from "react";
// import { Menu, Bell, Search, ChevronDown, ShoppingCart } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { useCartContext } from "@/contexts/CartContext";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useLocation } from "wouter";

// type HeaderProps = {
//   onToggleSidebar: () => void;
//   title: string;
//   subtitle?: string;
// };

// const Header = ({ onToggleSidebar, title, subtitle }: HeaderProps) => {
//   const { user, logoutMutation } = useAuth();
//   const { getCartSummary } = useCartContext();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [, setLocation] = useLocation();
  
//   const { itemCount } = getCartSummary();

//   return (
//     <header className="bg-white shadow-sm z-10 relative">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//         <div className="flex items-center">
//           <button
//             type="button"
//             className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
//             onClick={onToggleSidebar}
//           >
//             <Menu className="h-6 w-6" />
//           </button>
//           <div className="ml-4 md:ml-0">
//             <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
//             {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
//           </div>
//         </div>

//         <div className="flex items-center space-x-4">
//           {/* Search */}
//           <div className="relative hidden md:block">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
//               placeholder="Search..."
//             />
//           </div>

//           {/* Notifications */}
//           <button
//             type="button"
//             className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary relative"
//           >
//             <span className="sr-only">View notifications</span>
//             <Bell className="h-6 w-6" />
//             <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
//               3
//             </span>
//           </button>

//           {/* Cart */}
//           <button
//             type="button"
//             className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary relative"
//             onClick={() => setLocation("/cart")}
//           >
//             <span className="sr-only">View cart</span>
//             <ShoppingCart className="h-6 w-6" />
//             {itemCount > 0 && (
//               <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-xs">
//                 {itemCount > 99 ? "99+" : itemCount}
//               </span>
//             )}
//           </button>

//           {/* User dropdown */}
//           <DropdownMenu>
//             <DropdownMenuTrigger className="flex items-center">
//               <div className="flex items-center">
//                 {user?.avatarUrl ? (
//                   <img
//                     className="h-8 w-8 rounded-full object-cover"
//                     src={user.avatarUrl}
//                     alt={`${user.firstName} ${user.lastName}`}
//                   />
//                 ) : (
//                   <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
//                     {user?.firstName?.charAt(0) || "U"}
//                   </div>
//                 )}
//                 <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
//               </div>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuLabel>
//                 {user?.firstName} {user?.lastName}
//               </DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem>Profile</DropdownMenuItem>
//               <DropdownMenuItem>Settings</DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem onClick={() => {
//                 logoutMutation.mutate();
//                 setLocation('/');
//               }}>
//                 Logout
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;



// src/components/Header.jsx or src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from "../../contexts/CartContext";

import { useAuth } from "../../contexts/AuthContext";
//import './Header.css';

const Header = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="UniVendor" className="logo-img" />
            <span className="logo-text">UniVendor</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="navigation">
          <ul className="nav-links">
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/products" className="nav-link">Products</Link></li>
            <li><Link to="/categories" className="nav-link">Categories</Link></li>
            <li><Link to="/about" className="nav-link">About</Link></li>
            <li><Link to="/contact" className="nav-link">Contact</Link></li>
          </ul>
        </nav>

        {/* User Actions */}
        <div className="user-actions">
          {/* Search */}
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="search-input"
            />
            <button className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>

          {/* Cart Icon with Badge */}
          <Link to="/cart" className="cart-link">
            <div className="cart-icon-container">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="cart-icon"
              >
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"></path>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"></path>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"></path>
              </svg>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </div>
            <span className="cart-text">Cart</span>
          </Link>

          {/* User Profile/Login */}
          <div className="user-profile">
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <img 
                    src={user.avatar || '/default-avatar.png'} 
                    alt={user.name}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.name}</span>
                </div>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-link">Profile</Link>
                  <Link to="/orders" className="dropdown-link">Orders</Link>
                  <Link to="/wishlist" className="dropdown-link">Wishlist</Link>
                  <button onClick={logout} className="dropdown-link logout-btn">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="auth-link">Login</Link>
                <Link to="/register" className="auth-link register">Register</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle">
          <button className="mobile-menu-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;