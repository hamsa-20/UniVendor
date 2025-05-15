import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Attribute = {
  name: string;
  values: string[];
  isColor?: boolean;
};

interface VariantAttributesManagerProps {
  attributes: Attribute[];
  onChange: (attributes: Attribute[]) => void;
  onGenerateVariants: () => void;
}

const VariantAttributesManager = ({
  attributes,
  onChange,
  onGenerateVariants
}: VariantAttributesManagerProps) => {
  const [newValue, setNewValue] = useState("");
  const [newCustomAttr, setNewCustomAttr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with default attributes if none provided
  useEffect(() => {
    if (attributes.length === 0) {
      onChange([
        { name: "Color", values: [], isColor: true },
        { name: "Size", values: [] }
      ]);
    }
  }, [attributes, onChange]);

  const colorAttr = attributes.find(attr => attr.name === "Color") || { values: [] };
  const sizeAttr = attributes.find(attr => attr.name === "Size") || { values: [] };

  // Helper to get other custom attributes
  const customAttributes = attributes.filter(attr => 
    attr.name !== "Color" && attr.name !== "Size"
  );

  // Add a value to an attribute
  const addAttributeValue = (attributeName: string, value: string) => {
    if (!value.trim()) {
      setErrors({ ...errors, [attributeName]: "Value cannot be empty" });
      return;
    }

    // Find the attribute in the current attributes
    const attrIndex = attributes.findIndex(attr => attr.name === attributeName);
    if (attrIndex === -1) return;

    // Check for duplicates (case-insensitive)
    const trimmedValue = value.trim();
    if (attributes[attrIndex].values.some(v => 
      v.toLowerCase() === trimmedValue.toLowerCase()
    )) {
      setErrors({ ...errors, [attributeName]: "Value already exists" });
      return;
    }

    // Update the attribute values
    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].values.push(trimmedValue);
    onChange(updatedAttributes);
    setNewValue("");
    setErrors({ ...errors, [attributeName]: "" });
  };

  // Remove a value from an attribute
  const removeAttributeValue = (attributeName: string, valueIndex: number) => {
    const attrIndex = attributes.findIndex(attr => attr.name === attributeName);
    if (attrIndex === -1) return;

    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].values.splice(valueIndex, 1);
    onChange(updatedAttributes);
  };

  // Add a new custom attribute
  const addCustomAttribute = (name: string) => {
    if (!name.trim()) {
      setErrors({ ...errors, customAttr: "Attribute name cannot be empty" });
      return;
    }

    // Check if attribute already exists
    if (attributes.some(attr => 
      attr.name.toLowerCase() === name.trim().toLowerCase()
    )) {
      setErrors({ ...errors, customAttr: "Attribute already exists" });
      return;
    }

    onChange([...attributes, { name: name.trim(), values: [] }]);
    setNewCustomAttr("");
    setErrors({ ...errors, customAttr: "" });
  };

  // Remove a custom attribute
  const removeCustomAttribute = (attributeName: string) => {
    onChange(attributes.filter(attr => attr.name !== attributeName));
  };

  // Helpers for rendering color swatches
  const isColorValue = (value: string) => {
    // Check if it's a valid hex color
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(value);
  };

  // Determine if we have enough values to generate variants
  const canGenerateVariants = 
    colorAttr.values.length > 0 && 
    sizeAttr.values.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Define Variant Attributes</h3>
        <p className="text-sm text-muted-foreground">
          Add possible values for each attribute to generate all variant combinations.
        </p>
      </div>
      
      {/* Color Attribute Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Colors</Label>
          <Badge variant="outline">{colorAttr.values.length} colors</Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap mb-2">
          {colorAttr.values.map((value, index) => (
            <div 
              key={`color-${index}`} 
              className="flex items-center border rounded-md pl-2 pr-1 py-1 group hover:bg-muted/50"
            >
              {isColorValue(value) ? (
                <div 
                  className="w-4 h-4 rounded-full mr-1.5" 
                  style={{ backgroundColor: value }}
                />
              ) : null}
              <span className="text-sm">{value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                onClick={() => removeAttributeValue("Color", index)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter a color (e.g., 'Red' or '#FF0000')"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAttributeValue("Color", newValue);
                }
              }}
              className={cn(
                errors.Color && "border-destructive"
              )}
            />
            {errors.Color && (
              <p className="text-sm text-destructive mt-1">{errors.Color}</p>
            )}
          </div>
          <Button 
            type="button" 
            onClick={() => addAttributeValue("Color", newValue)}
          >
            Add
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Size Attribute Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Sizes</Label>
          <Badge variant="outline">{sizeAttr.values.length} sizes</Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap mb-2">
          {sizeAttr.values.map((value, index) => (
            <div 
              key={`size-${index}`} 
              className="flex items-center border rounded-md pl-2 pr-1 py-1 group hover:bg-muted/50"
            >
              <span className="text-sm">{value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                onClick={() => removeAttributeValue("Size", index)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter a size (e.g., 'S', 'M', 'L', 'XL')"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAttributeValue("Size", newValue);
                }
              }}
              className={cn(
                errors.Size && "border-destructive"
              )}
            />
            {errors.Size && (
              <p className="text-sm text-destructive mt-1">{errors.Size}</p>
            )}
          </div>
          <Button 
            type="button" 
            onClick={() => addAttributeValue("Size", newValue)}
          >
            Add
          </Button>
        </div>
      </div>
      
      {/* Custom Attributes Section */}
      {customAttributes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-base font-medium">Custom Attributes</h4>
            
            {customAttributes.map((attr, attrIndex) => (
              <div key={`custom-attr-${attrIndex}`} className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{attr.name}</Label>
                    <Badge variant="outline">{attr.values.length} values</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomAttribute(attr.name)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-2">
                  {attr.values.map((value, valueIndex) => (
                    <div 
                      key={`${attr.name}-${valueIndex}`} 
                      className="flex items-center border rounded-md pl-2 pr-1 py-1 group hover:bg-muted/50"
                    >
                      <span className="text-sm">{value}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                        onClick={() => removeAttributeValue(attr.name, valueIndex)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Enter a ${attr.name.toLowerCase()} value`}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAttributeValue(attr.name, newValue);
                        }
                      }}
                      className={cn(
                        errors[attr.name] && "border-destructive"
                      )}
                    />
                    {errors[attr.name] && (
                      <p className="text-sm text-destructive mt-1">{errors[attr.name]}</p>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => addAttributeValue(attr.name, newValue)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Add Custom Attribute Section */}
      <div>
        <Separator className="my-4" />
        <div className="mb-2">
          <Label className="text-base font-medium">Add Custom Attribute</Label>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter a custom attribute name"
              value={newCustomAttr}
              onChange={(e) => setNewCustomAttr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomAttribute(newCustomAttr);
                }
              }}
              className={cn(
                errors.customAttr && "border-destructive"
              )}
            />
            {errors.customAttr && (
              <p className="text-sm text-destructive mt-1">{errors.customAttr}</p>
            )}
          </div>
          <Button 
            type="button"
            variant="outline"
            onClick={() => addCustomAttribute(newCustomAttr)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Generate Variants Button */}
      <Separator className="my-6" />
      <div className="flex justify-between items-center">
        <div>
          {!canGenerateVariants && (
            <div className="flex items-center text-sm text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              Add at least one color and size to generate variants
            </div>
          )}
        </div>
        <Button
          onClick={onGenerateVariants}
          disabled={!canGenerateVariants}
          size="lg"
        >
          Generate Variants
        </Button>
      </div>
    </div>
  );
};

export default VariantAttributesManager;