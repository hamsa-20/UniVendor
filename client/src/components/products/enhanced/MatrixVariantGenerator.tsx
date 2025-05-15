import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Common color options for product variants
const COMMON_COLORS = [
  { name: "Red", value: "#e53935" },
  { name: "Blue", value: "#1e88e5" },
  { name: "Green", value: "#43a047" },
  { name: "Yellow", value: "#fdd835" },
  { name: "Black", value: "#212121" },
  { name: "White", value: "#f5f5f5" },
  { name: "Gray", value: "#9e9e9e" },
  { name: "Navy", value: "#0d47a1" },
  { name: "Purple", value: "#8e24aa" },
  { name: "Pink", value: "#d81b60" },
  { name: "Orange", value: "#fb8c00" },
  { name: "Brown", value: "#6d4c41" },
];

// Common size options for product variants
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export type AttributeItem = {
  name: string;
  values: string[];
  isColor?: boolean;
};

interface MatrixVariantGeneratorProps {
  colorValues: string[];
  sizeValues: string[];
  onColorValuesChange: (values: string[]) => void;
  onSizeValuesChange: (values: string[]) => void;
  onGenerateVariants: () => void;
}

export default function MatrixVariantGenerator({
  colorValues,
  sizeValues,
  onColorValuesChange,
  onSizeValuesChange,
  onGenerateVariants,
}: MatrixVariantGeneratorProps) {
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [activeTab, setActiveTab] = useState<"colors" | "sizes">("colors");

  // Count the total number of potential variants
  const variantCount = useMemo(() => {
    return colorValues.length * sizeValues.length;
  }, [colorValues, sizeValues]);

  // Add a new color to the list
  const addColor = () => {
    if (newColor && !colorValues.includes(newColor)) {
      onColorValuesChange([...colorValues, newColor]);
      setNewColor("");
    }
  };

  // Add a new size to the list
  const addSize = () => {
    if (newSize && !sizeValues.includes(newSize)) {
      onSizeValuesChange([...sizeValues, newSize]);
      setNewSize("");
    }
  };

  // Remove a color from the list
  const removeColor = (color: string) => {
    onColorValuesChange(colorValues.filter(c => c !== color));
  };

  // Remove a size from the list
  const removeSize = (size: string) => {
    onSizeValuesChange(sizeValues.filter(s => s !== size));
  };

  // Add a common color
  const addCommonColor = (color: string) => {
    if (!colorValues.includes(color)) {
      onColorValuesChange([...colorValues, color]);
    }
  };

  // Add a common size
  const addCommonSize = (size: string) => {
    if (!sizeValues.includes(size)) {
      onSizeValuesChange([...sizeValues, size]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Create Variant Matrix</CardTitle>
          <CardDescription>
            Add colors and sizes to generate all possible combinations as variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "colors" | "sizes")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="sizes">Sizes</TabsTrigger>
            </TabsList>
            
            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a color (e.g., Red, Blue, Green)"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addColor()}
                />
                <Button type="button" onClick={addColor} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Common colors */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Quick add common colors</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_COLORS.map((color) => (
                    <TooltipProvider key={color.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => addCommonColor(color.name)}
                            className={`w-8 h-8 rounded-full border ${
                              colorValues.includes(color.name) ? 'border-primary' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {colorValues.includes(color.name) && (
                              <span className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]" />
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{color.name}{colorValues.includes(color.name) ? ' (Added)' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
              
              {/* Selected colors */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Selected colors ({colorValues.length})</p>
                <div className="flex flex-wrap gap-2">
                  {colorValues.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No colors selected</p>
                  ) : (
                    colorValues.map((color) => {
                      const colorInfo = COMMON_COLORS.find(c => c.name === color);
                      return (
                        <Badge 
                          key={color} 
                          variant="outline" 
                          className="flex items-center gap-1"
                          style={{ 
                            backgroundColor: colorInfo ? colorInfo.value + '20' : undefined,
                            borderColor: colorInfo ? colorInfo.value : undefined
                          }}
                        >
                          {colorInfo && (
                            <span 
                              className="inline-block w-3 h-3 rounded-full mr-1" 
                              style={{ backgroundColor: colorInfo.value }}
                            />
                          )}
                          {color}
                          <button 
                            onClick={() => removeColor(color)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Sizes Tab */}
            <TabsContent value="sizes" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a size (e.g., S, M, L, XL)"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSize()}
                />
                <Button type="button" onClick={addSize} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Common sizes */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Quick add common sizes</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SIZES.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={sizeValues.includes(size) ? "default" : "outline"}
                      size="sm"
                      onClick={() => addCommonSize(size)}
                    >
                      {size}
                      {sizeValues.includes(size) ? (
                        <Check className="ml-1 h-3 w-3" />
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Selected sizes */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Selected sizes ({sizeValues.length})</p>
                <div className="flex flex-wrap gap-2">
                  {sizeValues.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No sizes selected</p>
                  ) : (
                    sizeValues.map((size) => (
                      <Badge key={size} variant="outline" className="flex items-center gap-1">
                        {size}
                        <button 
                          onClick={() => removeSize(size)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Matrix Preview */}
      {colorValues.length > 0 && sizeValues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Variant Matrix Preview</CardTitle>
            <CardDescription>
              {variantCount} variants will be created ({colorValues.length} colors × {sizeValues.length} sizes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Color / Size</th>
                    {sizeValues.map((size) => (
                      <th key={size} className="px-4 py-2 text-center font-medium">{size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colorValues.map((color, colorIndex) => {
                    const colorInfo = COMMON_COLORS.find(c => c.name === color);
                    return (
                      <tr key={color} className={colorIndex % 2 === 0 ? "" : "bg-muted/20"}>
                        <td className="px-4 py-2 flex items-center gap-2">
                          {colorInfo && (
                            <span 
                              className="inline-block w-3 h-3 rounded-full" 
                              style={{ backgroundColor: colorInfo.value }}
                            />
                          )}
                          {color}
                        </td>
                        {sizeValues.map((size) => (
                          <td key={`${color}-${size}`} className="px-4 py-2 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs text-primary">
                              ✓
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4">
              <Button 
                type="button" 
                onClick={onGenerateVariants} 
                className="w-full"
                disabled={colorValues.length === 0 || sizeValues.length === 0}
              >
                Generate {variantCount} Variants
              </Button>
              {(colorValues.length === 0 || sizeValues.length === 0) && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  You need at least one color and one size to generate variants
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}