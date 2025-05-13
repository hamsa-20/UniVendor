import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XCircle, Upload, Plus, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import S3FileUpload from '@/components/common/S3FileUpload';
import { apiRequest } from '@/lib/queryClient';

interface ProductImagesUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  endpoint: string;
}

const ProductImagesUploader: React.FC<ProductImagesUploaderProps> = ({
  images = [],
  onChange,
  endpoint,
}) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Add image URL from input
  const addImageUrl = () => {
    if (!imageUrl) return;
    
    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }
    
    // Check if URL already exists
    if (images.includes(imageUrl)) {
      toast({
        title: "Duplicate Image",
        description: "This image URL is already added",
        variant: "destructive",
      });
      return;
    }
    
    // Add new image URL to the list
    onChange([...images, imageUrl]);
    setImageUrl('');
  };

  // Remove image at a specific index
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  // Move image to make it first (featured)
  const makeImageFeatured = (index: number) => {
    if (index === 0) return; // Already featured
    
    const newImages = [...images];
    const featured = newImages.splice(index, 1)[0];
    newImages.unshift(featured);
    onChange(newImages);
    
    toast({
      title: "Featured Image Updated",
      description: "This image is now set as the featured image",
    });
  };

  // Handle S3 upload success
  const handleUploadSuccess = (url: string) => {
    if (images.includes(url)) {
      toast({
        title: "Duplicate Image",
        description: "This image is already added",
        variant: "destructive",
      });
      return;
    }
    
    onChange([...images, url]);
    setIsUploading(false);
  };

  // Handle S3 upload error
  const handleUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
    setIsUploading(false);
  };

  // Handle Enter key press in the URL input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImageUrl();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add image via URL input */}
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL and press Enter"
            className="flex-1"
            onKeyDown={handleKeyDown}
          />
          <Button 
            type="button" 
            onClick={addImageUrl}
            disabled={!imageUrl}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Upload image via S3 */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">OR</p>
        <S3FileUpload
          endpoint={endpoint}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          onUploadStart={() => setIsUploading(true)}
          acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
          maxFileSize={10}
        >
          <Button 
            type="button" 
            variant="outline" 
            disabled={isUploading}
            className="ml-auto"
          >
            {isUploading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                Uploading...
              </div>
            ) : (
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </div>
            )}
          </Button>
        </S3FileUpload>
      </div>
      
      {/* No images message */}
      {images.length === 0 && (
        <div className="border rounded-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No product images added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add images using URL or upload from your device
          </p>
        </div>
      )}
      
      {/* Image preview gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((src, index) => (
            <div 
              key={`${src}-${index}`} 
              className={`group relative rounded-md overflow-hidden border ${index === 0 ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="aspect-square w-full bg-muted relative">
                <img
                  src={src}
                  alt={`Product image ${index + 1}`}
                  className="object-cover h-full w-full"
                  onError={(e) => {
                    // Replace with error placeholder
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E";
                    // Set a placeholder background
                    (e.target as HTMLImageElement).style.background = "#f3f4f6";
                    (e.target as HTMLImageElement).style.padding = "12px";
                  }}
                />
                
                {/* Control overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => makeImageFeatured(index)}
                      className="rounded-full"
                    >
                      Set as Featured
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="rounded-full"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Featured badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    Featured
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1 mt-4">
        <div className="flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 text-muted-foreground" />
          <p>First image will be used as the product's featured image</p>
        </div>
        <div className="flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 text-muted-foreground" />
          <p>Use high quality, well-lit images with clear backgrounds (1:1 aspect ratio recommended)</p>
        </div>
        <div className="flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 text-muted-foreground" />
          <p>Maximum file size: 10MB. Supported formats: JPG, PNG, WebP, GIF</p>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesUploader;