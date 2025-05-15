import * as z from 'zod';

// Comprehensive product validation schema
export const productFormSchema = z.object({
  // Basic information
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "inactive", "archived"], {
    required_error: "Please select a product status",
  }),
  
  // Category and organization
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Pricing information
  sellingPrice: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Selling price must be a valid number greater than or equal to 0",
    }),
  purchasePrice: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Purchase price must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  mrp: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "MRP must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  gst: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: "GST must be a valid percentage between 0 and 100",
    })
    .optional()
    .nullable(),
  
  // Inventory and stock
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  inventoryQuantity: z.string()
    .refine(val => val === '' || (!isNaN(parseInt(val)) && parseInt(val) >= 0), {
      message: "Inventory quantity must be a valid number greater than or equal to 0",
    })
    .default("0"),
  
  // Physical attributes
  weight: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Weight must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  length: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Length must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  width: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Width must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  height: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Height must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  
  // Media
  featuredImageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  
  // Variants management (separate component will handle this)
  hasVariants: z.boolean().default(false),
});

// Schema for product variant validation
export const productVariantSchema = z.object({
  color: z.string().min(1, { message: "Color is required" }),
  size: z.string().min(1, { message: "Size is required" }),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sellingPrice: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Selling price must be a valid number greater than or equal to 0",
    }),
  purchasePrice: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Purchase price must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  mrp: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "MRP must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  gst: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
      message: "GST must be a valid percentage between 0 and 100",
    })
    .optional()
    .nullable(),
  inventoryQuantity: z.string()
    .refine(val => val === '' || (!isNaN(parseInt(val)) && parseInt(val) >= 0), {
      message: "Inventory quantity must be a valid number greater than or equal to 0",
    })
    .default("0"),
  weight: z.string()
    .refine(val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: "Weight must be a valid number greater than or equal to 0",
    })
    .optional()
    .nullable(),
  isDefault: z.boolean().default(false),
  images: z.array(z.string()).default([]), // Multiple images per variant
  imageUrl: z.string().optional().nullable(), // Main image for the variant
  attributes: z.record(z.string(), z.string()).optional(), // Custom attributes beyond color/size
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariantValues = z.infer<typeof productVariantSchema>;