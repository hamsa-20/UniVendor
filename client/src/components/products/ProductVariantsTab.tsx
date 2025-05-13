import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  ImagePlus,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import MatrixVariantManager from "./MatrixVariantManager";

const ProductVariantsTab = ({ product }) => {
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    data: variants,
    isLoading,
  } = useQuery({
    queryKey: ["/api/products", product.id, "variants"],
    queryFn: () => fetch(`/api/products/${product.id}/variants`).then(res => res.json()),
    refetchOnWindowFocus: false,
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId) => {
      await apiRequest("DELETE", `/api/products/${product.id}/variants/${variantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "variants"] });
      toast({
        title: "Variant deleted",
        description: "The variant has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setSelectedVariant(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete variant",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Variants</CardTitle>
            <CardDescription>
              Manage all the variations of this product
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateVariantOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Variants
          </Button>
        </CardHeader>
        <CardContent>
          {variants?.length > 0 ? (
            <Table>
              <TableCaption>List of all variants for {product.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {variant.imageUrl ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                            <img 
                              src={variant.imageUrl} 
                              alt={`${variant.color} ${variant.size}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {variant.color} {variant.size && `/ ${variant.size}`}
                          </div>
                          {variant.isDefault && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Check className="h-3 w-3" /> Default variant
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{variant.sku || "—"}</TableCell>
                    <TableCell>{formatCurrency(variant.sellingPrice)}</TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        variant.inventoryQuantity > 10 
                          ? "bg-green-50 text-green-700" 
                          : variant.inventoryQuantity > 0 
                            ? "bg-yellow-50 text-yellow-700" 
                            : "bg-red-50 text-red-700"
                      )}>
                        {variant.inventoryQuantity > 0 ? `${variant.inventoryQuantity} in stock` : "Out of stock"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setIsCreateVariantOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No variants defined</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                This product doesn't have any variants yet. Create variants to offer different
                options like colors, sizes, or materials.
              </p>
              <Button onClick={() => setIsCreateVariantOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Variants
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Variant Dialog */}
      <Dialog open={isCreateVariantOpen} onOpenChange={setIsCreateVariantOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVariant ? "Edit Variant" : "Create Variants"}</DialogTitle>
            <DialogDescription>
              {selectedVariant 
                ? "Modify this variant's details." 
                : "Define attributes like color and size to create product variants."}
            </DialogDescription>
          </DialogHeader>
          
          <MatrixVariantManager 
            product={product}
            initialVariant={selectedVariant}
            onClose={() => {
              setIsCreateVariantOpen(false);
              setSelectedVariant(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this 
              variant and its inventory information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteVariantMutation.mutate(selectedVariant.id)}
              disabled={deleteVariantMutation.isPending}
            >
              {deleteVariantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductVariantsTab;