import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
};

type ThemeSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

const themes: ThemeOption[] = [
  {
    id: 'default',
    name: 'Modern (Default)',
    description: 'A clean, minimal design with a focus on product images',
    previewUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
  {
    id: 'boutique',
    name: 'Boutique',
    description: 'Elegant design ideal for fashion and luxury goods',
    previewUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Classic styling with a nostalgic feel',
    previewUrl: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern design for technology and gadget stores',
    previewUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
  {
    id: 'food',
    name: 'Food & Grocery',
    description: 'Fresh design for food, grocery, and organic product stores',
    previewUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
  {
    id: 'home',
    name: 'Home & Decor',
    description: 'Warm and inviting design for home goods and furniture',
    previewUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600&q=80',
  },
];

const ThemeSelector = ({ value, onChange }: ThemeSelectorProps) => {
  const [selectedTheme, setSelectedTheme] = useState(value || 'default');

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    onChange(themeId);
  };

  return (
    <RadioGroup
      value={selectedTheme}
      onValueChange={handleThemeChange}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2"
    >
      {themes.map((theme) => (
        <div key={theme.id} className="relative">
          <RadioGroupItem
            value={theme.id}
            id={`theme-${theme.id}`}
            className="sr-only"
          />
          <Label
            htmlFor={`theme-${theme.id}`}
            className="cursor-pointer"
          >
            <Card className={cn(
              "overflow-hidden transition-all",
              selectedTheme === theme.id 
                ? "ring-2 ring-primary" 
                : "hover:shadow-md"
            )}>
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={theme.previewUrl}
                  alt={`${theme.name} theme preview`}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm font-medium">{theme.name}</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </CardContent>
              <CardFooter className="p-2 bg-muted/50">
                <div className={cn(
                  "text-xs rounded-sm px-2 py-1 font-medium",
                  selectedTheme === theme.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {selectedTheme === theme.id ? "Selected" : "Select Theme"}
                </div>
              </CardFooter>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default ThemeSelector;
