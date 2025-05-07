import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define color palette options
const colorPalettes = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#4f46e5', // Indigo
      secondary: '#8b5cf6', // Purple
      accent: '#f97316', // Orange
      background: '#ffffff', // White
      text: '#171717', // Black
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0891b2', // Cyan
      secondary: '#0ea5e9', // Sky
      accent: '#14b8a6', // Teal
      background: '#f8fafc', // Light gray
      text: '#0f172a', // Slate
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#15803d', // Green
      secondary: '#059669', // Emerald
      accent: '#ca8a04', // Yellow
      background: '#f8fafc', // Light gray
      text: '#1e293b', // Slate dark
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#db2777', // Pink
      secondary: '#e11d48', // Rose
      accent: '#f59e0b', // Amber
      background: '#ffffff', // White
      text: '#171717', // Black
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary: '#404040', // Gray
      secondary: '#525252', // Gray light
      accent: '#737373', // Gray lighter
      background: '#fafafa', // Gray lightest
      text: '#171717', // Black
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    colors: {
      primary: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#f97316',
      background: '#ffffff',
      text: '#171717',
    },
  },
];

type ColorPaletteProps = {
  value: string;
  onChange: (value: string, colors?: Record<string, string>) => void;
  customColors?: Record<string, string>;
};

const ColorPalette = ({ value, onChange, customColors }: ColorPaletteProps) => {
  const [selectedPalette, setSelectedPalette] = useState(value || 'default');
  const [paletteColors, setPaletteColors] = useState<Record<string, string>>({});

  // Initialize colors when component mounts or value changes
  useEffect(() => {
    const palette = colorPalettes.find((p) => p.id === value) || colorPalettes[0];
    
    // If custom palette and custom colors are provided, use them
    if (palette.id === 'custom' && customColors) {
      setPaletteColors(customColors);
    } else {
      setPaletteColors(palette.colors);
    }
    
    setSelectedPalette(palette.id);
  }, [value, customColors]);

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPalette(paletteId);
    
    const palette = colorPalettes.find((p) => p.id === paletteId) || colorPalettes[0];
    setPaletteColors(palette.colors);
    
    // Notify parent component
    onChange(paletteId, palette.colors);
  };

  // Get currently selected palette name
  const getSelectedPaletteName = () => {
    return colorPalettes.find((p) => p.id === selectedPalette)?.name || 'Default';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Color Palette</h4>
          <p className="text-xs text-muted-foreground">
            Select a predefined color scheme for your store
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {getSelectedPaletteName()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="end">
            <div className="space-y-1 p-1">
              {colorPalettes.map((palette) => (
                <Button
                  key={palette.id}
                  variant="ghost"
                  className={cn("w-full justify-between pl-2 pr-1 py-1 h-8", {
                    "bg-accent text-accent-foreground": selectedPalette === palette.id,
                  })}
                  onClick={() => handlePaletteChange(palette.id)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: palette.colors.primary }}
                    ></div>
                    <span className="text-sm">{palette.name}</span>
                  </div>
                  {selectedPalette === palette.id && (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-5 gap-2 py-2">
        {Object.entries(paletteColors).map(([key, color]) => (
          <div key={key} className="flex flex-col items-center">
            <div 
              className="w-8 h-8 rounded-full border shadow-sm mb-1" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-xs text-muted-foreground capitalize">
              {key}
            </span>
          </div>
        ))}
      </div>

      {selectedPalette === 'custom' && (
        <div className="bg-accent/10 rounded p-3 text-sm">
          <p className="font-medium mb-1">Custom Palette</p>
          <p className="text-xs text-muted-foreground">
            To customize individual colors, use the advanced CSS options in the next tab.
          </p>
        </div>
      )}
    </div>
  );
};

export default ColorPalette;