import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProductVariant } from "@shared/schema";
import S3FileUpload from "@/components/common/S3FileUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Common Indian clothing sizes
const CommonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

// Common colors with hex values for reference
const CommonColors = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Brown', hex: '#A52A2A' },
];

export interface VariantFormData {
  color: string;
  size: string;
  sellingPrice: string;
  inventoryQuantity: string;
  sku?: string;
  imageUrl?: string | null;
}

interface ProductVariantManagerProps {
  productId?: number;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({ 
  productId, 
  variants, 
  onChange 
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  const [newVariant, setNewVariant] = useState<VariantFormData>({
    color: '',
    size: '',
    sellingPrice: '',
    inventoryQuantity: '0',
    sku: '',
    imageUrl: null
  });

  const handleAddVariant = () => {
    // Validate form data
    if (!newVariant.color) {
      toast({
        title: "Color required",
        description: "Please enter a color for the variant",
        variant: "destructive"
      });
      return;
    }
    
    if (!newVariant.size) {
      toast({
        title: "Size required",
        description: "Please enter a size for the variant",
        variant: "destructive"
      });
      return;
    }
    
    if (!newVariant.sellingPrice || isNaN(Number(newVariant.sellingPrice)) || Number(newVariant.sellingPrice) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid selling price",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate color-size combination
    const isDuplicate = variants.some(
      v => v.color === newVariant.color && v.size === newVariant.size
    );
    
    if (isDuplicate) {
      toast({
        title: "Duplicate variant",
        description: `A variant with color ${newVariant.color} and size ${newVariant.size} already exists`,
        variant: "destructive"
      });
      return;
    }

    // Add the new variant
    const variantToAdd: ProductVariant = {
      id: Math.floor(Math.random() * -1000000), // Temporary negative ID until saved to DB
      productId: productId || 0,
      color: newVariant.color,
      size: newVariant.size,
      sellingPrice: Number(newVariant.sellingPrice),
      inventoryQuantity: Number(newVariant.inventoryQuantity) || 0,
      sku: newVariant.sku || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: variants.length === 0, // First variant is default
      barcode: null,
      purchasePrice: null,
      mrp: null,
      gst: null,
      weight: null,
      imageUrl: null,
      position: variants.length
    };

    const updatedVariants = [...variants, variantToAdd];
    onChange(updatedVariants);
    
    // Reset form and close dialog
    setNewVariant({
      color: '',
      size: '',
      sellingPrice: '',
      inventoryQuantity: '0',
      sku: '',
      imageUrl: null
    });
    setIsDialogOpen(false);
    
    toast({
      title: "Variant added",
      description: `Added ${variantToAdd.color} - ${variantToAdd.size} variant`,
    });
  };

  const handleRemoveVariant = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    
    // If we removed the default variant and there are other variants,
    // set the first one as default
    if (variants[index].isDefault && updatedVariants.length > 0) {
      updatedVariants[0].isDefault = true;
    }
    
    onChange(updatedVariants);
    
    toast({
      title: "Variant removed",
      description: "Variant has been removed"
    });
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...variants];
    
    // Handle numeric fields
    if (field === 'sellingPrice' || field === 'inventoryQuantity' || 
        field === 'purchasePrice' || field === 'mrp' || field === 'gst') {
      updatedVariants[index][field] = value === '' ? null : Number(value);
    } else {
      updatedVariants[index][field] = value;
    }
    
    onChange(updatedVariants);
  };

  const handleEditVariantImage = (index: number) => {
    setCurrentVariantIndex(index);
    setIsImageDialogOpen(true);
  };
  
  const handleVariantImageUpdate = (imageUrl: string) => {
    if (currentVariantIndex === null) return;
    
    const updatedVariants = [...variants];
    updatedVariants[currentVariantIndex].imageUrl = imageUrl;
    onChange(updatedVariants);
    
    setIsImageDialogOpen(false);
    setCurrentVariantIndex(null);
    
    toast({
      title: "Image updated",
      description: "Variant image has been updated successfully"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Product Variants</h3>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {variants.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Selling Price (₹)</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant, index) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={() => handleEditVariantImage(index)}>
                      <AvatarImage src={variant.imageUrl || undefined} alt={`${variant.color} ${variant.size}`} />
                      <AvatarFallback>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variant.color}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.sellingPrice || ''}
                      onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.inventoryQuantity || '0'}
                      onChange={(e) => handleVariantChange(index, 'inventoryQuantity', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variant.sku || ''}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVariant(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No variants added yet. Click "Add Variant" to create your first variant.</p>
        </div>
      )}

      {/* Add Variant Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Variant</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Input
                id="color"
                value={newVariant.color}
                onChange={(e) => setNewVariant({...newVariant, color: e.target.value})}
                placeholder="e.g. Red, Blue, Green"
                className="col-span-3"
                list="color-suggestions"
              />
              <datalist id="color-suggestions">
                {CommonColors.map(color => (
                  <option key={color.name} value={color.name} />
                ))}
              </datalist>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="size" className="text-right">
                Size
              </Label>
              <Input
                id="size"
                value={newVariant.size}
                onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                placeholder="e.g. S, M, L, XL"
                className="col-span-3"
                list="size-suggestions"
              />
              <datalist id="size-suggestions">
                {CommonSizes.map(size => (
                  <option key={size} value={size} />
                ))}
              </datalist>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sellingPrice" className="text-right">
                Selling Price (₹)
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                value={newVariant.sellingPrice}
                onChange={(e) => setNewVariant({...newVariant, sellingPrice: e.target.value})}
                placeholder="0.00"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={newVariant.inventoryQuantity}
                onChange={(e) => setNewVariant({...newVariant, inventoryQuantity: e.target.value})}
                placeholder="0"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU (Optional)
              </Label>
              <Input
                id="sku"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                placeholder="SKU123"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVariant}>
              Add Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Variant Image</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {currentVariantIndex !== null && variants[currentVariantIndex] && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Uploading image for <span className="font-medium">{variants[currentVariantIndex].color} - {variants[currentVariantIndex].size}</span>
                  </p>
                </div>
                
                {variants[currentVariantIndex].imageUrl && (
                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <img 
                        src={variants[currentVariantIndex].imageUrl} 
                        alt={`${variants[currentVariantIndex].color} ${variants[currentVariantIndex].size}`}
                        className="w-full h-full object-contain border rounded-md"
                      />
                    </div>
                  </div>
                )}
                
                <S3FileUpload
                  folder="variants"
                  onSuccess={handleVariantImageUpdate}
                  acceptedFileTypes="image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductVariantManager;