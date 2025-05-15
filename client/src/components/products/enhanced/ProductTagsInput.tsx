import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ProductTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  helpText?: string;
}

export default function ProductTagsInput({
  value = [],
  onChange,
  label = "Tags",
  helpText = "Add relevant keywords to help customers find your product",
}: ProductTagsInputProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Normalize the tag (lowercase, trim whitespace)
    const normalizedTag = tagInput.trim().toLowerCase();
    
    // Check if tag already exists (case insensitive)
    if (!value.some(tag => tag.toLowerCase() === normalizedTag)) {
      onChange([...value, normalizedTag]);
    }
    
    setTagInput("");
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && value.length > 0) {
      // If backspace is pressed on an empty input, remove the last tag
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="py-1.5">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Add tag (press Enter to add)"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button 
          onClick={addTag} 
          type="button"
          disabled={!tagInput.trim()}
        >
          Add
        </Button>
      </div>
      
      {helpText && (
        <p className="text-sm text-muted-foreground mt-1">{helpText}</p>
      )}
    </div>
  );
}