import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Local cart type
type CartItem = {
  id: string;
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string | null;
  variant: string | null;
};

type Cart = {
  items: CartItem[];
  subtotal: string;
  tax: string;
  total: string;
};

export default function IndependentCartPage() {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
  });
  
  // A simple function to add a test product to cart
  const addTestProduct = () => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      productId: 123,
      name: "Test Product",
      price: "29.99",
      quantity: 1,
      imageUrl: null,
      variant: "Medium / Red",
    };
    
    const newItems = [...cart.items, newItem];
    
    // Calculate subtotal
    const subtotal = newItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    // Apply tax (e.g., 8%)
    const tax = subtotal * 0.08;
    
    setCart({
      items: newItems,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    });
  };
  
  // Remove item from cart
  const removeItem = (id: string) => {
    const newItems = cart.items.filter(item => item.id !== id);
    
    // Recalculate values
    const subtotal = newItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.08;
    
    setCart({
      items: newItems,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    });
  };
  
  // Update quantity
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
      return;
    }
    
    const newItems = cart.items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    // Recalculate values
    const subtotal = newItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.08;
    
    setCart({
      items: newItems,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Independent Cart Page</h1>
      <p className="mb-4">This cart page uses its own state, not the CartContext.</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cart Test</CardTitle>
          <CardDescription>Add and remove items</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={addTestProduct} className="mb-4">
            Add Test Product
          </Button>
          
          <div className="space-y-4 mt-4">
            {cart.items.length === 0 ? (
              <p>Cart is empty</p>
            ) : (
              <>
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price}</p>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="mx-2">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${cart.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${cart.tax}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${cart.total}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
