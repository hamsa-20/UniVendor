import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  [key: string]: any;
}

export interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  mergeGuestCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Safe localStorage access
  const getFromLocalStorage = (key: string): any => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
    }
    return null;
  };

  const setToLocalStorage = (key: string, value: any): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = getFromLocalStorage('univendor_cart');
    if (savedCart && Array.isArray(savedCart)) {
      setCart(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    setToLocalStorage('univendor_cart', cart);
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1): void => {
    try {
      if (!product || !product.id) {
        throw new Error('Invalid product');
      }

      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevCart, { ...product, quantity }];
        }
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = (productId: string): void => {
    try {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    try {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = (): void => {
    try {
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const mergeGuestCart = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Get guest cart from localStorage
      const guestCart = getFromLocalStorage('univendor_guest_cart');
      
      if (guestCart && Array.isArray(guestCart) && guestCart.length > 0) {
        // Merge guest cart with current cart
        setCart(prevCart => {
          const mergedCart = [...prevCart];
          
          guestCart.forEach((guestItem: CartItem) => {
            const existingItem = mergedCart.find(item => item.id === guestItem.id);
            
            if (existingItem) {
              // Update quantity if item already exists
              existingItem.quantity += guestItem.quantity;
            } else {
              // Add new item
              mergedCart.push(guestItem);
            }
          });
          
          return mergedCart;
        });

        // Clear guest cart after merging
        if (typeof window !== 'undefined') {
          localStorage.removeItem('univendor_guest_cart');
        }
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = (): number => {
    try {
      return cart.reduce((total, item) => {
        const price = parseFloat(String(item.price)) || 0;
        const quantity = parseInt(String(item.quantity)) || 0;
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  };

  const getCartItemCount = (): number => {
    try {
      return cart.reduce((count, item) => count + (parseInt(String(item.quantity)) || 0), 0);
    } catch (error) {
      console.error('Error calculating cart item count:', error);
      return 0;
    }
  };

  const value: CartContextType = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    mergeGuestCart,
    getCartTotal,
    getCartItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Export the hook with the correct name
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Export the hook with the alternative name for compatibility
export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};