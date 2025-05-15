import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttributeItem = {
  name: string;
  values: string[];
  isColor?: boolean;
};

// Common colors with their hex values
const commonColors = [
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Navy", hex: "#000080" },
];

// Common clothing sizes
const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

interface MatrixVariantGeneratorProps {
  colorValues: string[];
  sizeValues: string[];
  onColorValuesChange: (values: string[]) => void;
  onSizeValuesChange: (values: string[]) => void;
  onGenerateVariants: () => void;
}

const MatrixVariantGenerator = ({
  colorValues,
  sizeValues,
  onColorValuesChange,
  onSizeValuesChange,
  onGenerateVariants
}: MatrixVariantGeneratorProps) => {
  const [newColorValue, setNewColorValue] = useState("");
  const [newSizeValue, setNewSizeValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total combinations
  const totalCombinations = colorValues.length * sizeValues.length;

  // Add a color value
  const addColorValue = (value: string) => {
    if (!value.trim()) {
      setErrors({ ...errors, color: "Color value cannot be empty" });
      return;
    }

    // Check for duplicates (case-insensitive)
    const trimmedValue = value.trim();
    if (colorValues.some(v => v.toLowerCase() === trimmedValue.toLowerCase())) {
      setErrors({ ...errors, color: "Color already exists" });
      return;
    }

    onColorValuesChange([...colorValues, trimmedValue]);
    setNewColorValue("");
    setErrors({ ...errors, color: "" });
  };

  // Add a size value
  const addSizeValue = (value: string) => {
    if (!value.trim()) {
      setErrors({ ...errors, size: "Size value cannot be empty" });
      return;
    }

    // Check for duplicates (case-insensitive)
    const trimmedValue = value.trim();
    if (sizeValues.some(v => v.toLowerCase() === trimmedValue.toLowerCase())) {
      setErrors({ ...errors, size: "Size already exists" });
      return;
    }

    onSizeValuesChange([...sizeValues, trimmedValue]);
    setNewSizeValue("");
    setErrors({ ...errors, size: "" });
  };

  // Remove a color value
  const removeColorValue = (index: number) => {
    const updatedValues = [...colorValues];
    updatedValues.splice(index, 1);
    onColorValuesChange(updatedValues);
  };

  // Remove a size value
  const removeSizeValue = (index: number) => {
    const updatedValues = [...sizeValues];
    updatedValues.splice(index, 1);
    onSizeValuesChange(updatedValues);
  };

  // Add a common color
  const addCommonColor = (color: { name: string; hex: string }) => {
    // Only add if it doesn't already exist
    if (!colorValues.some(v => v.toLowerCase() === color.name.toLowerCase())) {
      onColorValuesChange([...colorValues, color.name]);
    }
  };

  // Add a common size
  const addCommonSize = (size: string) => {
    // Only add if it doesn't already exist
    if (!sizeValues.some(v => v.toLowerCase() === size.toLowerCase())) {
      onSizeValuesChange([...sizeValues, size]);
    }
  };

  // Helpers for rendering color swatches
  const isColorValue = (value: string) => {
    // Check if it's a valid hex color
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(value);
  };

  // Get color hex value either directly or from common colors
  const getColorHex = (colorName: string) => {
    if (isColorValue(colorName)) return colorName;
    const matchedColor = commonColors.find(c => 
      c.name.toLowerCase() === colorName.toLowerCase()
    );
    return matchedColor ? matchedColor.hex : "#CCCCCC"; // Default gray
  };

  // Determine if we have enough values to generate variants
  const canGenerateVariants = colorValues.length > 0 && sizeValues.length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Colors</Label>
                <Badge variant="outline">{colorValues.length} colors</Badge>
              </div>
              
              {/* Current color values */}
              <div className="flex gap-2 flex-wrap mb-4">
                {colorValues.map((value, index) => (
                  <div 
                    key={`color-${index}`} 
                    className="flex items-center border rounded-md pl-2 pr-1 py-1 group hover:bg-muted/50"
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-1.5" 
                      style={{ backgroundColor: getColorHex(value) }}
                    />
                    <span className="text-sm">{value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                      onClick={() => removeColorValue(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Add color input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter a color (e.g., 'Red' or '#FF0000')"
                    value={newColorValue}
                    onChange={(e) => setNewColorValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addColorValue(newColorValue);
                      }
                    }}
                    className={cn(
                      errors.color && "border-destructive"
                    )}
                  />
                  {errors.color && (
                    <p className="text-sm text-destructive mt-1">{errors.color}</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  onClick={() => addColorValue(newColorValue)}
                >
                  Add
                </Button>
              </div>
              
              {/* Common colors */}
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">Quick Add</Label>
                <div className="flex flex-wrap gap-1.5">
                  {commonColors.map((color) => (
                    <Button
                      key={color.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 flex items-center gap-1"
                      onClick={() => addCommonColor(color)}
                      disabled={colorValues.some(v => v.toLowerCase() === color.name.toLowerCase())}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs">{color.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sizes Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Sizes</Label>
                <Badge variant="outline">{sizeValues.length} sizes</Badge>
              </div>
              
              {/* Current size values */}
              <div className="flex gap-2 flex-wrap mb-4">
                {sizeValues.map((value, index) => (
                  <div 
                    key={`size-${index}`} 
                    className="flex items-center border rounded-md pl-2 pr-1 py-1 group hover:bg-muted/50"
                  >
                    <span className="text-sm">{value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                      onClick={() => removeSizeValue(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Add size input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter a size (e.g., 'S', 'M', 'L', 'XL')"
                    value={newSizeValue}
                    onChange={(e) => setNewSizeValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSizeValue(newSizeValue);
                      }
                    }}
                    className={cn(
                      errors.size && "border-destructive"
                    )}
                  />
                  {errors.size && (
                    <p className="text-sm text-destructive mt-1">{errors.size}</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  onClick={() => addSizeValue(newSizeValue)}
                >
                  Add
                </Button>
              </div>
              
              {/* Common sizes */}
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">Common Sizes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {commonSizes.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => addCommonSize(size)}
                      disabled={sizeValues.some(v => v.toLowerCase() === size.toLowerCase())}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Matrix Preview Section */}
      {colorValues.length > 0 && sizeValues.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="text-base font-medium mb-3">Matrix Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will create {colorValues.length} × {sizeValues.length} = {totalCombinations} variant combinations
            </p>
            
            {/* Matrix table */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    {sizeValues.map((size, index) => (
                      <TableHead key={`size-header-${index}`}>
                        {size}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colorValues.map((color, colorIndex) => (
                    <TableRow key={`color-row-${colorIndex}`}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        {color}
                      </TableCell>
                      {sizeValues.map((size, sizeIndex) => (
                        <TableCell key={`variant-${colorIndex}-${sizeIndex}`}>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-xs text-muted-foreground">
                              {color}, {size}
                            </span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
            
      {/* Generate Button */}
      <div className="mt-6 flex justify-between items-center">
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
          className="px-8"
        >
          Generate {totalCombinations} Variants
        </Button>
      </div>
    </div>
  );
};

export default MatrixVariantGenerator;