import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

// Define available store themes
const themes = [
  {
    id: 'default',
    name: 'Minimal',
    description: 'Clean, modern design with a focus on simplicity',
    thumbnail: '/assets/themes/default-thumb.jpg'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design with subtle animations',
    thumbnail: '/assets/themes/elegant-thumb.jpg'
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong visuals with high-contrast elements',
    thumbnail: '/assets/themes/bold-thumb.jpg'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro styling with a nostalgic feel',
    thumbnail: '/assets/themes/vintage-thumb.jpg'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with cutting-edge features',
    thumbnail: '/assets/themes/modern-thumb.jpg'
  }
];

type ThemeSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

const ThemeSelector = ({ value, onChange }: ThemeSelectorProps) => {
  const [selectedTheme, setSelectedTheme] = useState(value || 'default');

  // Update selected theme when value prop changes
  useEffect(() => {
    setSelectedTheme(value);
  }, [value]);

  // Handle theme selection
  const handleThemeClick = (themeId: string) => {
    setSelectedTheme(themeId);
    onChange(themeId);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {themes.map((theme) => (
          <div key={theme.id} className="space-y-2">
            <div 
              className={cn(
                "aspect-video relative rounded-md cursor-pointer overflow-hidden border-2 transition-all",
                selectedTheme === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              )}
              onClick={() => handleThemeClick(theme.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40">
                <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm text-gray-500 uppercase font-medium">
                  {theme.name}
                </div>
              </div>
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`theme-${theme.id}`}
                className={cn(
                  "text-sm font-medium block cursor-pointer",
                  selectedTheme === theme.id ? "text-primary" : "text-foreground"
                )}
              >
                {theme.name}
              </Label>
              <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;