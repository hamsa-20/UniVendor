import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface FontSettings {
  headingFont: string;
  bodyFont: string;
  fontSize: number;
  useCustomFonts: boolean;
  customHeadingFont?: string;
  customBodyFont?: string;
}

interface VendorInfo {
  id: number;
  companyName: string;
  storeTheme: string;
  customCss?: string;
  logoUrl?: string;
  description?: string;
  colorPalette?: string;
  fontSettings?: FontSettings;
}

interface DomainInfo {
  id: number;
  name: string;
  vendorId: number;
  type: string;
  status: string;
  isPrimary: boolean;
}

interface VendorStoreContextType {
  isVendorStore: boolean;
  vendor: VendorInfo | null;
  domain: DomainInfo | null;
  loading: boolean;
  error: string | null;
}

const VendorStoreContext = createContext<VendorStoreContextType>({
  isVendorStore: false,
  vendor: null,
  domain: null,
  loading: true,
  error: null
});

export function useVendorStore() {
  return useContext(VendorStoreContext);
}

interface VendorStoreProviderProps {
  children: ReactNode;
}

// Helper function to generate CSS for theme colors
const generateThemeColorCSS = (colorPalette: string) => {
  // Define color palettes based on the selected option
  const palettes = {
    default: {
      primary: '#4f46e5', // Indigo
      secondary: '#8b5cf6', // Purple
      accent: '#f97316', // Orange
      background: '#ffffff', // White
      text: '#171717', // Black
    },
    ocean: {
      primary: '#0891b2', // Cyan
      secondary: '#0ea5e9', // Sky
      accent: '#14b8a6', // Teal
      background: '#f8fafc', // Light gray
      text: '#0f172a', // Slate
    },
    forest: {
      primary: '#15803d', // Green
      secondary: '#059669', // Emerald
      accent: '#ca8a04', // Yellow
      background: '#f8fafc', // Light gray
      text: '#1e293b', // Slate dark
    },
    sunset: {
      primary: '#db2777', // Pink
      secondary: '#e11d48', // Rose
      accent: '#f59e0b', // Amber
      background: '#ffffff', // White
      text: '#171717', // Black
    },
    monochrome: {
      primary: '#404040', // Gray
      secondary: '#525252', // Gray light
      accent: '#737373', // Gray lighter
      background: '#fafafa', // Gray lightest
      text: '#171717', // Black
    },
    custom: {
      primary: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#f97316',
      background: '#ffffff',
      text: '#171717',
    },
  };

  // Get the selected palette or default if not found
  const palette = palettes[colorPalette as keyof typeof palettes] || palettes.default;

  // Generate CSS variables
  return `
    :root {
      --color-primary: ${palette.primary};
      --color-primary-foreground: white;
      --color-secondary: ${palette.secondary};
      --color-secondary-foreground: white;
      --color-accent: ${palette.accent};
      --color-accent-foreground: white;
      --color-background: ${palette.background};
      --color-foreground: ${palette.text};
    }
  `;
};

// Helper function to generate font CSS
const generateFontCSS = (fontSettings?: FontSettings) => {
  if (!fontSettings) {
    return '';
  }

  const { headingFont, bodyFont, fontSize, useCustomFonts } = fontSettings;

  return `
    :root {
      --font-heading: var(--font-${headingFont}, sans-serif);
      --font-body: var(--font-${bodyFont}, sans-serif);
      --font-size-base: ${fontSize}px;
    }
    
    body {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  `;
};

// Helper function to apply theme CSS based on theme name
const generateThemeCSS = (themeName: string) => {
  // Theme-specific styles
  const themeStyles: Record<string, string> = {
    default: `
      /* Default theme styles */
      .store-header {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .product-card {
        border-radius: 0.5rem;
        transition: transform 0.2s ease;
      }
      .product-card:hover {
        transform: translateY(-4px);
      }
    `,
    elegant: `
      /* Elegant theme styles */
      .store-header {
        border-bottom: 1px solid rgba(0,0,0,0.1);
      }
      .product-card {
        border-radius: 0.25rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }
      .btn {
        border-radius: 0.25rem;
      }
    `,
    bold: `
      /* Bold theme styles */
      .store-header {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .product-card {
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
      }
      .btn {
        border-radius: 0.5rem;
        font-weight: bold;
      }
    `,
    vintage: `
      /* Vintage theme styles */
      .store-header {
        border-bottom: 2px solid var(--color-accent);
      }
      .product-card {
        border-radius: 0;
        border: 1px solid rgba(0,0,0,0.1);
      }
      .btn {
        border-radius: 0;
      }
    `,
    modern: `
      /* Modern theme styles */
      .store-header {
        backdrop-filter: blur(10px);
        background-color: rgba(255,255,255,0.8);
      }
      .product-card {
        border-radius: 1rem;
        overflow: hidden;
      }
      .btn {
        border-radius: 2rem;
      }
    `,
  };

  return themeStyles[themeName] || themeStyles.default;
};

export function VendorStoreProvider({ children }: VendorStoreProviderProps) {
  const [isVendorStore, setIsVendorStore] = useState(false);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [domain, setDomain] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        setLoading(true);
        // Get current domain information
        const res = await apiRequest('GET', '/api/store/current');
        
        if (res.status === 404) {
          // Not a vendor store domain
          setIsVendorStore(false);
          setLoading(false);
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch store information');
        }
        
        const data = await res.json();
        
        if (data.isVendorStore && data.vendor) {
          setIsVendorStore(true);
          setVendor(data.vendor);
          setDomain(data.domain);
          
          // Apply theme styling
          applyStoreTheme(data.vendor);
        } else {
          setIsVendorStore(false);
        }
      } catch (err) {
        console.error('Error fetching store information:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
    
    // Cleanup function
    return () => {
      // Remove all custom styling when component unmounts
      removeStoreTheme();
    };
  }, []);

  // Function to apply store theme
  const applyStoreTheme = (vendorData: VendorInfo) => {
    // Remove any existing style elements first
    removeStoreTheme();
    
    // Apply theme attribute to document
    document.documentElement.dataset.vendorTheme = vendorData.storeTheme || 'default';
    
    // Create style element for all theme CSS
    const style = document.createElement('style');
    style.id = 'vendor-theme-css';
    
    // Build complete CSS
    let css = '';
    
    // Add color palette CSS
    css += generateThemeColorCSS(vendorData.colorPalette || 'default');
    
    // Add font CSS
    css += generateFontCSS(vendorData.fontSettings);
    
    // Add theme-specific CSS
    css += generateThemeCSS(vendorData.storeTheme || 'default');
    
    // Add custom CSS if available
    if (vendorData.customCss) {
      css += vendorData.customCss;
    }
    
    style.textContent = css;
    document.head.appendChild(style);
  };
  
  // Function to remove store theme
  const removeStoreTheme = () => {
    // Remove custom CSS
    const customStyle = document.getElementById('vendor-theme-css');
    if (customStyle) {
      customStyle.remove();
    }
    
    // Reset vendor theme attribute
    if (document.documentElement.dataset.vendorTheme) {
      delete document.documentElement.dataset.vendorTheme;
    }
  };

  return (
    <VendorStoreContext.Provider value={{ isVendorStore, vendor, domain, loading, error }}>
      {children}
    </VendorStoreContext.Provider>
  );
}