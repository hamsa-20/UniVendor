import { useState, useEffect } from 'react';
import { Loader2, ShoppingBag, Search, Menu, ShoppingCart, Home, Grid, Heart, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ThemePreviewProps = {
  themeName: string;
  colorPalette?: string;
  fontSettings?: any;
  vendorId?: number;
};

const ThemePreview = ({ themeName, colorPalette = 'default', fontSettings, vendorId }: ThemePreviewProps) => {
  const [loading, setLoading] = useState(true);

  // Simulate loading for 500ms to give a better experience
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [themeName, colorPalette, fontSettings]);

  // Function to get appropriate theme structure based on theme name
  const getThemeLayout = () => {
    switch (themeName) {
      case 'elegant':
        return {
          fontFamily: 'serif',
          cardRadius: '0.25rem',
          borderWidth: '1px',
          buttonRadius: '0.25rem',
        };
      case 'bold':
        return {
          fontFamily: 'sans-serif',
          cardRadius: '0.75rem',
          borderWidth: '2px',
          buttonRadius: '0.5rem',
        };
      case 'vintage':
        return {
          fontFamily: 'serif',
          cardRadius: '0',
          borderWidth: '1px',
          buttonRadius: '0',
        };
      case 'modern':
        return {
          fontFamily: 'sans-serif',
          cardRadius: '1rem',
          borderWidth: '1px',
          buttonRadius: '2rem',
        };
      case 'default':
      default:
        return {
          fontFamily: 'sans-serif',
          cardRadius: '0.5rem',
          borderWidth: '1px',
          buttonRadius: '0.5rem',
        };
    }
  };
  
  // Function to get color palette based on selection
  const getColorPalette = () => {
    switch (colorPalette) {
      case 'ocean':
        return {
          primaryColor: '#0891b2', // Cyan
          secondaryColor: '#0ea5e9', // Sky
          accentColor: '#14b8a6', // Teal
          bgColor: '#f8fafc', // Light gray
          textColor: '#0f172a', // Slate
        };
      case 'forest':
        return {
          primaryColor: '#15803d', // Green
          secondaryColor: '#059669', // Emerald
          accentColor: '#ca8a04', // Yellow
          bgColor: '#f8fafc', // Light gray
          textColor: '#1e293b', // Slate dark
        };
      case 'sunset':
        return {
          primaryColor: '#db2777', // Pink
          secondaryColor: '#e11d48', // Rose
          accentColor: '#f59e0b', // Amber
          bgColor: '#ffffff', // White
          textColor: '#171717', // Black
        };
      case 'monochrome':
        return {
          primaryColor: '#404040', // Gray
          secondaryColor: '#525252', // Gray light
          accentColor: '#737373', // Gray lighter
          bgColor: '#fafafa', // Gray lightest
          textColor: '#171717', // Black
        };
      case 'default':
      default:
        return {
          primaryColor: '#4f46e5', // Indigo
          secondaryColor: '#8b5cf6', // Purple
          accentColor: '#f97316', // Orange
          bgColor: '#ffffff', // White
          textColor: '#171717', // Black
        };
    }
  };
  
  // Function to merge theme layout and color palette
  const getThemeStyles = () => {
    const layout = getThemeLayout();
    const colors = getColorPalette();
    
    // Use font settings if provided, otherwise use theme defaults
    const fontFamily = fontSettings?.headingFont 
      ? `var(--font-${fontSettings.headingFont}, ${layout.fontFamily})` 
      : layout.fontFamily;
    
    const fontSize = fontSettings?.fontSize || 16;
    
    return {
      ...layout,
      ...colors,
      fontFamily,
      fontSize: `${fontSize}px`,
    };
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
            fontSize: styles.fontSize,
          }}
        >
          {/* Preview Info Overlay */}
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md text-xs border shadow-sm">
            <div className="font-semibold">Theme: {themeName}</div>
            <div>Palette: {colorPalette}</div>
            {fontSettings && (
              <div>Font: {fontSettings.headingFont || 'Default'}</div>
            )}
          </div>
          
          {/* Header */}
          <div className="border-b p-3 flex justify-between items-center" style={{ borderColor: `${styles.primaryColor}20` }}>
            <div className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              <span className="text-lg font-bold" style={{ color: styles.primaryColor }}>YourStore</span>
            </div>
            <div className="flex items-center gap-4">
              <Search className="h-4 w-4" />
              <ShoppingCart className="h-4 w-4" style={{ color: styles.secondaryColor }} />
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
              className="text-sm py-1.5 px-4" 
              style={{ 
                backgroundColor: styles.primaryColor, 
                color: 'white',
                borderRadius: styles.buttonRadius,
                border: `${styles.borderWidth} solid ${styles.primaryColor}`
              }}
            >
              Shop Now
            </button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3 p-3">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item} 
                className="border overflow-hidden" 
                style={{ 
                  borderColor: `${styles.primaryColor}10`,
                  borderRadius: styles.cardRadius,
                  borderWidth: styles.borderWidth
                }}
              >
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
                      <Badge 
                        variant="outline" 
                        className="text-[10px] h-4" 
                        style={{ 
                          borderColor: item % 2 === 0 ? styles.primaryColor : styles.secondaryColor, 
                          color: item % 2 === 0 ? styles.primaryColor : styles.secondaryColor,
                          borderRadius: styles.buttonRadius
                        }}
                      >
                        Sale
                      </Badge>
                    )}
                    {item === 3 && (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] h-4" 
                        style={{ 
                          borderColor: styles.accentColor, 
                          color: styles.accentColor,
                          borderRadius: styles.buttonRadius
                        }}
                      >
                        New
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