import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define cart item type
export type LocalCartItem = {
  id: string;
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string | null;
  variant: string | null;
  colorHex: string | null;
  size: string | null;
  vendorId: number;
};

// Define local cart type
export type LocalCart = {
  items: LocalCartItem[];
  subtotal: string;
  tax: string;
  total: string;
};

// Storage key for cart
const LOCAL_CART_KEY = 'univendor_cart';

// Helper function to calculate cart summary
const calculateCartSummary = (items: LocalCartItem[]) => {
  const subtotal = items.reduce((total, item) => {
    return total + parseFloat(item.price) * item.quantity;
  }, 0);
  
  // Apply tax rate (e.g., 8%)
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
  };
};

export function useLocalCart() {
  const [cart, setCart] = useState<LocalCart>({
    items: [],
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(LOCAL_CART_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart) as LocalCart;
          setCart(parsedCart);
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Add item to cart
  const addToCart = (item: Omit<LocalCartItem, 'id'>) => {
    setCart((prevCart) => {
      // Check if the item already exists with the same variant
      const existingItemIndex = prevCart.items.findIndex(
        (cartItem) => 
          cartItem.productId === item.productId && 
          cartItem.variant === item.variant
      );
      
      let newItems;
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity,
        };
      } else {
        // Add new item with unique ID
        newItems = [
          ...prevCart.items,
          { ...item, id: uuidv4() },
        ];
      }
      
      const { subtotal, tax, total } = calculateCartSummary(newItems);
      
      return {
        items: newItems,
        subtotal,
        tax,
        total,
      };
    });
  };

  // Update quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => 
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const { subtotal, tax, total } = calculateCartSummary(newItems);
      
      return {
        items: newItems,
        subtotal,
        tax,
        total,
      };
    });
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.id !== itemId);
      
      const { subtotal, tax, total } = calculateCartSummary(newItems);
      
      return {
        items: newItems,
        subtotal,
        tax,
        total,
      };
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart({
      items: [],
      subtotal: '0.00',
      tax: '0.00',
      total: '0.00',
    });
  };

  // Helper function to calculate cart summary
  const getCartSummary = () => {
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    return {
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      itemCount,
    };
  };

  // Get the entire cart for merging with server cart on login
  const getFullCart = () => {
    return cart;
  };

  return {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getCartSummary,
    getFullCart,
  };
}
