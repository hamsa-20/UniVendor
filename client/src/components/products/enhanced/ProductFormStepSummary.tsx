import { cn } from "@/lib/utils";
import { LayoutGrid, Tag, DollarSign, Package, ImageIcon, Palette } from "lucide-react";

interface StepInfo {
  label: string;
  description?: string;
  icon: React.ReactNode;
  isCompleted?: boolean;
}

interface ProductFormStepSummaryProps {
  currentStep: number;
  steps: StepInfo[];
  onStepClick?: (step: number) => void;
  className?: string;
}

export default function ProductFormStepSummary({
  currentStep,
  steps,
  onStepClick,
  className,
}: ProductFormStepSummaryProps) {
  return (
    <aside className={cn("hidden lg:block px-6 py-8 border-r h-full", className)}>
      <div className="font-semibold mb-6 text-lg">Create New Product</div>
      <nav className="space-y-6">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;
          const isFuture = stepNumber > currentStep;
          
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 py-2 px-3 rounded-md transition-colors cursor-pointer",
                isActive && "bg-primary/5 text-primary border-l-4 border-primary pl-2",
                isPast && "text-muted-foreground",
                onStepClick && "hover:bg-muted"
              )}
              onClick={() => onStepClick?.(stepNumber)}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full border text-base font-medium",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isPast && "border-green-500 bg-green-500 text-white",
                    isFuture && "border-muted-foreground/30 text-muted-foreground/70"
                  )}
                >
                  {isPast ? "✓" : stepNumber}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {step.icon}
                  <span 
                    className={cn(
                      "font-medium",
                      isActive && "text-primary",
                      isPast && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {step.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// Pre-configured step information
export const defaultProductFormSteps: StepInfo[] = [
  {
    label: "Basic Information",
    description: "Name, description and status",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    label: "Category & Tags",
    description: "Organize your product",
    icon: <Tag className="h-4 w-4" />,
  },
  {
    label: "Pricing",
    description: "Set your price points",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    label: "Inventory",
    description: "Track your stock",
    icon: <Package className="h-4 w-4" />,
  },
  {
    label: "Images",
    description: "Upload product photos",
    icon: <ImageIcon className="h-4 w-4" />,
  },
  {
    label: "Variants",
    description: "Create product options",
    icon: <Palette className="h-4 w-4" />,
  },
];