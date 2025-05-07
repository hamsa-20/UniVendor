import { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Font options
const fontOptions = [
  { value: 'inter', label: 'Inter', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'roboto', label: 'Roboto', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'poppins', label: 'Poppins', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'lato', label: 'Lato', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'montserrat', label: 'Montserrat', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'open-sans', label: 'Open Sans', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'playfair-display', label: 'Playfair Display', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'nunito', label: 'Nunito', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'raleway', label: 'Raleway', previewText: 'The quick brown fox jumps over the lazy dog' },
  { value: 'oswald', label: 'Oswald', previewText: 'The quick brown fox jumps over the lazy dog' },
];

type FontSettings = {
  headingFont: string;
  bodyFont: string;
  fontSize: number;
  useCustomFonts: boolean;
  customHeadingFont?: string;
  customBodyFont?: string;
};

type FontSelectorProps = {
  value: FontSettings;
  onChange: (value: FontSettings) => void;
};

const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [bodyFontOpen, setBodyFontOpen] = useState(false);
  const [settings, setSettings] = useState<FontSettings>({
    headingFont: 'inter',
    bodyFont: 'inter',
    fontSize: 16,
    useCustomFonts: false,
  });

  // Initialize settings when component mounts or value changes
  useEffect(() => {
    if (value) {
      setSettings(value);
    }
  }, [value]);

  // Update settings and notify parent component
  const updateSettings = (newSettings: Partial<FontSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onChange(updatedSettings);
  };

  // Get font label
  const getFontLabel = (fontValue: string) => {
    return fontOptions.find((option) => option.value === fontValue)?.label || fontValue;
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Typography</h4>
        <p className="text-xs text-muted-foreground mb-4">
          Customize the fonts used throughout your store
        </p>
      </div>

      <div className="grid gap-4">
        {/* Heading Font Selector */}
        <div className="space-y-2">
          <Label htmlFor="heading-font">Heading Font</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {getFontLabel(settings.headingFont)}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search fonts..." />
                <CommandEmpty>No font found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {fontOptions.map((font) => (
                    <CommandItem
                      key={font.value}
                      onSelect={() => {
                        updateSettings({ headingFont: font.value });
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          settings.headingFont === font.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{font.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="text-center p-3 border rounded-md bg-muted/30">
            <p 
              className="text-lg" 
              style={{ fontFamily: `var(--font-${settings.headingFont}, sans-serif)` }}
            >
              Heading Text Preview
            </p>
          </div>
        </div>

        {/* Body Font Selector */}
        <div className="space-y-2">
          <Label htmlFor="body-font">Body Font</Label>
          <Popover open={bodyFontOpen} onOpenChange={setBodyFontOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={bodyFontOpen}
                className="w-full justify-between"
              >
                {getFontLabel(settings.bodyFont)}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search fonts..." />
                <CommandEmpty>No font found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {fontOptions.map((font) => (
                    <CommandItem
                      key={font.value}
                      onSelect={() => {
                        updateSettings({ bodyFont: font.value });
                        setBodyFontOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          settings.bodyFont === font.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{font.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="text-center p-3 border rounded-md bg-muted/30">
            <p 
              style={{ 
                fontFamily: `var(--font-${settings.bodyFont}, sans-serif)`,
                fontSize: `${settings.fontSize}px` 
              }}
            >
              {fontOptions.find(f => f.value === settings.bodyFont)?.previewText || 
                'The quick brown fox jumps over the lazy dog'}
            </p>
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="font-size">Base Font Size</Label>
            <span className="text-sm">{settings.fontSize}px</span>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={20}
            step={1}
            value={[settings.fontSize]}
            onValueChange={([size]) => updateSettings({ fontSize: size })}
            className="my-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Small</span>
            <span>Medium</span>
            <span>Large</span>
          </div>
        </div>

        {/* Custom Fonts Toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-md border p-3 shadow-sm">
          <div>
            <div className="font-medium">Custom Fonts</div>
            <div className="text-xs text-muted-foreground">
              Use custom web fonts (requires CSS knowledge)
            </div>
          </div>
          <Switch
            checked={settings.useCustomFonts}
            onCheckedChange={(checked) => updateSettings({ useCustomFonts: checked })}
          />
        </div>

        {settings.useCustomFonts && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> You'll need to add custom font CSS in the Advanced tab to use custom fonts.
              Include the @font-face definitions and specify the font family names in CSS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSelector;