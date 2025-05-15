import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Predefined color options with hex values
const PREDEFINED_COLORS = [
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#008000" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Gray", value: "#808080" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Brown", value: "#A52A2A" },
];

// Predefined size options
const PREDEFINED_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL", 
  "2", "4", "6", "8", "10", "12", "14", "16"
];

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
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [selectedAttributeIndex, setSelectedAttributeIndex] = useState<number | null>(null);
  const [customValueInput, setCustomValueInput] = useState("");

  // Initialize with default attributes if none provided
  useEffect(() => {
    if (attributes.length === 0) {
      onChange([
        { name: "Color", values: [], isColor: true },
        { name: "Size", values: [] }
      ]);
    }
  }, []);

  const addAttribute = () => {
    if (!newAttributeName.trim()) return;
    
    // Check if attribute already exists
    if (attributes.some(attr => attr.name.toLowerCase() === newAttributeName.toLowerCase())) {
      return;
    }
    
    const isColor = newAttributeName.toLowerCase() === "color";
    onChange([...attributes, { name: newAttributeName, values: [], isColor }]);
    setNewAttributeName("");
  };

  const removeAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    onChange(newAttributes);
    
    if (selectedAttributeIndex === index) {
      setSelectedAttributeIndex(null);
    }
  };

  const addValueToAttribute = (attrIndex: number, value: string) => {
    if (!value.trim()) return;
    
    const newAttributes = [...attributes];
    if (!newAttributes[attrIndex].values.includes(value)) {
      newAttributes[attrIndex].values.push(value);
      onChange(newAttributes);
    }
  };

  const removeValueFromAttribute = (attrIndex: number, valueIndex: number) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].values.splice(valueIndex, 1);
    onChange(newAttributes);
  };

  const handleAddPredefinedValue = (value: string) => {
    if (selectedAttributeIndex !== null) {
      addValueToAttribute(selectedAttributeIndex, value);
      setCustomValueInput("");
    }
  };

  const handleAddCustomValue = () => {
    if (selectedAttributeIndex !== null && customValueInput.trim()) {
      addValueToAttribute(selectedAttributeIndex, customValueInput);
      setCustomValueInput("");
    }
  };

  const toggleColorAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes[index].isColor = !newAttributes[index].isColor;
    onChange(newAttributes);
  };

  const hasDefinedAttributes = attributes.length > 0 && 
    attributes.some(attr => attr.values.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Variant Attributes</h3>
          <div className="flex-1" />
          {hasDefinedAttributes && (
            <Button onClick={onGenerateVariants}>
              Generate Variants
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column: Attribute list */}
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
              <CardDescription>
                Define the attributes for your product variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{attr.name}</span>
                      <Badge variant="outline">{attr.values.length} values</Badge>
                      {attr.isColor && <Badge variant="secondary">Color</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {attr.name.toLowerCase() === "color" && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`color-switch-${index}`} className="text-xs">
                            Use color picker
                          </Label>
                          <Switch 
                            id={`color-switch-${index}`}
                            checked={!!attr.isColor}
                            onCheckedChange={() => toggleColorAttribute(index)}
                          />
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedAttributeIndex(index)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAttribute(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="New attribute name"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                />
                <Button onClick={addAttribute} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right column: Values for selected attribute */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedAttributeIndex !== null 
                  ? `${attributes[selectedAttributeIndex].name} Values` 
                  : "Attribute Values"}
              </CardTitle>
              <CardDescription>
                {selectedAttributeIndex !== null 
                  ? `Add values for the ${attributes[selectedAttributeIndex].name} attribute` 
                  : "Select an attribute to add values"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAttributeIndex === null ? (
                <div className="flex items-center justify-center h-32 border rounded-md border-dashed">
                  <p className="text-muted-foreground">Select an attribute from the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display current values */}
                  <div className="flex flex-wrap gap-2">
                    {attributes[selectedAttributeIndex].values.map((value, valueIndex) => (
                      <Badge key={valueIndex} variant="secondary" className="flex items-center gap-1">
                        {attributes[selectedAttributeIndex].isColor && (
                          <div 
                            className="w-3 h-3 rounded-full inline-block mr-1" 
                            style={{ 
                              backgroundColor: value.startsWith('#') ? value : undefined,
                              border: "1px solid rgba(0,0,0,0.1)"
                            }} 
                          />
                        )}
                        {value}
                        <button 
                          onClick={() => removeValueFromAttribute(selectedAttributeIndex, valueIndex)}
                          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add value input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add ${attributes[selectedAttributeIndex].name.toLowerCase()} value`}
                      value={customValueInput}
                      onChange={(e) => setCustomValueInput(e.target.value)}
                    />
                    <Button onClick={handleAddCustomValue} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>

                  {/* Predefined values */}
                  {attributes[selectedAttributeIndex].name.toLowerCase() === "color" ? (
                    <div className="mt-4">
                      <Label className="mb-2 block">Predefined Colors</Label>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => handleAddPredefinedValue(
                              attributes[selectedAttributeIndex].isColor ? color.value : color.name
                            )}
                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:ring-2 ring-primary transition-all"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {attributes[selectedAttributeIndex].values.includes(
                              attributes[selectedAttributeIndex].isColor ? color.value : color.name
                            ) && (
                              <CheckCircle2 className="h-4 w-4 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : attributes[selectedAttributeIndex].name.toLowerCase() === "size" && (
                    <div className="mt-4">
                      <Label className="mb-2 block">Common Sizes</Label>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_SIZES.map((size) => (
                          <Button 
                            key={size} 
                            variant="outline" 
                            size="sm"
                            className={
                              attributes[selectedAttributeIndex].values.includes(size) 
                                ? "bg-primary text-primary-foreground" 
                                : ""
                            }
                            onClick={() => handleAddPredefinedValue(size)}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VariantAttributesManager;