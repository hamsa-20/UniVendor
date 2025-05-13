import { z } from 'zod';

// Validation schema for product form
export const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  purchasePrice: z.string().optional(), // Made optional as it might not be required for all products
  sellingPrice: z.string().min(1, 'Selling Price is required'),
  mrp: z.string().optional(), // Maximum Retail Price
  gst: z.string().optional(), // GST percentage
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.string().optional(),
  length: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  inventoryQuantity: z.string().transform(val => val === '' ? '0' : val),
  status: z.string().default('draft'),
  mainCategoryId: z.string().default("0"),
  categoryId: z.string().optional(),
  featuredImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;