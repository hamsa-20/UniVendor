import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EnhancedProductForm from "./EnhancedProductForm";

interface EnhancedProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: number;
  title?: string;
}

export default function EnhancedProductDialog({
  open,
  onOpenChange,
  productId,
  title = "Add New Product",
}: EnhancedProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-primary-foreground p-6 border-b">
          <Button
            variant="ghost"
            className="absolute left-6 h-8 w-8 p-0 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <EnhancedProductForm
            productId={productId}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}