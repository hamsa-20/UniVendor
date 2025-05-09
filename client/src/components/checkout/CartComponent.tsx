import { useCart } from "@/hooks/useCart";
import { Loader2, MinusCircle, PlusCircle, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "wouter";
import { formatCurrency } from "@/lib/formatCurrency";

type CartProps = {
  vendorId: number;
  onCheckout?: () => void;
};

export function CartComponent({ vendorId, onCheckout }: CartProps) {
  const { 
    cart, 
    isLoading, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getCartSummary,
    isUpdatingQuantity
  } = useCart();
  const navigate = useNavigate();

  const { subtotal, tax, total, itemCount } = getCartSummary();

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      navigate(`/checkout?vendorId=${vendorId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
          </CardTitle>
          <CardDescription>Your shopping cart is empty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items in your cart</p>
            <p className="text-sm text-muted-foreground mb-4">
              Browse products and add items to your cart
            </p>
            <Button onClick={() => navigate(`/store/${vendorId}`)}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Your Cart <Badge variant="outline" className="ml-2">{itemCount} items</Badge>
        </CardTitle>
        <CardDescription>Review your items before checkout</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-muted">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-secondary">
                    <ShoppingCart className="h-8 w-8 text-secondary-foreground opacity-50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                {item.variant && (
                  <p className="text-sm text-muted-foreground">
                    Variant: {item.variant}
                  </p>
                )}
                <p className="text-sm font-semibold">
                  {formatCurrency(parseFloat(item.price))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isUpdatingQuantity}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isUpdatingQuantity}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(item.id)}
                  disabled={isUpdatingQuantity}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(parseFloat(subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(parseFloat(tax))}</span>
          </div>
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>{formatCurrency(parseFloat(total))}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => clearCart()}
          >
            Clear Cart
          </Button>
          <Button 
            className="flex-1"
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
        <Button 
          variant="ghost"
          className="w-full"
          onClick={() => navigate(`/store/${vendorId}`)}
        >
          Continue Shopping
        </Button>
      </CardFooter>
    </Card>
  );
}