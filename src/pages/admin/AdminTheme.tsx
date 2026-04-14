import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/hooks/use-toast';

const presets = [
  { name: 'Dark', primary: '#ffffff', accent: '#1a1a2e', bg: '#0a0a0a', card: 'rgba(255,255,255,0.06)', text: '#f0f0f0', nav: 'rgba(10,10,10,0.85)', button: '#ffffff', border: 'rgba(255,255,255,0.1)' },
  { name: 'Light', primary: '#1a1a2e', accent: '#3b82f6', bg: '#fafbfc', card: '#ffffff', text: '#1a1a2e', nav: 'rgba(255,255,255,0.95)', button: '#3b82f6', border: 'rgba(0,0,0,0.1)' },
  { name: 'Ocean', primary: '#ffffff', accent: '#2d8a9e', bg: '#0c2340', card: 'rgba(255,255,255,0.08)', text: '#e8f0f8', nav: 'rgba(12,35,64,0.9)', button: '#5cbdb9', border: 'rgba(255,255,255,0.12)' },
  { name: 'Forest', primary: '#ffffff', accent: '#5a8a5c', bg: '#1a3c2a', card: 'rgba(255,255,255,0.06)', text: '#e8f0e8', nav: 'rgba(26,60,42,0.9)', button: '#a0c49d', border: 'rgba(255,255,255,0.1)' },
  { name: 'Sunset', primary: '#ffffff', accent: '#ff6b35', bg: '#1a0a0a', card: 'rgba(255,255,255,0.06)', text: '#f0e8e0', nav: 'rgba(26,10,10,0.9)', button: '#f7931e', border: 'rgba(255,255,255,0.1)' },
  { name: 'Noir Gold', primary: '#c9a84c', accent: '#f0d78c', bg: '#0d0d0d', card: 'rgba(255,255,255,0.04)', text: '#f0f0f0', nav: 'rgba(13,13,13,0.9)', button: '#c9a84c', border: 'rgba(201,168,76,0.2)' },
];

const AdminTheme = () => {
  const { theme, updateTheme } = useTheme();
  const [colors, setColors] = useState(theme);
  const { toast } = useToast();

  const applyPreset = (preset: typeof presets[0]) => {
    const newColors = {
      primaryColor: preset.primary,
      accentColor: preset.accent,
      backgroundColor: preset.bg,
      cardBackground: preset.card,
      textColor: preset.text,
      navColor: preset.nav,
      buttonColor: preset.button,
      borderColor: preset.border,
    };
    setColors(newColors);
    updateTheme(newColors);
  };

  const saveTheme = async () => {
    const { error } = await supabase
      .from('theme_settings')
      .update({
        primary_color: colors.primaryColor,
        accent_color: colors.accentColor,
        background_color: colors.backgroundColor,
        card_background: colors.cardBackground,
        text_color: colors.textColor,
        nav_color: colors.navColor,
        button_color: colors.buttonColor,
        border_color: colors.borderColor,
        updated_at: new Date().toISOString(),
      })
      .not('id', 'is', null); // update all rows (should be 1)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      updateTheme(colors);
      toast({ title: 'Theme saved' });
    }
  };

  const colorFields = [
    { key: 'primaryColor' as const, label: 'Primary' },
    { key: 'accentColor' as const, label: 'Accent' },
    { key: 'backgroundColor' as const, label: 'Background' },
    { key: 'textColor' as const, label: 'Text' },
    { key: 'buttonColor' as const, label: 'Button' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Theme</h1>

      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full" style={{ background: p.bg }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: p.accent }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: p.primary }} />
                </div>
                <span className="text-sm font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {colorFields.map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <Label className="w-24 text-sm">{field.label}</Label>
              <Input
                type="color"
                value={colors[field.key]}
                onChange={(e) => setColors({ ...colors, [field.key]: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={colors[field.key]}
                onChange={(e) => setColors({ ...colors, [field.key]: e.target.value })}
                className="flex-1"
              />
            </div>
          ))}
          <Button onClick={saveTheme} className="w-full mt-4">Save Theme</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg p-6 space-y-3"
            style={{ background: colors.backgroundColor, color: colors.textColor }}
          >
            <h3 style={{ color: colors.primaryColor }} className="text-lg font-bold">Preview Heading</h3>
            <p className="text-sm">This is how your platform will look with these colors.</p>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: colors.accentColor, color: colors.primaryColor }}
            >
              Sample Button
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTheme;
