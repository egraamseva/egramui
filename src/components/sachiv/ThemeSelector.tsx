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
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Website Theme
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a color theme for your panchayat website. Changes will be reflected immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PREDEFINED_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          
          return (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => !saving && handleThemeSelect(theme.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{theme.name}</CardTitle>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs">{theme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Theme Preview */}
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg relative overflow-hidden"
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: theme.hero.textColor || '#FFFFFF' }}
                      >
                        Preview
                      </span>
                    </div>
                  </div>
                  
                  {/* Color Palette */}
                  <div className="grid grid-cols-4 gap-1">
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent"
                    />
                    <div
                      className="h-8 rounded border"
                      style={{ backgroundColor: theme.colors.surface }}
                      title="Surface"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {saving && (
        <div className="text-sm text-muted-foreground text-center">
          Saving theme...
        </div>
      )}
    </div>
  );
}

