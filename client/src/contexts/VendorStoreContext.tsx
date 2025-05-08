import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface VendorInfo {
  id: number;
  companyName: string;
  storeTheme: string;
  customCss?: string;
  logoUrl?: string;
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
          
          // Apply custom CSS if available
          if (data.vendor.customCss) {
            const style = document.createElement('style');
            style.id = 'vendor-custom-css';
            style.textContent = data.vendor.customCss;
            document.head.appendChild(style);
          }
          
          // Apply store theme
          document.documentElement.dataset.vendorTheme = data.vendor.storeTheme || 'default';
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
      // Remove custom CSS when component unmounts
      const customStyle = document.getElementById('vendor-custom-css');
      if (customStyle) {
        customStyle.remove();
      }
      
      // Reset vendor theme
      if (document.documentElement.dataset.vendorTheme) {
        delete document.documentElement.dataset.vendorTheme;
      }
    };
  }, []);

  return (
    <VendorStoreContext.Provider value={{ isVendorStore, vendor, domain, loading, error }}>
      {children}
    </VendorStoreContext.Provider>
  );
}