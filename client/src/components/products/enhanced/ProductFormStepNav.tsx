import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

interface ProductFormStepNavProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isLastStep?: boolean;
}

export default function ProductFormStepNav({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  isSaving = false,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLastStep = false,
}: ProductFormStepNavProps) {
  return (
    <div className="flex items-center justify-between border-t pt-6 mt-8">
      <div className="flex items-center text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>
      
      <div className="flex gap-2">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}
        
        {onSave && (
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
        )}
        
        {isLastStep ? (
          <Button 
            type="submit"
            disabled={isNextDisabled || isSaving}
          >
            {isSaving ? "Saving..." : "Complete Product"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}