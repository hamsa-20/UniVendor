import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, AlertCircle, ImagePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import VariantAttributesManager, { Attribute } from "./VariantAttributesManager";
import MatrixVariantGenerator from "./MatrixVariantGenerator";

interface MatrixVariant {
  id: string | number;
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
  updatedAt?: Date | null;
}

interface ProductProps {
  id: number;
  name: string;
  [key: string]: any;
}

interface InitialAttributes {
  colors?: string[];
  sizes?: string[];
}

interface EnhancedVariantManagerProps {
  product: ProductProps;
  initialVariant?: MatrixVariant | null;
  initialAttributes?: InitialAttributes;
  onClose: () => void;
}

const EnhancedVariantManager = ({
  product,
  initialVariant = null,
  initialAttributes,
  onClose
}: EnhancedVariantManagerProps) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [activeTab, setActiveTab] = useState("attributes");
  const [variants, setVariants] = useState<MatrixVariant[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    sellingPrice?: string;
    mrp?: string;
    inventoryQuantity?: number;
  }>({});
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize with initialVariant if provided (editing mode) or initialAttributes if provided
  useEffect(() => {
    if (initialVariant) {
      setIsEditMode(true);
      setActiveTab("details");
      
      // Create attributes from the initial variant
      const attributesFromVariant: Attribute[] = [];
      
      // Add color with isColor=true flag
      attributesFromVariant.push({ 
        name: "Color", 
        values: [initialVariant.color],
        isColor: true
      });
      
      // Add size
      attributesFromVariant.push({ 
        name: "Size", 
        values: [initialVariant.size] 
      });
      
      // Add other attributes from the variant.attributes object
      Object.entries(initialVariant.attributes || {}).forEach(([key, value]) => {
        if (key !== "Color" && key !== "Size") {
          attributesFromVariant.push({ name: key, values: [value] });
        }
      });
      
      setAttributes(attributesFromVariant);
      setVariants([initialVariant]);
    } else if (initialAttributes) {
      // If we have preselected colors/sizes from the product form
      const attributesFromSelection: Attribute[] = [];
      
      // Add colors if provided
      if (initialAttributes.colors && initialAttributes.colors.length > 0) {
        attributesFromSelection.push({
          name: "Color",
          values: initialAttributes.colors,
          isColor: true
        });
      }
      
      // Add sizes if provided
      if (initialAttributes.sizes && initialAttributes.sizes.length > 0) {
        attributesFromSelection.push({
          name: "Size",
          values: initialAttributes.sizes
        });
      }
      
      if (attributesFromSelection.length > 0) {
        setAttributes(attributesFromSelection);
        
        // Auto-switch to the matrix tab if both attributes are set
        if (initialAttributes.colors?.length && initialAttributes.sizes?.length) {
          setActiveTab("matrix");
        }
      }
    }
  }, [initialVariant, initialAttributes]);

  // Save mutation
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
        description: error instanceof Error ? error.message : "Failed to save variants",
        variant: "destructive",
      });
    },
  });

  // Generate variant combinations from attributes
  const generateVariants = () => {
    // Validate attributes
    const hasColor = attributes.some(attr => attr.name === "Color" && attr.values.length > 0);
    const hasSize = attributes.some(attr => attr.name === "Size" && attr.values.length > 0);
    
    if (!hasColor || !hasSize) {
      setErrors({ generate: "Both Color and Size attributes must have at least one value" });
      return;
    }
    
    setErrors({});
    
    // Get all attribute combinations
    const colorAttr = attributes.find(a => a.name === "Color")!;
    const sizeAttr = attributes.find(a => a.name === "Size")!;
    
    // Create the product variants matrix
    const generatedVariants: MatrixVariant[] = [];
    
    // Create a base SKU from product information
    const baseSkuParts = [];
    if (product.sku) {
      baseSkuParts.push(product.sku);
    } else if (product.name) {
      // Create an abbreviation from product name (first letter of each word, max 3 chars)
      const nameAbbrev = product.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      baseSkuParts.push(nameAbbrev);
    } else {
      baseSkuParts.push("PROD");
    }
    
    const baseSku = baseSkuParts.join('-');
    
    // Use product's selling price as default if available
    const defaultSellingPrice = product.sellingPrice || "0";
    const defaultGst = product.gst || "18";
    
    let isFirstVariant = true;
    
    for (const color of colorAttr.values) {
      for (const size of sizeAttr.values) {
        // Create color and size codes for SKU generation
        const colorCode = color.substring(0, 3).toUpperCase();
        const sizeCode = size.toUpperCase();
        
        // Generate SKU in format: BASE-COLOR-SIZE (e.g., TSH-RED-XL)
        const sku = `${baseSku}-${colorCode}-${sizeCode}`.replace(/\s+/g, '-');
        
        // Prepare the attributes record
        const variantAttributes: Record<string, string> = { 
          "Color": color,
          "Size": size
        };
        
        // Add any additional attributes 
        // (ignoring Color and Size which we already added)
        attributes.forEach(attr => {
          if (attr.name !== "Color" && attr.name !== "Size" && attr.values.length > 0) {
            // For other attributes, we just use the first value since we don't
            // create matrix combinations for them
            variantAttributes[attr.name] = attr.values[0];
          }
        });
        
        // Create the variant
        generatedVariants.push({
          id: uuidv4(),
          createdAt: null,
          color,
          size,
          purchasePrice: null,
          sellingPrice: defaultSellingPrice,
          mrp: null,
          gst: defaultGst,
          sku: sku,
          barcode: null,
          weight: null,
          inventoryQuantity: 10,
          isDefault: isFirstVariant, // Set first variant as default
          productId: product.id,
          imageUrl: null,
          attributes: variantAttributes,
          images: [],
          position: null,
          updatedAt: null
        });
        
        isFirstVariant = false;
      }
    }
    
    setVariants(generatedVariants);
    setActiveTab("details");
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

  // Toggle variant selection for bulk edit
  const toggleVariantSelection = (variantId: string | number) => {
    const id = variantId.toString();
    if (selectedVariants.includes(id)) {
      setSelectedVariants(selectedVariants.filter(v => v !== id));
    } else {
      setSelectedVariants([...selectedVariants, id]);
    }
  };

  // Apply bulk edit to selected variants
  const applyBulkEdit = () => {
    if (selectedVariants.length === 0) {
      toast({
        title: "No variants selected",
        description: "Please select at least one variant to apply bulk edits",
        variant: "destructive"
      });
      return;
    }
    
    // Update all selected variants with bulk edit data
    const updatedVariants = variants.map(variant => {
      if (selectedVariants.includes(variant.id.toString())) {
        const updated = { ...variant };
        
        if (bulkEditData.sellingPrice !== undefined) {
          updated.sellingPrice = bulkEditData.sellingPrice || "0";
        }
        
        if (bulkEditData.mrp !== undefined) {
          updated.mrp = bulkEditData.mrp || null;
        }
        
        if (bulkEditData.gst !== undefined) {
          updated.gst = bulkEditData.gst || null;
        }
        
        if (bulkEditData.purchasePrice !== undefined) {
          updated.purchasePrice = bulkEditData.purchasePrice || null;
        }
        
        if (bulkEditData.inventoryQuantity !== undefined) {
          updated.inventoryQuantity = bulkEditData.inventoryQuantity || 0;
        }
        
        if (bulkEditData.sku !== undefined) {
          updated.sku = bulkEditData.sku || null;
        }
        
        if (bulkEditData.barcode !== undefined) {
          updated.barcode = bulkEditData.barcode || null;
        }
        
        if (bulkEditData.weight !== undefined) {
          updated.weight = bulkEditData.weight || null;
        }
        
        return updated;
      }
      return variant;
    });
    
    setVariants(updatedVariants);
    setBulkEditMode(false);
    setBulkEditData({});
    setSelectedVariants([]);
    
    toast({
      title: "Bulk edit applied",
      description: `Updated ${selectedVariants.length} variants`
    });
  };

  // Validate before saving
  const validateBeforeSave = () => {
    const newErrors: Record<string, string> = {};
    
    // Check for empty variants
    if (variants.length === 0) {
      newErrors.variants = "No variants to save";
      return false;
    }
    
    // Check for required fields in variants
    let isValid = true;
    
    variants.forEach((variant, index) => {
      // Validate selling price
      if (!variant.sellingPrice || Number(variant.sellingPrice) < 0) {
        newErrors[`variant_${index}_price`] = "Price must be a positive number";
        isValid = false;
      }
      
      // Validate inventory
      if (variant.inventoryQuantity < 0) {
        newErrors[`variant_${index}_inventory`] = "Inventory cannot be negative";
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle save action
  const handleSave = () => {
    if (validateBeforeSave()) {
      saveMutation.mutate();
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Variant" : "Create Product Variants"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update variant details" 
              : "Define options like size and color to create product variants"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="attributes">1. Define Attributes</TabsTrigger>
            <TabsTrigger 
              value="matrix" 
              disabled={!attributes.some(a => a.name === "Color" && a.values.length > 0) || 
                        !attributes.some(a => a.name === "Size" && a.values.length > 0)}
            >
              2. Matrix Preview
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              disabled={variants.length === 0}
            >
              3. Variant Details
            </TabsTrigger>
          </TabsList>
          
          {/* Attributes Tab */}
          <TabsContent value="attributes">
            {/* Use our modern matrix variant generator */}
            <MatrixVariantGenerator
              colorValues={(attributes.find(a => a.name === "Color")?.values || [])}
              sizeValues={(attributes.find(a => a.name === "Size")?.values || [])}
              onColorValuesChange={(values) => {
                const updatedAttributes = [...attributes];
                const colorIndex = updatedAttributes.findIndex(a => a.name === "Color");
                if (colorIndex >= 0) {
                  updatedAttributes[colorIndex].values = values;
                } else {
                  updatedAttributes.push({ name: "Color", values, isColor: true });
                }
                setAttributes(updatedAttributes);
              }}
              onSizeValuesChange={(values) => {
                const updatedAttributes = [...attributes];
                const sizeIndex = updatedAttributes.findIndex(a => a.name === "Size");
                if (sizeIndex >= 0) {
                  updatedAttributes[sizeIndex].values = values;
                } else {
                  updatedAttributes.push({ name: "Size", values });
                }
                setAttributes(updatedAttributes);
              }}
              onGenerateVariants={generateVariants}
            />
            
            {errors.generate && (
              <div className="mt-4 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.generate}
              </div>
            )}
          </TabsContent>
          
          {/* Matrix Preview Tab */}
          <TabsContent value="matrix">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Variant Matrix Preview</h3>
                <Button 
                  onClick={generateVariants}
                  disabled={!attributes.some(a => a.name === "Color" && a.values.length > 0) || 
                           !attributes.some(a => a.name === "Size" && a.values.length > 0)}
                >
                  Generate {attributes.find(a => a.name === "Color")?.values.length || 0} × {attributes.find(a => a.name === "Size")?.values.length || 0} Variants
                </Button>
              </div>
              
              <div className="border rounded-md overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left">Color / Size</th>
                      {attributes.find(a => a.name === "Size")?.values.map(size => (
                        <th key={size} className="px-3 py-2 text-center">{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attributes.find(a => a.name === "Color")?.values.map((color, rowIndex) => (
                      <tr key={color} className={rowIndex % 2 === 0 ? '' : 'bg-muted/20'}>
                        <td className="px-3 py-2 flex items-center gap-1">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: 
                                color === 'Red' ? '#e53935' : 
                                color === 'Blue' ? '#1e88e5' : 
                                color === 'Green' ? '#43a047' :
                                color === 'Black' ? '#212121' :
                                color === 'White' ? '#f5f5f5' :
                                color === 'Yellow' ? '#fdd835' :
                                color === 'Purple' ? '#8e24aa' : 
                                (color.startsWith('#') ? color : '#9e9e9e')
                            }} 
                          />
                          {color}
                        </td>
                        {attributes.find(a => a.name === "Size")?.values.map(size => (
                          <td key={`${color}-${size}`} className="px-3 py-2 text-center">
                            <div className="p-1 rounded border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                              ✓ Will be created
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-col gap-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="default-price">Default Selling Price</Label>
                    <Input
                      id="default-price"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 19.99"
                      value={product.sellingPrice || ""}
                      onChange={(e) => {
                        // This only affects new variants, existing ones won't be changed
                        // Set a global state if needed
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Applied to all new variants</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="default-inventory">Default Inventory</Label>
                    <Input
                      id="default-inventory"
                      type="number"
                      placeholder="e.g. 10"
                      defaultValue="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Initial stock for each variant</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="default-sku">SKU Prefix</Label>
                    <Input
                      id="default-sku"
                      placeholder="e.g. SHIRT-"
                      defaultValue={product.sku || ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Will be combined with variant attributes</p>
                  </div>
                </div>
                
                <div className="rounded-md p-3 bg-blue-50 border border-blue-100 text-blue-800 text-sm">
                  <p>
                    <strong>Note:</strong> After generating variants, you'll be able to:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Edit each variant individually</li>
                    <li>Bulk edit multiple variants at once</li>
                    <li>Upload images for each variant</li>
                    <li>Set default variant for product page</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Variant Details Tab */}
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
                </h3>
                
                <div className="flex items-center gap-2">
                  {variants.length > 1 && !bulkEditMode && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setBulkEditMode(true);
                        setSelectedVariants([]);
                      }}
                    >
                      Bulk Edit
                    </Button>
                  )}
                  
                  {bulkEditMode && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setBulkEditMode(false);
                        setSelectedVariants([]);
                      }}
                    >
                      Cancel Bulk Edit
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Bulk Edit Panel */}
              {bulkEditMode && (
                <div className="p-4 border rounded-md mb-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Bulk Edit {selectedVariants.length} Selected Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="bulk-price">Selling Price</Label>
                      <Input
                        id="bulk-price"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 19.99"
                        value={bulkEditData.sellingPrice || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          sellingPrice: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-mrp">MRP</Label>
                      <Input
                        id="bulk-mrp"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 24.99"
                        value={bulkEditData.mrp || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          mrp: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-purchase-price">Purchase Price</Label>
                      <Input
                        id="bulk-purchase-price"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 12.99"
                        value={bulkEditData.purchasePrice || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          purchasePrice: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-gst">GST %</Label>
                      <Input
                        id="bulk-gst"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 18"
                        value={bulkEditData.gst || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          gst: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-inventory">Inventory</Label>
                      <Input
                        id="bulk-inventory"
                        type="number"
                        placeholder="e.g. 10"
                        value={bulkEditData.inventoryQuantity || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          inventoryQuantity: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-sku">SKU</Label>
                      <Input
                        id="bulk-sku"
                        placeholder="e.g. PRODUCT-001"
                        value={bulkEditData.sku || ""}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          sku: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={applyBulkEdit}>Apply Changes</Button>
                </div>
              )}
              
              {/* Variants Table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {bulkEditMode && (
                        <TableHead style={{ width: 40 }}>
                          <Checkbox 
                            checked={selectedVariants.length === variants.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedVariants(variants.map(v => v.id.toString()));
                              } else {
                                setSelectedVariants([]);
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead>Colors & Size</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead style={{ width: 100 }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={variant.id.toString()}>
                        {bulkEditMode && (
                          <TableCell>
                            <Checkbox 
                              checked={selectedVariants.includes(variant.id.toString())}
                              onCheckedChange={() => toggleVariantSelection(variant.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {variant.attributes.Color && variant.attributes.Color.startsWith('#') ? (
                              <div 
                                className="w-5 h-5 rounded-full border"
                                style={{ backgroundColor: variant.attributes.Color }} 
                              />
                            ) : (
                              <Badge variant="outline">{variant.color}</Badge>
                            )}
                            <Badge>{variant.size}</Badge>
                            {variant.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="w-24"
                            value={variant.sellingPrice || ""}
                            onChange={(e) => updateVariantField(index, "sellingPrice", e.target.value)}
                            aria-invalid={errors[`variant_${index}_price`] ? "true" : undefined}
                          />
                          {errors[`variant_${index}_price`] && (
                            <p className="text-xs text-destructive mt-1">
                              {errors[`variant_${index}_price`]}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="w-24"
                            value={variant.mrp || ""}
                            onChange={(e) => updateVariantField(index, "mrp", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20"
                            value={variant.inventoryQuantity}
                            onChange={(e) => updateVariantField(
                              index, 
                              "inventoryQuantity", 
                              parseInt(e.target.value) || 0
                            )}
                            aria-invalid={errors[`variant_${index}_inventory`] ? "true" : undefined}
                          />
                          {errors[`variant_${index}_inventory`] && (
                            <p className="text-xs text-destructive mt-1">
                              {errors[`variant_${index}_inventory`]}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-32"
                            value={variant.sku || ""}
                            onChange={(e) => updateVariantField(index, "sku", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {variant.images && variant.images.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <img 
                                  src={variant.images[0]} 
                                  alt={`${variant.color} ${variant.size}`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                                {variant.images.length > 1 && (
                                  <Badge variant="outline">+{variant.images.length - 1}</Badge>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <ImagePlus className="h-3.5 w-3.5 mr-1" />
                                Upload
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDefaultVariant(index)}
                              disabled={variant.isDefault}
                              title="Set as default"
                            >
                              <span className="sr-only">Set as default</span>
                              {variant.isDefault ? "★" : "☆"}
                            </Button>
                            
                            {variants.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(index)}
                                title="Remove variant"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={variants.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Variants
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariantManager;