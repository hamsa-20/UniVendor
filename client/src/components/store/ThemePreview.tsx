import { useState, useEffect } from 'react';
import { Loader2, ShoppingBag, Search, Menu, ShoppingCart, Home, Grid, Heart, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ThemePreviewProps = {
  themeName: string;
  vendorId?: number;
};

const ThemePreview = ({ themeName, vendorId }: ThemePreviewProps) => {
  const [loading, setLoading] = useState(true);

  // Simulate loading for 500ms to give a better experience
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [themeName]);

  // Function to get appropriate styles based on theme
  const getThemeStyles = () => {
    switch (themeName) {
      case 'elegant':
        return {
          primaryColor: '#8b5cf6', // Purple
          secondaryColor: '#d8b4fe',
          bgColor: '#f8f9fa', 
          textColor: '#1e293b',
          fontFamily: 'serif',
        };
      case 'bold':
        return {
          primaryColor: '#ef4444', // Red
          secondaryColor: '#fca5a5',
          bgColor: '#f9fafb',
          textColor: '#111827',
          fontFamily: 'sans-serif',
        };
      case 'vintage':
        return {
          primaryColor: '#84cc16', // Lime
          secondaryColor: '#bef264',
          bgColor: '#fffbeb',
          textColor: '#713f12',
          fontFamily: 'serif',
        };
      case 'modern':
        return {
          primaryColor: '#06b6d4', // Cyan
          secondaryColor: '#67e8f9',
          bgColor: '#f8fafc',
          textColor: '#0f172a',
          fontFamily: 'sans-serif',
        };
      case 'default':
      default:
        return {
          primaryColor: '#4f46e5', // Indigo
          secondaryColor: '#a5b4fc',
          bgColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'sans-serif',
        };
    }
  };

  const styles = getThemeStyles();

  if (loading) {
    return (
      <Card className="border h-full flex items-center justify-center">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading theme preview...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border overflow-hidden">
      <CardContent className="p-0">
        <div 
          className="relative h-[500px] overflow-hidden"
          style={{
            backgroundColor: styles.bgColor,
            color: styles.textColor,
            fontFamily: styles.fontFamily,
          }}
        >
          {/* Header */}
          <div className="border-b p-3 flex justify-between items-center" style={{ borderColor: `${styles.primaryColor}20` }}>
            <div className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              <span className="text-lg font-bold" style={{ color: styles.primaryColor }}>YourStore</span>
            </div>
            <div className="flex items-center gap-4">
              <Search className="h-4 w-4" />
              <ShoppingCart className="h-4 w-4" />
              <User className="h-4 w-4" />
            </div>
          </div>

          {/* Navigation */}
          <div className="border-b py-2 px-3 flex gap-4" style={{ borderColor: `${styles.primaryColor}20` }}>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium" style={{ color: styles.primaryColor }}>
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Shop</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Grid className="h-3.5 w-3.5" />
              <span>Categories</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart className="h-3.5 w-3.5" />
              <span>Wishlist</span>
            </div>
          </div>

          {/* Hero */}
          <div className="p-4 text-center py-8">
            <h2 className="text-xl font-bold mb-2" style={{ color: styles.primaryColor }}>Summer Collection</h2>
            <p className="text-sm mb-4 max-w-xs mx-auto">Discover our latest products with amazing discounts for the summer season.</p>
            <button 
              className="text-sm py-1.5 px-4 rounded-md" 
              style={{ backgroundColor: styles.primaryColor, color: 'white' }}
            >
              Shop Now
            </button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3 p-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="border rounded-md overflow-hidden" style={{ borderColor: `${styles.primaryColor}10` }}>
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-gray-300" />
                </div>
                <div className="p-2">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-medium truncate">Product Name</div>
                    <div className="text-sm font-bold" style={{ color: styles.primaryColor }}>$99</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Category</div>
                    {item === 2 && (
                      <Badge variant="outline" className="text-[10px] h-4" style={{ borderColor: styles.primaryColor, color: styles.primaryColor }}>
                        Sale
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 text-center p-3 text-xs border-t text-muted-foreground" style={{ borderColor: `${styles.primaryColor}20` }}>
            © 2025 YourStore. All rights reserved.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemePreview;