import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Check, Palette } from 'lucide-react';
import { PREDEFINED_THEMES, type WebsiteTheme } from '../../types/themes';
import { toast } from 'sonner';
import { settingsApi } from '../../routes/api';

interface ThemeSelectorProps {
  currentThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export function ThemeSelector({ currentThemeId, onThemeChange }: ThemeSelectorProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentThemeId || 'default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentThemeId) {
      setSelectedThemeId(currentThemeId);
    }
  }, [currentThemeId]);

  const handleThemeSelect = async (themeId: string) => {
    setSelectedThemeId(themeId);
    
    if (onThemeChange) {
      onThemeChange(themeId);
    }

    // Save to backend
    try {
      setSaving(true);
      await settingsApi.update({ themeId });
      toast.success('Theme updated successfully');
    } catch (error: any) {
      toast.error('Failed to update theme: ' + (error.message || 'Unknown error'));
      // Revert selection on error
      setSelectedThemeId(currentThemeId || 'default');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xl font-bold text-[#1B2B5E] flex items-center gap-2">
          <Palette className="h-6 w-6 text-[#E31E24]" />
          Website Theme
        </Label>
        <p className="text-sm text-[#666] mt-2">
          Choose a professional color theme for your panchayat website. The selected theme will be applied immediately and visible to all visitors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREDEFINED_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          
          return (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-xl border-2 ${
                isSelected 
                  ? 'ring-2 ring-[#1B2B5E] ring-offset-2 border-[#1B2B5E] shadow-lg' 
                  : 'border-[#E5E5E5] hover:border-[#1B2B5E]'
              }`}
              onClick={() => !saving && handleThemeSelect(theme.id)}
            >
              <CardHeader className="pb-3 bg-[#F9FAFB] border-b border-[#E5E5E5]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-[#1B2B5E]">{theme.name}</CardTitle>
                  {isSelected && (
                    <div className="h-7 w-7 rounded-full bg-[#1B2B5E] flex items-center justify-center shadow-md">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs text-[#666] mt-1">{theme.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Theme Preview */}
                <div className="space-y-3">
                  <div
                    className="h-24 rounded-lg relative overflow-hidden shadow-md border border-white/20"
                    style={{
                      background: theme.hero.backgroundGradient || theme.colors.primary,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: theme.hero.overlay || 'rgba(0,0,0,0.1)',
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                      <span
                        className="text-sm font-bold mb-1"
                        style={{ color: theme.hero.textColor || '#FFFFFF' }}
                      >
                        Hero Section
                      </span>
                      <span
                        className="text-xs opacity-90"
                        style={{ color: theme.hero.textColor || '#FFFFFF' }}
                      >
                        Preview
                      </span>
                    </div>
                  </div>
                  
                  {/* Color Palette */}
                  <div>
                    <p className="text-xs font-semibold text-[#666] mb-2">Color Palette</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <div
                          className="h-10 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.colors.primary }}
                          title="Primary"
                        />
                        <p className="text-[10px] text-[#666] text-center">Primary</p>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-10 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.colors.secondary }}
                          title="Secondary"
                        />
                        <p className="text-[10px] text-[#666] text-center">Secondary</p>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-10 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent"
                        />
                        <p className="text-[10px] text-[#666] text-center">Accent</p>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-10 rounded border-2 border-[#E5E5E5] shadow-sm"
                          style={{ backgroundColor: theme.colors.surface }}
                          title="Surface"
                        />
                        <p className="text-[10px] text-[#666] text-center">Surface</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {saving && (
        <div className="text-sm text-[#666] text-center py-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B2B5E]"></div>
            Saving theme...
          </div>
        </div>
      )}
    </div>
  );
}

