import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useLocalCart, LocalCartItem, LocalCart } from '@/hooks/useLocalCart';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { localToServerCartItem } from '@/utils/cartUtils';

// Interface for server cart hook return type
interface ServerCartHook {
  cart: {
    id?: number;
    userId?: number | null;
    sessionId?: string | null;
    vendorId?: number;
    items: Array<{
      id: number;
      productId: number;
      name: string;
      price: string;
      quantity: number;
      imageUrl: string | null;
      variant: string | null;
    }>;
    subtotal: string;
    tax: string;
    total: string;
  } | null;
  isLoading: boolean;
  error: Error | null;
  addToCart: (item: any) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
  getCartSummary: () => {
    subtotal: string;
    tax: string;
    total: string;
    itemCount: number;
  };
  isAddingToCart: boolean;
  isUpdatingQuantity: boolean;
  isRemovingItem: boolean;
  isClearingCart: boolean;
  refetchCart: () => void;
}

// Interface for local cart hook return type
interface LocalCartHook {
  cart: LocalCart;
  isLoading: boolean;
  addToCart: (item: Omit<LocalCartItem, 'id'>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getCartSummary: () => {
    subtotal: string;
    tax: string;
    total: string;
    itemCount: number;
  };
  getFullCart: () => LocalCart;
}

// Define unified cart item type that works for both local and server contexts
export type UnifiedCartItem = {
  id: string | number;
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string | null;
  variant: string | null;
  colorHex?: string | null;
  size?: string | null;
  vendorId: number;
};

// Define unified cart type
export type UnifiedCart = {
  items: UnifiedCartItem[];
  subtotal: string;
  tax: string;
  total: string;
};

// Type definitions for the combined cart functionality
export type CartContextType = {
  cart: UnifiedCart;
  isLoading: boolean;
  addToCart: (item: Omit<UnifiedCartItem, 'id'>) => void;
  updateQuantity: (itemId: string | number, quantity: number) => void;
  removeItem: (itemId: string | number) => void;
  clearCart: () => void;
  getCartSummary: () => {
    subtotal: string;
    tax: string;
    total: string;
    itemCount: number;
  };
  isAddingToCart: boolean;
  isUpdatingQuantity: boolean;
  isRemovingItem: boolean;
  isClearingCart: boolean;
  refetchCart: () => void;
  error: Error | null;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get authentication status - with defaults in case AuthContext fails
  const auth = useAuth() || { user: null, isAuthenticated: false, isLoading: true };
  const { user, isAuthenticated, isLoading: isAuthLoading } = auth;
  
  // Initialize cart hooks with error handling
  let serverCart: ServerCartHook | undefined;
  let localCart: LocalCartHook | undefined;
  
  try {
    serverCart = useCart() as ServerCartHook;
  } catch (err) {
    console.error("Error initializing server cart:", err);
    setError(err instanceof Error ? err : new Error("Failed to initialize server cart"));
  }
  
  try {
    localCart = useLocalCart() as LocalCartHook;
  } catch (err) {
    console.error("Error initializing local cart:", err);
    setError(err instanceof Error ? err : new Error("Failed to initialize local cart"));
  }
  
  const { toast } = useToast();

  // Merge local cart with server cart when user logs in
  useEffect(() => {
    // Safety check to ensure all dependencies are available
    if (!localCart || !serverCart) {
      return;
    }
    
    // Only run if user just logged in and we have items in local cart
    if (isAuthenticated && !isAuthLoading && localCart.cart && localCart.cart.items && localCart.cart.items.length > 0) {
      const mergeLocalCartWithServer = async () => {
        try {
          // For each item in the local cart
          for (const item of localCart.cart.items) {
            // Convert local cart item to server format
            await serverCart.addToCart(localToServerCartItem(item));
          }
          
          // Clear the local cart after successful merge
          localCart.clearCart();
          
          // Notify user
          toast({
            title: "Cart Updated",
            description: "Your cart items have been saved to your account",
          });
        } catch (error) {
          console.error('Error merging carts:', error);
          toast({
            title: "Error",
            description: "Failed to merge your cart items with your account",
            variant: "destructive",
          });
        }
      };
      
      mergeLocalCartWithServer();
    }
    
    setIsReady(true);
  }, [isAuthenticated, isAuthLoading, localCart, serverCart, toast]);

  // Default empty cart matching our unified type
  const defaultCart: UnifiedCart = { 
    items: [], 
    subtotal: "0.00", 
    tax: "0.00", 
    total: "0.00" 
  };
  
  // Determine which cart to use based on authentication status
  const cart: UnifiedCart = isAuthenticated && serverCart ? (serverCart.cart as UnifiedCart || defaultCart) : (localCart ? localCart.cart : defaultCart);
  const isLoading = !isReady || (isAuthenticated ? (serverCart ? serverCart.isLoading : true) : (localCart ? localCart.isLoading : true));
  
  // Add to cart (handles authenticated and guest users)
  const addToCart = (item: any) => {
    try {
      if (isAuthenticated && serverCart) {
        // Use server cart
        serverCart.addToCart(item);
      } else if (localCart) {
        // Use local cart - convert format if needed
        const localItem: Omit<LocalCartItem, 'id'> = {
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || null,
          variant: item.variant || null,
          colorHex: item.colorHex || null,
          size: item.size || null,
          vendorId: item.vendorId
        };
        
        localCart.addToCart(localItem);
        
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
      } else {
        console.error("Neither server cart nor local cart available");
        toast({
          title: "Error",
          description: "Unable to add item to cart",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };
  
  // Update quantity
  const updateQuantity = (itemId: any, quantity: number) => {
    try {
      if (isAuthenticated && serverCart) {
        serverCart.updateQuantity(itemId, quantity);
      } else if (localCart) {
        localCart.updateQuantity(itemId, quantity);
      } else {
        console.error("Neither server cart nor local cart available");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };
  
  // Remove item
  const removeItem = (itemId: any) => {
    try {
      if (isAuthenticated && serverCart) {
        serverCart.removeItem(itemId);
      } else if (localCart) {
        localCart.removeItem(itemId);
        toast({
          title: "Removed from cart",
          description: "Item has been removed from your cart",
        });
      } else {
        console.error("Neither server cart nor local cart available");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };
  
  // Clear cart
  const clearCart = () => {
    try {
      if (isAuthenticated && serverCart) {
        serverCart.clearCart();
      } else if (localCart) {
        localCart.clearCart();
        toast({
          title: "Cart cleared",
          description: "All items have been removed from your cart",
        });
      } else {
        console.error("Neither server cart nor local cart available");
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive"
      });
    }
  };
  
  // Get cart summary
  const getCartSummary = () => {
    try {
      if (isAuthenticated && serverCart) {
        return serverCart.getCartSummary();
      } else if (localCart) {
        return localCart.getCartSummary();
      }
    } catch (err) {
      console.error("Error getting cart summary:", err);
    }
    
    // Default summary if error or not available
    return {
      subtotal: "0.00",
      tax: "0.00",
      total: "0.00",
      itemCount: 0,
    };
  };
  
  // Refetch cart
  const refetchCart = () => {
    try {
      if (isAuthenticated && serverCart) {
        serverCart.refetchCart();
      }
      // No equivalent for local cart as it's already in sync
    } catch (err) {
      console.error("Error refetching cart:", err);
    }
  };

  // Fallbacks for loading states
  const isAddingToCart = isAuthenticated && serverCart ? serverCart.isAddingToCart : false;
  const isUpdatingQuantity = isAuthenticated && serverCart ? serverCart.isUpdatingQuantity : false;
  const isRemovingItem = isAuthenticated && serverCart ? serverCart.isRemovingItem : false;
  const isClearingCart = isAuthenticated && serverCart ? serverCart.isClearingCart : false;
  
  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        getCartSummary,
        isAddingToCart,
        isUpdatingQuantity,
        isRemovingItem,
        isClearingCart,
        refetchCart,
        error
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
