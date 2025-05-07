import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';

type ThemePreviewProps = {
  themeName: string;
  vendorId?: number;
};

const ThemePreview = ({ themeName, vendorId }: ThemePreviewProps) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLs for different preview modes
  const getPreviewUrl = () => {
    if (!vendorId) {
      // Use generic preview if no vendor ID is provided
      return `/theme-preview/${themeName}`;
    }
    return `/store-preview/${vendorId}?theme=${themeName}`;
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load theme preview');
  };

  // Reset loading state when theme or device changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [themeName, device]);

  // Get device dimensions
  const getDeviceClasses = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px] h-[667px]';
      case 'tablet':
        return 'w-[768px] h-[1024px]';
      case 'desktop':
      default:
        return 'w-full h-[600px]';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Theme Preview</h3>
        <Tabs value={device} onValueChange={(value) => setDevice(value as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="desktop" className="px-3">
              <Monitor className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Desktop</span>
            </TabsTrigger>
            <TabsTrigger value="tablet" className="px-3">
              <Tablet className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Tablet</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="px-3">
              <Smartphone className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Mobile</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-1 overflow-hidden rounded-md">
          <div className="relative flex items-center justify-center bg-gray-100 border rounded-md overflow-auto">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10 p-4">
                <p className="text-red-500 mb-2">{error}</p>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    setTimeout(() => setIsLoading(false), 500);
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
            
            <div className={`transition-all duration-300 ${getDeviceClasses()}`}>
              <iframe
                src={getPreviewUrl()}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={`${themeName} theme preview`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground">
        This is a preview of how your store will look with the selected theme. The preview may not include your actual content and products.
      </p>
    </div>
  );
};

export default ThemePreview;