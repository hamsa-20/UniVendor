import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Validation schema for option
const optionSchema = z.object({
  name: z.string().min(2, 'Option name must be at least 2 characters'),
  values: z.array(z.object({
    value: z.string().min(1, 'Value cannot be empty'),
  })).min(1, 'At least one value must be added'),
});

// Validation schema for variant
const variantSchema = z.object({
  optionValues: z.array(z.object({
    optionId: z.string(),
    optionValueId: z.string(),
  })),
  // Updated pricing fields
  purchasePrice: z.string().min(1, 'Purchase Price is required'),
  sellingPrice: z.string().min(1, 'Selling Price is required'),
  mrp: z.string().min(1, 'MRP is required'),
  gst: z.string().min(1, 'GST percentage is required'),
  sku: z.string().optional(),
  inventoryQuantity: z.string().transform(val => val === '' ? '0' : val),
  isDefault: z.boolean().default(false),
  imageUrl: z.string().optional(),
});

// Variants manager props
type ProductVariantsManagerProps = {
  productId?: number;
  initialOptions?: ProductOption[];
  initialVariants?: ProductVariant[];
  onOptionsChange?: (options: ProductOption[]) => void;
  onVariantsChange?: (variants: ProductVariant[]) => void;
};

// Types for our form data
interface ProductOption {
  id?: number;
  name: string;
  values: { id?: number; value: string }[];
}

// For color-based variant creation
interface SizeVariant {
  id?: number;
  sizeOptionId: string; // Option ID for the size option
  sizeValueId: string;  // Value ID for a specific size 
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  gst: string;
  sku?: string;
  inventoryQuantity: string;
  imageUrl?: string;
}

interface ColorVariant {
  id?: number;
  colorOptionId: string;  // Option ID for the color option
  colorValueId: string;   // Value ID for a specific color
  colorName?: string;     // Display name for the color
  sizes: SizeVariant[];   // Sizes for this color
}

// Validation schema for size variant
const sizeVariantSchema = z.object({
  sizeOptionId: z.string().min(1, 'Size option is required'),
  sizeValueId: z.string().min(1, 'Size value is required'),
  purchasePrice: z.string().min(1, 'Purchase Price is required'),
  sellingPrice: z.string().min(1, 'Selling Price is required'),
  mrp: z.string().min(1, 'MRP is required'),
  gst: z.string().min(1, 'GST percentage is required'),
  sku: z.string().optional(),
  inventoryQuantity: z.string().transform(val => val === '' ? '0' : val),
  imageUrl: z.string().optional(),
});

interface ProductVariant {
  id?: number;
  optionValues: { optionId: string; optionValueId: string }[];
  // New pricing fields to match our database schema
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  gst: string;
  sku?: string;
  inventoryQuantity: string;
  isDefault: boolean;
  imageUrl?: string;
}

const ProductVariantsManager = ({ 
  productId,
  initialOptions = [],
  initialVariants = [],
  onOptionsChange,
  onVariantsChange
}: ProductVariantsManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const vendorId = user?.role === 'vendor' ? user.id : undefined;
  
  const [options, setOptions] = useState<ProductOption[]>(initialOptions);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false);
  const [isAddVariantDialogOpen, setIsAddVariantDialogOpen] = useState(false);
  const [isEditOptionDialogOpen, setIsEditOptionDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  
  // New states for hierarchical variant creation
  const [isAddHierarchicalVariantOpen, setIsAddHierarchicalVariantOpen] = useState(false);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [selectedColorOption, setSelectedColorOption] = useState<string>('');
  const [selectedColorValue, setSelectedColorValue] = useState<string>('');
  const [selectedSizeOption, setSelectedSizeOption] = useState<string>('');
  const [currentColorVariant, setCurrentColorVariant] = useState<ColorVariant | null>(null);
  
  // Get color and size options
  const colorOption = useMemo(() => 
    options.find(o => o.name.toLowerCase().includes('color')), 
    [options]
  );
  
  const sizeOption = useMemo(() => 
    options.find(o => o.name.toLowerCase().includes('size')), 
    [options]
  );
  
  // Option form
  const optionForm = useForm<ProductOption>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      name: '',
      values: [{ value: '' }],
    },
  });
  
  const { fields: optionValueFields, append: appendOptionValue, remove: removeOptionValue } = 
    useFieldArray({
      control: optionForm.control,
      name: "values",
    });
  
  // Variant form
  const variantForm = useForm<ProductVariant>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      optionValues: [],
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      gst: '',
      sku: '',
      inventoryQuantity: '0',
      isDefault: false,
      imageUrl: '',
    },
  });
  
  // Size variant form
  const sizeVariantForm = useForm<SizeVariant>({
    resolver: zodResolver(sizeVariantSchema),
    defaultValues: {
      sizeOptionId: '',
      sizeValueId: '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      gst: '',
      sku: '',
      inventoryQuantity: '0',
      imageUrl: '',
    },
  });
  
  // Update parent component when options or variants change
  useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange(options);
    }
  }, [options, onOptionsChange]);
  
  useEffect(() => {
    if (onVariantsChange) {
      onVariantsChange(variants);
    }
  }, [variants, onVariantsChange]);
  
  // Convert color variants to regular variants for saving
  useEffect(() => {
    if (colorVariants.length > 0) {
      // Convert hierarchical variants to flat variants
      const newVariants: ProductVariant[] = [];
      let isFirstVariant = variants.length === 0;
      
      colorVariants.forEach(colorVariant => {
        const colorOption = options.find(o => o.id?.toString() === colorVariant.colorOptionId);
        const colorValue = colorOption?.values.find(v => v.id?.toString() === colorVariant.colorValueId);
        
        colorVariant.sizes.forEach(sizeVariant => {
          const sizeOption = options.find(o => o.id?.toString() === sizeVariant.sizeOptionId);
          const sizeValue = sizeOption?.values.find(v => v.id?.toString() === sizeVariant.sizeValueId);
          
          if (colorOption && colorValue && sizeOption && sizeValue) {
            const optionValues = [
              { optionId: colorVariant.colorOptionId, optionValueId: colorVariant.colorValueId },
              { optionId: sizeVariant.sizeOptionId, optionValueId: sizeVariant.sizeValueId }
            ];
            
            // Create a regular variant from the color-size combination
            const newVariant: ProductVariant = {
              id: Date.now() + newVariants.length,
              optionValues,
              purchasePrice: sizeVariant.purchasePrice,
              sellingPrice: sizeVariant.sellingPrice,
              mrp: sizeVariant.mrp,
              gst: sizeVariant.gst,
              sku: sizeVariant.sku || '',
              inventoryQuantity: sizeVariant.inventoryQuantity,
              isDefault: isFirstVariant, // First variant is default
              imageUrl: sizeVariant.imageUrl || '',
            };
            
            newVariants.push(newVariant);
            isFirstVariant = false;
          }
        });
      });
      
      if (newVariants.length > 0) {
        setVariants(prevVariants => [...prevVariants, ...newVariants]);
        setColorVariants([]);
      }
    }
  }, [colorVariants, options, variants.length]);
  
  // Initialize variant form with option values - enforcing Color→Size hierarchy
  useEffect(() => {
    if (options.length > 0 && isAddVariantDialogOpen) {
      // Sort options to prioritize Color first, then Size
      const sortedOptions = [...options].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Color is always first in hierarchy
        if (aName.includes('color')) return -1;
        if (bName.includes('color')) return 1;
        
        // Size is always second in hierarchy
        if (aName.includes('size')) return -1;
        if (bName.includes('size')) return 1;
        
        // Other options in original order
        return 0;
      });
      
      const optionValues = sortedOptions.map(option => ({
        optionId: option.id?.toString() || '',
        optionValueId: '',
      }));
      
      variantForm.reset({
        ...variantForm.getValues(),
        optionValues,
      });
    }
  }, [options, isAddVariantDialogOpen, variantForm]);
  
  // Submit handlers
  const handleOptionSubmit = (data: ProductOption) => {
    // For a new option
    if (!selectedOption) {
      const newOption = {
        ...data,
        id: Date.now(), // Temporary ID until saved to backend
      };
      setOptions([...options, newOption]);
      toast({
        title: "Option added",
        description: `${data.name} has been added with ${data.values.length} values.`,
      });
    } 
    // For editing an existing option
    else {
      const updatedOptions = options.map(opt => 
        opt.id === selectedOption.id ? { ...data, id: selectedOption.id } : opt
      );
      setOptions(updatedOptions);
      toast({
        title: "Option updated",
        description: `${data.name} has been updated.`,
      });
    }
    
    optionForm.reset({
      name: '',
      values: [{ value: '' }],
    });
    setIsAddOptionDialogOpen(false);
    setIsEditOptionDialogOpen(false);
    setSelectedOption(null);
  };
  
  const handleVariantSubmit = (data: ProductVariant) => {
    const newVariant = {
      ...data,
      id: Date.now(), // Temporary ID until saved to backend
    };
    
    // If this is the first variant or set as default, make it the default
    if (variants.length === 0 || data.isDefault) {
      // If this is set as default, unset any existing defaults
      const updatedVariants = variants.map(v => ({
        ...v,
        isDefault: false,
      }));
      setVariants([...updatedVariants, { ...newVariant, isDefault: true }]);
    } else {
      setVariants([...variants, newVariant]);
    }
    
    toast({
      title: "Variant added",
      description: "The product variant has been added.",
    });
    
    variantForm.reset({
      optionValues: [],
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      gst: '',
      sku: '',
      inventoryQuantity: '0',
      isDefault: false,
      imageUrl: '',
    });
    setIsAddVariantDialogOpen(false);
  };
  
  const editOption = (option: ProductOption) => {
    setSelectedOption(option);
    optionForm.reset({
      name: option.name,
      values: option.values,
    });
    setIsEditOptionDialogOpen(true);
  };
  
  const deleteOption = (optionId: number | undefined) => {
    if (!optionId) return;
    
    // Remove the option
    const updatedOptions = options.filter(opt => opt.id !== optionId);
    setOptions(updatedOptions);
    
    // If this affects existing variants, we need to handle that
    // For simplicity, this implementation removes any variants that used the deleted option
    const updatedVariants = variants.filter(variant => 
      !variant.optionValues.some(ov => ov.optionId === optionId.toString())
    );
    
    if (variants.length !== updatedVariants.length) {
      setVariants(updatedVariants);
      toast({
        title: "Variants updated",
        description: `Some variants were removed because they used the deleted option.`,
        variant: "destructive",
      });
    }
    
    toast({
      title: "Option deleted",
      description: "The option has been removed.",
    });
  };
  
  const deleteVariant = (variantId: number | undefined) => {
    if (!variantId) return;
    
    const variantToDelete = variants.find(v => v.id === variantId);
    const updatedVariants = variants.filter(v => v.id !== variantId);
    
    // If we're deleting the default variant, set a new default if there are any variants left
    if (variantToDelete?.isDefault && updatedVariants.length > 0) {
      updatedVariants[0].isDefault = true;
    }
    
    setVariants(updatedVariants);
    toast({
      title: "Variant deleted",
      description: "The variant has been removed.",
    });
  };
  
  const setDefaultVariant = (variantId: number | undefined) => {
    if (!variantId) return;
    
    const updatedVariants = variants.map(v => ({
      ...v,
      isDefault: v.id === variantId,
    }));
    
    setVariants(updatedVariants);
    toast({
      title: "Default variant updated",
      description: "The default variant has been updated.",
    });
  };
  
  // Helper to get option name by ID
  const getOptionName = (optionId: string) => {
    const option = options.find(o => o.id?.toString() === optionId);
    return option ? option.name : 'Unknown option';
  };
  
  // Helper to get option value by ID
  const getOptionValue = (optionId: string, valueId: string) => {
    const option = options.find(o => o.id?.toString() === optionId);
    if (!option) return 'Unknown value';
    
    const value = option.values.find(v => v.id?.toString() === valueId);
    return value ? value.value : 'Unknown value';
  };
  
  // Generate variant combinations
  const generateVariantCombinations = () => {
    // First, validate that we have options with values
    if (options.length === 0) {
      toast({
        title: "No options defined",
        description: "Please add at least one option with values before generating variants.",
        variant: "destructive",
      });
      return;
    }
    
    // Get all option values from each option
    const optionValues = options.map(option => {
      return option.values.map(value => ({
        optionId: option.id?.toString() || '',
        optionValueId: value.id?.toString() || '',
        optionName: option.name,
        value: value.value,
      }));
    });
    
    // Generate all combinations
    const generateCombinations = (
      optionIdx = 0, 
      current: {optionId: string, optionValueId: string}[] = []
    ): {optionId: string, optionValueId: string}[][] => {
      if (optionIdx >= optionValues.length) {
        return [current];
      }
      
      let combinations: {optionId: string, optionValueId: string}[][] = [];
      
      for (const value of optionValues[optionIdx]) {
        combinations = [
          ...combinations,
          ...generateCombinations(
            optionIdx + 1,
            [...current, { optionId: value.optionId, optionValueId: value.optionValueId }]
          )
        ];
      }
      
      return combinations;
    };
    
    const combinations = generateCombinations();
    
    // Check if any combinations already exist as variants
    const existingCombinations = new Set(
      variants.map(v => JSON.stringify(v.optionValues.sort((a, b) => 
        a.optionId.localeCompare(b.optionId)
      )))
    );
    
    // Create new variants for combinations that don't exist yet
    let newVariants: ProductVariant[] = [];
    let existingCount = 0;
    
    for (const combination of combinations) {
      const sortedCombo = [...combination].sort((a, b) => 
        a.optionId.localeCompare(b.optionId)
      );
      
      if (!existingCombinations.has(JSON.stringify(sortedCombo))) {
        newVariants.push({
          id: Date.now() + newVariants.length, // Ensure unique IDs
          optionValues: combination,
          // Use first variant pricing as default or empty strings
          purchasePrice: variants.length > 0 ? variants[0].purchasePrice : '',
          sellingPrice: variants.length > 0 ? variants[0].sellingPrice : '',
          mrp: variants.length > 0 ? variants[0].mrp : '',
          gst: variants.length > 0 ? variants[0].gst : '',
          sku: '',
          inventoryQuantity: '0',
          isDefault: variants.length === 0 && newVariants.length === 0, // First variant is default
          imageUrl: '',
        });
      } else {
        existingCount++;
      }
    }
    
    if (newVariants.length > 0) {
      setVariants([...variants, ...newVariants]);
      toast({
        title: "Variants generated",
        description: `Generated ${newVariants.length} new variant combinations.`,
      });
    } else if (existingCount > 0) {
      toast({
        title: "No new variants",
        description: `All ${existingCount} possible combinations already exist.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "No variants generated",
        description: "No valid combinations could be created with the current options.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Product Options</h3>
        <Button 
          size="sm" 
          onClick={() => {
            optionForm.reset({
              name: '',
              values: [{ value: '' }],
            });
            setIsAddOptionDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>
      
      {options.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No options defined</AlertTitle>
          <AlertDescription>
            Add options like Size or Color to create product variants.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option Name</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {option.values.map((value, idx) => (
                          <span 
                            key={value.id || idx} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {value.value}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editOption(option)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteOption(option.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      <Separator />
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Product Variants</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateVariantCombinations}
            disabled={options.length === 0}
          >
            Generate All Combinations
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsAddVariantDialogOpen(true)}
            disabled={options.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </div>
      </div>
      
      {options.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Define options first</AlertTitle>
          <AlertDescription>
            Add product options before creating variants.
          </AlertDescription>
        </Alert>
      ) : variants.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No variants defined</AlertTitle>
          <AlertDescription>
            Add variants or generate them automatically from your options.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      {variant.optionValues.map((ov, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{getOptionName(ov.optionId)}:</span>{' '}
                          <span>{getOptionValue(ov.optionId, ov.optionValueId)}</span>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>₹{variant.purchasePrice || '-'}</TableCell>
                    <TableCell>₹{variant.sellingPrice || '-'}</TableCell>
                    <TableCell>₹{variant.mrp || '-'}</TableCell>
                    <TableCell>{variant.gst ? `${variant.gst}%` : '-'}</TableCell>
                    <TableCell>{variant.sku || '-'}</TableCell>
                    <TableCell>{variant.inventoryQuantity}</TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={variant.isDefault}
                        onCheckedChange={() => setDefaultVariant(variant.id)}
                        disabled={variant.isDefault}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteVariant(variant.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Add Option Dialog */}
      <Dialog 
        open={isAddOptionDialogOpen} 
        onOpenChange={setIsAddOptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Option</DialogTitle>
            <DialogDescription>
              Add option like Color or Size to create product variants
            </DialogDescription>
          </DialogHeader>
          
          <Form {...optionForm}>
            <form onSubmit={optionForm.handleSubmit(handleOptionSubmit)} className="space-y-4">
              
              <FormField
                control={optionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Size, Color, Material" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Option Values</FormLabel>
                
                {optionValueFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={optionForm.control}
                      name={`values.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Small, Red, Cotton" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOptionValue(index)}
                      disabled={optionValueFields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOptionValue({ value: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Value
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="submit">
                  Save Option
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Option Dialog */}
      <Dialog 
        open={isEditOptionDialogOpen} 
        onOpenChange={setIsEditOptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Option</DialogTitle>
            <DialogDescription>
              Update this option and its values.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...optionForm}>
            <form onSubmit={optionForm.handleSubmit(handleOptionSubmit)} className="space-y-4">
              <FormField
                control={optionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Size, Color, Material" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Option Values</FormLabel>
                
                {optionValueFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={optionForm.control}
                      name={`values.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Small, Red, Cotton" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOptionValue(index)}
                      disabled={optionValueFields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOptionValue({ value: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Value
                </Button>
              </div>
              
              <DialogFooter>
                <Button type="submit">
                  Update Option
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Variant Dialog */}
      <Dialog 
        open={isAddVariantDialogOpen} 
        onOpenChange={setIsAddVariantDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
            <DialogDescription>
              Create a new variant with your selected options.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...variantForm}>
            <form onSubmit={variantForm.handleSubmit(handleVariantSubmit)} className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Variant Options</h4>
                
                {options.map((option, optionIndex) => (
                  <FormField
                    key={option.id}
                    control={variantForm.control}
                    name={`optionValues.${optionIndex}.optionValueId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{option.name}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${option.name}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {option.values.map((value, idx) => (
                              <SelectItem 
                                key={value.id || idx} 
                                value={value.id?.toString() || idx.toString()}
                              >
                                {value.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        
                        <input 
                          type="hidden" 
                          {...variantForm.register(`optionValues.${optionIndex}.optionId`)}
                          value={option.id?.toString()}
                        />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={variantForm.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price *</FormLabel>
                      <FormDescription>Your cost to purchase this item</FormDescription>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">₹</span>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="pl-7"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={variantForm.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price *</FormLabel>
                      <FormDescription>Your selling price to customers</FormDescription>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">₹</span>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="pl-7"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={variantForm.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP *</FormLabel>
                      <FormDescription>Maximum Retail Price</FormDescription>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">₹</span>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="pl-7"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={variantForm.control}
                  name="gst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST *</FormLabel>
                      <FormDescription>Tax percentage</FormDescription>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            step="0.01" 
                            placeholder="0" 
                            {...field} 
                          />
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={variantForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU for this variant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={variantForm.control}
                  name="inventoryQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1" 
                          placeholder="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={variantForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="URL for variant image" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to use the product's main image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={variantForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default variant
                      </FormLabel>
                      <FormDescription>
                        The default variant will be selected initially when customers view the product
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  Add Variant
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductVariantsManager;