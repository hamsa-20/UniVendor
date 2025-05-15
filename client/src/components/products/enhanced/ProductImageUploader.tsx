import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image as ImageIcon, Upload, Trash2, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProductImageUploaderProps {
  value: string[]; // Array of image URLs
  featuredImage?: string | null;
  onChange: (urls: string[]) => void;
  onFeaturedImageChange?: (url: string | null) => void;
}

export default function ProductImageUploader({
  value = [],
  featuredImage,
  onChange,
  onFeaturedImageChange,
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    try {
      setIsUploading(true);
      const files = Array.from(event.target.files);
      
      // Upload each file and collect promises
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        
        const response = await fetch("/api/s3/upload/product-image", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        return data.url;
      });
      
      // Wait for all uploads to complete
      const newImageUrls = await Promise.all(uploadPromises);
      
      // Combine with existing images
      const updatedImageUrls = [...value, ...newImageUrls];
      onChange(updatedImageUrls);
      
      // If no featured image is set and we've just uploaded our first image, set it as featured
      if (onFeaturedImageChange && !featuredImage && newImageUrls.length > 0) {
        onFeaturedImageChange(newImageUrls[0]);
      }
      
      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${newImageUrls.length} image${newImageUrls.length !== 1 ? 's' : ''}`,
      });
      
      // Reset the file input
      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    const removedUrl = newImages.splice(index, 1)[0];
    onChange(newImages);
    
    // If the removed image was the featured image, reset or update featured image
    if (onFeaturedImageChange && featuredImage === removedUrl) {
      onFeaturedImageChange(newImages.length > 0 ? newImages[0] : null);
    }
  };

  const setAsFeatured = (url: string) => {
    if (onFeaturedImageChange) {
      onFeaturedImageChange(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="product-images" className="text-base font-medium">
          Product Images
        </Label>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById("product-images")?.click()}
            disabled={isUploading}
            className="w-full md:w-auto py-6 border-dashed"
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload Images"}
          </Button>
          <input
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      {featuredImage && onFeaturedImageChange && (
        <div className="space-y-2">
          <Label className="text-base font-medium">Featured Image</Label>
          <Card className="overflow-hidden">
            <div className="relative group">
              <AspectRatio ratio={4 / 3}>
                <img 
                  src={featuredImage} 
                  alt="Featured product image" 
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
              <div className="absolute top-2 right-2 flex gap-1">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onFeaturedImageChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base font-medium">
          All Images ({value.length})
        </Label>
        
        {value.length > 0 ? (
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {value.map((url, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="relative group">
                    <AspectRatio ratio={1}>
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className={cn(
                          "object-cover w-full h-full",
                          featuredImage === url && "ring-2 ring-primary ring-offset-2"
                        )}
                      />
                    </AspectRatio>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-1">
                        {onFeaturedImageChange && featuredImage !== url && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8"
                            onClick={() => setAsFeatured(url)}
                          >
                            Set as Featured
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {featuredImage === url && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-sm">
                        Featured
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card className="flex flex-col items-center justify-center py-10">
            <ImageIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No product images uploaded yet</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => document.getElementById("product-images")?.click()}
            >
              Upload your first image
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}