import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  X,
  AlertCircle,
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

// Define types
interface Attribute {
  name: string;
  values: string[];
}

interface MatrixVariant {
  id: number;
  createdAt: Date | null;
  color: string;
  size: string;
  purchasePrice: string | null;
  sellingPrice: string;
  mrp: string | null;
  gst: string | null;
  sku: string | null;
  barcode: string | null;
  weight: string | null; 
  inventoryQuantity: number;
  isDefault: boolean;
  productId: number;
  imageUrl: string | null;
  attributes: Record<string, string>;
  images: string[];
  position: number | null;
}

interface ProductProps {
  id: number;
  name: string;
  [key: string]: any;
}

interface MatrixVariantManagerProps {
  product: ProductProps;
  initialVariant?: MatrixVariant | null;
  onClose: () => void;
}

const MatrixVariantManager = ({ 
  product, 
  initialVariant = null, 
  onClose 
}: MatrixVariantManagerProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([
    { name: "Color", values: [] },
    { name: "Size", values: [] }
  ]);
  const [selectedTab, setSelectedTab] = useState("matrix");
  const [variants, setVariants] = useState<MatrixVariant[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Initialize variants from initialVariant (if provided)
  useEffect(() => {
    if (initialVariant) {
      setIsEditMode(true);
      setSelectedTab("details");
      
      // Set initial attribute structure based on existing variant
      const attrsFromVariant: Attribute[] = [];
      
      // Always include color and size as base attributes
      const colorAttr = { name: "Color", values: [initialVariant.color] };
      const sizeAttr = { name: "Size", values: [initialVariant.size] };
      
      attrsFromVariant.push(colorAttr);
      attrsFromVariant.push(sizeAttr);
      
      // Add any other custom attributes from the variant
      Object.entries(initialVariant.attributes || {}).forEach(([key, value]) => {
        if (key !== "Color" && key !== "Size") {
          attrsFromVariant.push({ name: key, values: [value] });
        }
      });
      
      setAttributes(attrsFromVariant);
      setVariants([initialVariant]);
    }
  }, [initialVariant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode && variants.length === 1) {
        // Update existing variant
        const variant = variants[0];
        await apiRequest("PUT", `/api/products/${product.id}/variants/${variant.id}`, {
          color: variant.color,
          size: variant.size,
          purchasePrice: variant.purchasePrice,
          sellingPrice: variant.sellingPrice,
          mrp: variant.mrp,
          gst: variant.gst,
          sku: variant.sku,
          barcode: variant.barcode,
          weight: variant.weight,
          inventoryQuantity: variant.inventoryQuantity,
          isDefault: variant.isDefault,
          attributes: variant.attributes,
          images: variant.images,
          imageUrl: variant.imageUrl,
        });
      } else {
        // Create new variants
        await Promise.all(
          variants.map(variant => 
            apiRequest("POST", `/api/products/${product.id}/variants`, {
              color: variant.color,
              size: variant.size,
              purchasePrice: variant.purchasePrice,
              sellingPrice: variant.sellingPrice,
              mrp: variant.mrp,
              gst: variant.gst,
              sku: variant.sku,
              barcode: variant.barcode,
              weight: variant.weight,
              inventoryQuantity: variant.inventoryQuantity,
              isDefault: variant.isDefault,
              attributes: variant.attributes,
              images: variant.images,
              imageUrl: variant.imageUrl,
            })
          )
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "variants"] });
      toast({
        title: isEditMode ? "Variant updated" : "Variants created",
        description: isEditMode
          ? "The variant has been updated successfully."
          : "New variants have been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save variants",
        variant: "destructive",
      });
    },
  });

  // Add a new attribute value
  const addAttributeValue = (attrIndex: number) => {
    if (!newAttribute.value) return;
    
    const updatedAttributes = [...attributes];
    const currentValues = updatedAttributes[attrIndex].values;
    
    // Prevent duplicate values
    if (currentValues.includes(newAttribute.value)) {
      setErrors({...errors, attributeValue: "Value already exists"});
      return;
    }
    
    updatedAttributes[attrIndex].values.push(newAttribute.value);
    setAttributes(updatedAttributes);
    setNewAttribute({...newAttribute, value: ''});
    setErrors({...errors, attributeValue: ''});
    
    // If we're in edit mode, we need to update the variant's attribute
    if (isEditMode && variants.length === 1) {
      const variant = variants[0];
      const attrName = updatedAttributes[attrIndex].name;
      const updatedVariant = {
        ...variant,
        attributes: {
          ...variant.attributes,
          [attrName]: newAttribute.value
        }
      };
      
      // Special handling for color and size which are top-level properties
      if (attrName === "Color") {
        updatedVariant.color = newAttribute.value;
      } else if (attrName === "Size") {
        updatedVariant.size = newAttribute.value;
      }
      
      setVariants([updatedVariant]);
    }
  };

  // Remove an attribute value
  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].values.splice(valueIndex, 1);
    setAttributes(updatedAttributes);
  };

  // Add a new custom attribute
  const addAttribute = () => {
    if (!newAttribute.name) return;
    
    // Validate attribute name
    if (attributes.some(attr => attr.name === newAttribute.name)) {
      setErrors({...errors, attributeName: "Attribute already exists"});
      return;
    }
    
    setAttributes([...attributes, { name: newAttribute.name, values: [] }]);
    setNewAttribute({ name: '', value: '' });
    setErrors({...errors, attributeName: ''});
  };

  // Remove a custom attribute
  const removeAttribute = (index: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes.splice(index, 2);
    setAttributes(updatedAttributes);
  };

  // Generate all possible combinations of attribute values
  const generateVariantMatrix = () => {
    // Validate that at least one attribute has values
    const hasValues = attributes.some(attr => attr.values.length > 0);
    if (!hasValues) {
      setErrors({...errors, matrix: "Add at least one attribute value"});
      return;
    }
    
    // Clear errors
    setErrors({...errors, matrix: ''});
    
    // Create all combinations
    const filteredAttributes = attributes.filter(attr => attr.values.length > 0);
    
    const generateCombinations = (attrs: Attribute[], index: number, current: Record<string, string>) => {
      if (index === attrs.length) {
        // Base price for all generated variants
        const defaultPrice = product.price || product.sellingPrice || "0";
        
        return {
          id: uuidv4(),
          productId: product.id,
          color: current["Color"] || "",
          size: current["Size"] || "",
          sku: `${product.sku || product.name.substring(0, 3).toUpperCase()}-${current["Color"] || ""}-${current["Size"] || ""}`.replace(/\s+/g, '-'),
          attributes: { ...current },
          sellingPrice: parseFloat(defaultPrice),
          mrp: parseFloat(defaultPrice),
          purchasePrice: parseFloat(defaultPrice) * 0.7, // Example: 30% margin
          gst: 18, // Default GST percentage
          inventoryQuantity: 10, // Default inventory
          images: [],
          imageUrl: null,
        };
      }
      
      const attr = attrs[index];
      const results = [];
      
      for (const value of attr.values) {
        results.push(
          generateCombinations(
            attrs, 
            index + 1, 
            { ...current, [attr.name]: value }
          )
        );
      }
      
      return results.flat();
    };
    
    const newVariants = generateCombinations(filteredAttributes, 0, {});
    setVariants(newVariants);
    setSelectedTab("details");
  };

  // Update a specific variant field
  const updateVariantField = (index: number, field: string, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    setVariants(updatedVariants);
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  // Set a variant as default
  const setDefaultVariant = (index: number) => {
    const updatedVariants = variants.map((variant, i) => ({
      ...variant,
      isDefault: i === index
    }));
    setVariants(updatedVariants);
  };

  // Validate before saving
  const validateBeforeSave = () => {
    const newErrors: Record<string, string> = {};
    
    // Check for empty variants
    if (variants.length === 0) {
      newErrors.variants = "No variants to save";
    }
    
    // Check for missing required fields in variants
    variants.forEach((variant, index) => {
      if (variant.sellingPrice <= 0) {
        newErrors[`variant_${index}_price`] = "Price must be greater than 0";
      }
      
      if (variant.inventoryQuantity < 0) {
        newErrors[`variant_${index}_inventory`] = "Inventory cannot be negative";
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save action
  const handleSave = () => {
    if (validateBeforeSave()) {
      saveMutation.mutate();
    }
  };

  return (
    <div className="py-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="matrix" disabled={isEditMode}>Define Matrix</TabsTrigger>
          <TabsTrigger 
            value="details" 
            disabled={variants.length === 0 && !isEditMode}
          >
            Variant Details
          </TabsTrigger>
          <TabsTrigger 
            value="images" 
            disabled={variants.length === 0 && !isEditMode}
          >
            Images
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="matrix">
          <div className="space-y-6">
            {attributes.map((attr, attrIndex) => (
              <div key={attrIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{attr.name}</Label>
                  {attrIndex > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttribute(attrIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {attr.values.map((value, valueIndex) => (
                    <Badge key={valueIndex} variant="outline" className="py-1.5">
                      {value}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add ${attr.name.toLowerCase()} value`}
                    value={attrIndex === attributes.findIndex(a => a.name === attr.name) ? newAttribute.value : ''}
                    onChange={(e) => setNewAttribute({...newAttribute, value: e.target.value})}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => addAttributeValue(attrIndex)}
                  >
                    Add
                  </Button>
                </div>
                
                {errors.attributeValue && attrIndex === attributes.findIndex(a => a.name === attr.name) && (
                  <div className="text-sm text-destructive mt-1">
                    {errors.attributeValue}
                  </div>
                )}
              </div>
            ))}
            
            <div className="border-t pt-4 mt-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Add Custom Attribute</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Attribute name (e.g. Material)"
                    value={newAttribute.name}
                    onChange={(e) => setNewAttribute({...newAttribute, name: e.target.value})}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={addAttribute}
                  >
                    Add
                  </Button>
                </div>
                
                {errors.attributeName && (
                  <div className="text-sm text-destructive mt-1">
                    {errors.attributeName}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-6">
              <Button
                onClick={generateVariantMatrix}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Generate Variants
              </Button>
              
              {errors.matrix && (
                <div className="text-sm text-destructive mt-1 text-center">
                  {errors.matrix}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          {variants.length > 0 ? (
            <div className="space-y-6">
              <div className="border rounded-lg">
                <Table>
                  <TableCaption>Configure details for each variant</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div>
                            {variant.color} {variant.size && `/ ${variant.size}`}
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(variant.attributes || {})
                                .filter(([key]) => key !== "Color" && key !== "Size")
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variant.sku || ""}
                            onChange={(e) => updateVariantField(index, "sku", e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.sellingPrice}
                            onChange={(e) => updateVariantField(index, "sellingPrice", parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                          {errors[`variant_${index}_price`] && (
                            <div className="text-xs text-destructive mt-1">
                              {errors[`variant_${index}_price`]}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.mrp || ""}
                            onChange={(e) => updateVariantField(index, "mrp", parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.inventoryQuantity}
                            onChange={(e) => updateVariantField(index, "inventoryQuantity", parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                          {errors[`variant_${index}_inventory`] && (
                            <div className="text-xs text-destructive mt-1">
                              {errors[`variant_${index}_inventory`]}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={variant.isDefault || false}
                            onCheckedChange={() => setDefaultVariant(index)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {!isEditMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {errors.variants && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive border border-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {errors.variants}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 border rounded-lg">
              <p className="text-muted-foreground">
                No variants defined. Go to the Matrix tab to generate variants.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="images">
          {variants.length > 0 ? (
            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">
                    {variant.color} {variant.size && `/ ${variant.size}`}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <div className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/40 transition-colors">
                      <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground/50" />
                      <span className="text-xs text-center">Add Images</span>
                    </div>
                    
                    {variant.images && variant.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="aspect-square relative group">
                        <img 
                          src={image} 
                          alt={`Variant ${index} image ${imageIndex}`} 
                          className="w-full h-full object-cover rounded-md" 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              const updatedVariant = {...variant};
                              updatedVariant.images = updatedVariant.images.filter((_, i) => i !== imageIndex);
                              const updatedVariants = [...variants];
                              updatedVariants[index] = updatedVariant;
                              setVariants(updatedVariants);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border rounded-lg">
              <p className="text-muted-foreground">
                No variants defined. Go to the Matrix tab to generate variants.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-6 gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditMode ? "Update Variant" : "Save Variants"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default MatrixVariantManager;