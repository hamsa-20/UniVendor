import React, { useState, useEffect, useCallback } from 'react';
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, ImageIcon, RefreshCw, Edit, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProductVariant } from "@shared/schema";
import S3FileUpload from "@/components/common/S3FileUpload";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Interface for attribute values
interface AttributeValue {
  id: string;
  value: string;
}

// Interface for variant attribute
interface VariantAttribute {
  name: string;
  values: AttributeValue[];
}

// Interface for the matrix variant
interface MatrixVariant extends ProductVariant {
  attributes: Record<string, string>; // e.g. { "Color": "Red", "Size": "XL" }
  images: string[]; // Array of image URLs
}

interface MatrixVariantManagerProps {
  productId?: number;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export const MatrixVariantManager: React.FC<MatrixVariantManagerProps> = ({ 
  productId, 
  variants, 
  onChange 
}) => {
  const { toast } = useToast();
  
  // State for attributes (e.g., "Color", "Size")
  const [attributes, setAttributes] = useState<VariantAttribute[]>([
    { name: "Color", values: [] },
    { name: "Size", values: [] }
  ]);
  
  // State for matrix variants
  const [matrixVariants, setMatrixVariants] = useState<MatrixVariant[]>([]);
  
  // State for the attributes editor dialog
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = useState(false);
  
  // State for the variant editor dialog
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState<number | null>(null);
  
  // State for adding a new attribute value
  const [newAttributeValue, setNewAttributeValue] = useState<string>("");
  const [currentAttributeIndex, setCurrentAttributeIndex] = useState<number>(0);
  
  // State for bulk editing
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<string>("");
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  
  // State for image management dialog
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>("");

  // Initialize or convert from existing variants
  useEffect(() => {
    if (variants.length > 0 && matrixVariants.length === 0) {
      // If we have existing variants but no matrix variants, try to convert them
      const convertedVariants = variants.map(variant => ({
        ...variant,
        attributes: {
          Color: variant.color || "",
          Size: variant.size || ""
        },
        images: variant.imageUrl ? [variant.imageUrl] : []
      }));
      
      setMatrixVariants(convertedVariants);
      
      // Extract unique attribute values
      const colors = new Set<string>();
      const sizes = new Set<string>();
      
      convertedVariants.forEach(variant => {
        if (variant.attributes.Color) colors.add(variant.attributes.Color);
        if (variant.attributes.Size) sizes.add(variant.attributes.Size);
      });
      
      // Update attributes with existing values
      setAttributes([
        { 
          name: "Color", 
          values: Array.from(colors).map(color => ({ id: crypto.randomUUID(), value: color }))
        },
        { 
          name: "Size", 
          values: Array.from(sizes).map(size => ({ id: crypto.randomUUID(), value: size }))
        }
      ]);
    }
  }, [variants]);

  // Helper function to generate SKU from product ID and attributes
  const generateSku = useCallback((productId: number | undefined, attributes: Record<string, string>): string => {
    const prefix = productId ? `P${productId}` : 'TEMP';
    
    // Create a code from attribute values (first 1-2 characters of each)
    const attributeParts = Object.entries(attributes)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by attribute name for consistency
      .map(([key, value]) => {
        // Extract first character or first two if first char is a number
        const valueStr = String(value).trim();
        if (!valueStr) return '';
        
        // For better readability, take up to 2 chars
        return valueStr.substring(0, 2).toUpperCase();
      })
      .join('-');
    
    return `${prefix}-${attributeParts}`;
  }, []);

  // Function to delete all variants
  const deleteAllVariants = () => {
    if (matrixVariants.length === 0) {
      toast({
        title: "No variants to delete",
        description: "There are no variants to delete.",
        variant: "destructive"
      });
      return;
    }
    
    setMatrixVariants([]);
    onChange([]);
    
    toast({
      title: "All variants deleted",
      description: "All variants have been deleted successfully.",
    });
  };

  // Function to generate all possible combinations of attribute values
  const generateVariantCombinations = () => {
    // Make sure we have attribute values to combine
    const hasValues = attributes.every(attr => attr.values.length > 0);
    if (!hasValues) {
      toast({
        title: "Missing attribute values",
        description: "Please add at least one value for each attribute",
        variant: "destructive"
      });
      return;
    }
    
    // Get all combinations using Cartesian product
    const combinations: Record<string, string>[] = attributes.reduce(
      (acc, attribute) => {
        if (attribute.values.length === 0) return acc;
        
        if (acc.length === 0) {
          return attribute.values.map(val => ({ [attribute.name]: val.value }));
        }
        
        return acc.flatMap(combo => 
          attribute.values.map(val => ({
            ...combo,
            [attribute.name]: val.value
          }))
        );
      }, 
      [] as Record<string, string>[]
    );
    
    // Create or update matrix variants based on combinations
    const newMatrixVariants = combinations.map(combo => {
      // Check if this combination already exists
      const existingVariant = matrixVariants.find(variant => 
        Object.entries(combo).every(
          ([key, value]) => variant.attributes[key] === value
        )
      );
      
      if (existingVariant) {
        return existingVariant;
      }
      
      // Auto-generate SKU
      const autoSku = generateSku(productId, combo);
      
      // Create a new variant
      return {
        id: crypto.randomUUID(),
        productId: productId || 0,
        color: combo["Color"] || "",
        size: combo["Size"] || "",
        sku: autoSku,
        attributes: combo,
        sellingPrice: 0,
        mrp: 0,
        purchasePrice: 0,
        gst: 0,
        inventoryQuantity: 0,
        images: [],
        imageUrl: null // For backward compatibility
      };
    });
    
    setMatrixVariants(newMatrixVariants);
    
    // Also update the parent component with the new variants
    // but convert to the expected format first
    const convertedVariants = newMatrixVariants.map(variant => ({
      ...variant,
      color: variant.attributes["Color"] || "",
      size: variant.attributes["Size"] || "",
      imageUrl: variant.images[0] || null
    }));
    
    onChange(convertedVariants);
    
    toast({
      title: "Variants generated",
      description: `Created ${newMatrixVariants.length} product variants`
    });
  };

  // Function to add a new attribute value
  const addAttributeValue = () => {
    if (!newAttributeValue.trim()) {
      toast({
        title: "Empty value",
        description: "Please enter a value to add",
        variant: "destructive"
      });
      return;
    }
    
    const updatedAttributes = [...attributes];
    const currentAttr = updatedAttributes[currentAttributeIndex];
    
    // Check for duplicates
    if (currentAttr.values.some(v => v.value.toLowerCase() === newAttributeValue.toLowerCase())) {
      toast({
        title: "Duplicate value",
        description: `${newAttributeValue} already exists for ${currentAttr.name}`,
        variant: "destructive"
      });
      return;
    }
    
    // Add the new value
    currentAttr.values.push({
      id: crypto.randomUUID(),
      value: newAttributeValue
    });
    
    setAttributes(updatedAttributes);
    setNewAttributeValue("");
  };

  // Function to remove an attribute value
  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].values.splice(valueIndex, 1);
    setAttributes(updatedAttributes);
  };

  // Function to update a variant property
  const updateVariant = (index: number, field: string, value: any) => {
    const updatedVariants = [...matrixVariants];
    
    if (field.includes('.')) {
      // Handle nested fields like 'attributes.Color'
      const [parent, child] = field.split('.');
      (updatedVariants[index] as any)[parent][child] = value;
    } else {
      // Handle top-level fields
      (updatedVariants[index] as any)[field] = value;
      
      // Keep color and size in sync with attributes for backward compatibility
      if (field === 'attributes') {
        updatedVariants[index].color = value["Color"] || "";
        updatedVariants[index].size = value["Size"] || "";
      }
    }
    
    setMatrixVariants(updatedVariants);
    
    // Also update the parent component
    const convertedVariants = updatedVariants.map(variant => ({
      ...variant,
      color: variant.attributes["Color"] || "",
      size: variant.attributes["Size"] || "",
      imageUrl: variant.images[0] || null
    }));
    
    onChange(convertedVariants);
  };

  // Function to remove a variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...matrixVariants];
    updatedVariants.splice(index, 1);
    setMatrixVariants(updatedVariants);
    
    // Also update the parent component
    const convertedVariants = updatedVariants.map(variant => ({
      ...variant,
      color: variant.attributes["Color"] || "",
      size: variant.attributes["Size"] || "",
      imageUrl: variant.images[0] || null
    }));
    
    onChange(convertedVariants);
  };

  // Function to apply bulk edit
  const applyBulkEdit = () => {
    if (!bulkEditField || (!bulkEditValue && bulkEditField !== "images")) {
      toast({
        title: "Invalid bulk edit",
        description: "Please select a field and enter a value",
        variant: "destructive"
      });
      return;
    }
    
    const updatedVariants = [...matrixVariants];
    
    updatedVariants.forEach(variant => {
      if (bulkEditField === "sellingPrice") {
        variant.sellingPrice = Number(bulkEditValue);
      } else if (bulkEditField === "mrp") {
        variant.mrp = Number(bulkEditValue);
      } else if (bulkEditField === "purchasePrice") {
        variant.purchasePrice = Number(bulkEditValue);
      } else if (bulkEditField === "gst") {
        variant.gst = Number(bulkEditValue);
      } else if (bulkEditField === "inventoryQuantity") {
        variant.inventoryQuantity = Number(bulkEditValue);
      }
    });
    
    setMatrixVariants(updatedVariants);
    
    // Also update the parent component
    const convertedVariants = updatedVariants.map(variant => ({
      ...variant,
      color: variant.attributes["Color"] || "",
      size: variant.attributes["Size"] || "",
      imageUrl: variant.images[0] || null
    }));
    
    onChange(convertedVariants);
    
    // Close bulk edit mode
    setIsBulkEditMode(false);
    setBulkEditField("");
    setBulkEditValue("");
    
    toast({
      title: "Bulk update applied",
      description: `Updated ${updatedVariants.length} variants`
    });
  };

  // Function to open the image dialog for a variant
  const openImageDialog = (index: number) => {
    setCurrentVariantIndex(index);
    setCurrentImages(matrixVariants[index].images || []);
    setIsImageDialogOpen(true);
  };

  // Function to add a new image URL
  const addImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: "Empty URL",
        description: "Please enter an image URL to add",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentImages([...currentImages, newImageUrl]);
    setNewImageUrl("");
  };

  // Function to remove an image
  const removeImage = (index: number) => {
    const updatedImages = [...currentImages];
    updatedImages.splice(index, 1);
    setCurrentImages(updatedImages);
  };

  // Function to save the current images to the variant
  const saveVariantImages = () => {
    if (currentVariantIndex === null) return;
    
    const updatedVariants = [...matrixVariants];
    updatedVariants[currentVariantIndex].images = currentImages;
    // Also update the imageUrl field for backward compatibility
    updatedVariants[currentVariantIndex].imageUrl = currentImages[0] || null;
    
    setMatrixVariants(updatedVariants);
    
    // Also update the parent component
    const convertedVariants = updatedVariants.map(variant => ({
      ...variant,
      color: variant.attributes["Color"] || "",
      size: variant.attributes["Size"] || "",
      imageUrl: variant.images[0] || null
    }));
    
    onChange(convertedVariants);
    
    // Close the dialog
    setIsImageDialogOpen(false);
    setCurrentVariantIndex(null);
    
    toast({
      title: "Images updated",
      description: "Variant images have been updated successfully"
    });
  };

  // Function to handle S3 image upload success
  const handleImageUploadSuccess = (fileData: { url: string }) => {
    setCurrentImages([...currentImages, fileData.url]);
    
    toast({
      title: "Image uploaded",
      description: "Image has been uploaded successfully"
    });
  };

  // Function to handle S3 multiple images upload success
  const handleMultipleImagesUploadSuccess = (data: { files: { url: string }[] }) => {
    const newUrls = data.files.map(file => file.url);
    setCurrentImages([...currentImages, ...newUrls]);
    
    toast({
      title: "Images uploaded",
      description: `${newUrls.length} images have been uploaded successfully`
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium">Existing Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            The following variants have been saved for this product
          </p>
        </div>
        
        {matrixVariants.length > 0 && (
          <Button 
            onClick={deleteAllVariants}
            variant="destructive"
            size="sm"
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Variants
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium">Product Variants Matrix</h3>
          <p className="text-sm text-muted-foreground">
            Generate product variants by defining attributes like colors and sizes
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsAttributesDialogOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Edit className="h-4 w-4" />
            Edit Attributes
          </Button>
          
          <Button 
            onClick={generateVariantCombinations}
            variant="default"
            size="sm"
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Generate Variants
          </Button>
          
          {matrixVariants.length > 0 && (
            <Button 
              onClick={() => setIsBulkEditMode(!isBulkEditMode)}
              variant={isBulkEditMode ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
            >
              {isBulkEditMode ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel Bulk Edit
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Bulk Edit
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Current attributes display */}
      <div className="flex flex-wrap gap-6 mb-4">
        {attributes.map((attr, attrIndex) => (
          <div key={attrIndex} className="flex flex-col">
            <span className="text-sm font-medium mb-1">{attr.name}</span>
            <div className="flex flex-wrap gap-2">
              {attr.values.length === 0 ? (
                <span className="text-sm text-muted-foreground">No values defined</span>
              ) : (
                attr.values.map(val => (
                  <Badge key={val.id} variant="outline" className="text-xs">
                    {val.value}
                  </Badge>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Bulk Update Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Bulk Update</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="bulk-price" className="mb-2 block">Set All Prices</Label>
              <div className="flex gap-2">
                <Input 
                  id="bulk-price"
                  type="number"
                  min="0"
                  placeholder="Price"
                  value={bulkEditField === "sellingPrice" ? bulkEditValue : ""}
                  onChange={(e) => {
                    setBulkEditField("sellingPrice");
                    setBulkEditValue(e.target.value);
                  }}
                />
                <Button 
                  onClick={() => {
                    if (bulkEditField === "sellingPrice" && bulkEditValue) {
                      applyBulkEdit();
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bulk-mrp" className="mb-2 block">Set All MRP</Label>
              <div className="flex gap-2">
                <Input 
                  id="bulk-mrp"
                  type="number"
                  min="0"
                  placeholder="MRP"
                  value={bulkEditField === "mrp" ? bulkEditValue : ""}
                  onChange={(e) => {
                    setBulkEditField("mrp");
                    setBulkEditValue(e.target.value);
                  }}
                />
                <Button 
                  onClick={() => {
                    if (bulkEditField === "mrp" && bulkEditValue) {
                      applyBulkEdit();
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bulk-stock" className="mb-2 block">Set All Stock</Label>
              <div className="flex gap-2">
                <Input 
                  id="bulk-stock"
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={bulkEditField === "inventoryQuantity" ? bulkEditValue : ""}
                  onChange={(e) => {
                    setBulkEditField("inventoryQuantity");
                    setBulkEditValue(e.target.value);
                  }}
                />
                <Button 
                  onClick={() => {
                    if (bulkEditField === "inventoryQuantity" && bulkEditValue) {
                      applyBulkEdit();
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Variants Table */}
      {matrixVariants.length > 0 ? (
        <div className="border rounded-md overflow-x-auto max-h-[70vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center">Use</TableHead>
                {attributes.map((attr, index) => (
                  <TableHead key={index}>{attr.name}</TableHead>
                ))}
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Images</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixVariants.map((variant, index) => (
                <TableRow key={variant.id}>
                  {/* Checkbox */}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={true}
                      // In a real implementation, you would track which variants are enabled
                      // onChange={(checked) => toggleVariantUsage(index, checked)}
                    />
                  </TableCell>
                  
                  {/* Attributes */}
                  {attributes.map((attr, attrIndex) => (
                    <TableCell key={attrIndex}>
                      {variant.attributes[attr.name] || ""}
                    </TableCell>
                  ))}
                  
                  {/* SKU */}
                  <TableCell>
                    <Input
                      value={variant.sku || ""}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  
                  {/* Selling Price */}
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.sellingPrice || ""}
                      onChange={(e) => updateVariant(index, "sellingPrice", Number(e.target.value))}
                      className="w-full"
                    />
                  </TableCell>
                  
                  {/* MRP */}
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.mrp || ""}
                      onChange={(e) => updateVariant(index, "mrp", Number(e.target.value))}
                      className="w-full"
                    />
                  </TableCell>
                  
                  {/* Stock Units */}
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.inventoryQuantity || "0"}
                      onChange={(e) => updateVariant(index, "inventoryQuantity", Number(e.target.value))}
                      className="w-full"
                    />
                  </TableCell>
                  
                  {/* Images */}
                  <TableCell>
                    {variant.images && variant.images.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center gap-1">
                          <div 
                            className="w-8 h-8 rounded overflow-hidden cursor-pointer"
                            onClick={() => openImageDialog(index)}
                          >
                            <img 
                              src={variant.images[0]} 
                              alt={`Product Variant`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {variant.images.length > 1 && (
                            <Badge className="text-xs">
                              {variant.images.length} images
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openImageDialog(index)}
                            className="h-8 w-8"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openImageDialog(index)}
                          className="h-8"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Add Images
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            No variants generated yet. Define your attributes and click "Generate Variants".
          </p>
        </div>
      )}
      
      {/* Attributes Editor Dialog */}
      <Dialog open={isAttributesDialogOpen} onOpenChange={setIsAttributesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Variant Attributes</DialogTitle>
            <DialogDescription>
              Define the attributes (like Color, Size) and their possible values to generate variant combinations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="w-full">
                {attributes.map((attr, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="flex-1"
                    onClick={() => setCurrentAttributeIndex(index)}
                  >
                    {attr.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {attributes.map((attr, attrIndex) => (
                <TabsContent key={attrIndex} value={attrIndex.toString()} className="mt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newAttributeValue}
                        onChange={(e) => setNewAttributeValue(e.target.value)}
                        placeholder={`Add new ${attr.name.toLowerCase()}...`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission
                            addAttributeValue();
                          }
                        }}
                      />
                      <Button 
                        onClick={addAttributeValue} 
                        type="button"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">{attr.name} Values</h4>
                      {attr.values.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No values added yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {attr.values.map((value, valueIndex) => (
                            <Badge 
                              key={value.id} 
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-1"
                            >
                              {value.value}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsAttributesDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Management Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // If dialog is closing without saving, reset the current images
          if (currentVariantIndex !== null) {
            setCurrentImages(matrixVariants[currentVariantIndex].images || []);
          }
        }
        setIsImageDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Variant Images</DialogTitle>
            <DialogDescription>
              Add multiple images for this variant. The first image will be used as the primary image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">Upload Images</TabsTrigger>
                <TabsTrigger value="url" className="flex-1">Add by URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <S3FileUpload
                  onSuccess={handleImageUploadSuccess}
                  endpoint="upload/product-image"
                  accept="image/*"
                  buttonText="Upload Image"
                  maxSizeMB={10}
                />
                
                <div className="mt-4">
                  <Label>Multiple Image Upload</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload multiple images at once (up to 10 images, 10MB each)
                  </p>
                  
                  <S3FileUpload
                    onSuccess={handleMultipleImagesUploadSuccess}
                    endpoint="upload/multiple"
                    accept="image/*"
                    buttonText="Upload Multiple Images"
                    maxSizeMB={10}
                    multiple={true}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-4">
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <Button onClick={addImageUrl} type="button">
                    Add
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-4" />
            
            <div>
              <Label className="mb-2 block">Current Images</Label>
              <ScrollArea className="h-60 border rounded-md p-2">
                {currentImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No images added yet. Upload an image or add an image URL.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {currentImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imageUrl} 
                          alt={`Variant Image ${index + 1}`}
                          className="w-full h-32 object-contain border rounded-md"
                        />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {index === 0 && (
                          <Badge className="absolute top-1 left-1 text-[10px]">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVariantImages}>
              Save Images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatrixVariantManager;