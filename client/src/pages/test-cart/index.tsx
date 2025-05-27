import React, { useState, useEffect } from 'react';
import { useCartContext, CartContextType } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestCartPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartData, setCartData] = useState<any>(null);
  const { toast } = useToast();
  
  // Safely get the cart context
  let cartContext: import("@/contexts/CartContext").CartContextType | undefined;
  try {
    cartContext = useCartContext();
  } catch (err: any) {
    console.error("Error getting cart context:", err);
    setError(err?.message || "Failed to load cart context");
  }
  
  useEffect(() => {
    // Wrap in try/catch to identify any potential errors
    try {
      if (cartContext) {
        const summary = cartContext.getCartSummary();
        setCartData({
          itemCount: summary.itemCount,
          cart: cartContext.cart
        });
      }
    } catch (err: any) {
      console.error("Error in useEffect:", err);
      setError(err?.message || "Failed to get cart data");
    } finally {
      setIsLoading(false);
    }
  }, [cartContext]);

  const itemCount = cartData?.itemCount || 0;

  const handleAddToCart = () => {
    try {
      if (!cartContext) {
        toast({
          title: "Error",
          description: "Cart context not available",
          variant: "destructive"
        });
        return;
      }

      cartContext.addToCart({
        productId: 123,
        name: "Test Product",
        price: "29.99",
        quantity: 1,
        imageUrl: null,
        variant: "M / Red",
        colorHex: "#ff0000",
        size: "M",
        vendorId: 1
      });
      
      toast({
        title: "Added to cart",
        description: "Test product added to your cart",
      });
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      toast({
        title: "Error adding to cart",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Remove all remaining checks for cartContext being possibly undefined

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Cart Test Page</h1>
      
      {isLoading && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <p>Loading cart data...</p>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="mb-6 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cart Operations</CardTitle>
          <CardDescription>Test the cart functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Current items in cart: <strong>{itemCount}</strong></p>
          <div className="space-y-4">
            <Button onClick={handleAddToCart}>
              Add Test Product to Cart
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (cartContext) {
                  cartContext.clearCart();
                  toast({
                    title: "Cart cleared",
                    description: "All items removed from your cart"
                  });
                }
              }}
            >
              Clear Cart
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            This page tests the cart functionality including local storage persistence for guest users.
          </p>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cart Contents</CardTitle>
        </CardHeader>
        <CardContent>
          {cartContext && cartContext.cart && cartContext.cart.items && cartContext.cart.items.length > 0 ? (
            <div className="space-y-2">
              {cartContext.cart.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => cartContext && cartContext.updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => cartContext && cartContext.updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="ml-2 text-destructive"
                      onClick={() => cartContext && cartContext.removeItem(item.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-right">
                <p>Subtotal: ${cartContext.cart.subtotal}</p>
                <p>Tax: ${cartContext.cart.tax}</p>
                <p className="font-bold">Total: ${cartContext.cart.total}</p>
              </div>
            </div>
          ) : (
            <p>Your cart is empty</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
