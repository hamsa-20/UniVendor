import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CartItem = {
  id: number;
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string | null;
  variant: string | null;
};

type Cart = {
  id: number;
  userId: number | null;
  sessionId: string | null;
  vendorId: number;
  items: CartItem[];
  subtotal: string;
  tax: string;
  total: string;
};

export function useCart() {
  const { toast } = useToast();

  // Fetch cart
  const { 
    data: cart,
    isLoading,
    error,
    refetch 
  } = useQuery<Cart>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn(),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: { productId: number; quantity: number; variant?: string; vendorId: number }) => {
      const res = await apiRequest('POST', '/api/cart/add', item);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const res = await apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest('DELETE', `/api/cart/items/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/cart');
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Helper function to update quantity
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity });
    }
  };

  // Helper function to calculate cart summary
  const getCartSummary = () => {
    if (!cart) {
      return {
        subtotal: "0.00",
        tax: "0.00",
        total: "0.00",
        itemCount: 0,
      };
    }

    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    return {
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      itemCount,
    };
  };

  return {
    cart,
    isLoading,
    error,
    addToCart: addToCartMutation.mutate,
    updateQuantity,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    getCartSummary,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    refetchCart: refetch,
  };
}