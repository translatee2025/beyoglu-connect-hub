import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { config } from '@/config';
import { supabase } from '@/integrations/supabase/client';

interface ThemeColors {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  navColor: string;
  buttonColor: string;
  borderColor: string;
}

interface ThemeContextValue {
  theme: ThemeColors;
  updateTheme: (colors: Partial<ThemeColors>) => void;
}

const defaultTheme: ThemeColors = {
  primaryColor: config.primaryColor,
  accentColor: config.accentColor,
  backgroundColor: config.backgroundColor,
  cardBackground: config.cardBackground,
  textColor: config.textColor,
  navColor: config.navColor,
  buttonColor: config.buttonColor,
  borderColor: config.borderColor,
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  updateTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', colors.primaryColor);
  root.style.setProperty('--color-accent', colors.accentColor);
  root.style.setProperty('--color-bg', colors.backgroundColor);
  root.style.setProperty('--color-card-bg', colors.cardBackground);
  root.style.setProperty('--color-text', colors.textColor);
  root.style.setProperty('--color-nav', colors.navColor);
  root.style.setProperty('--color-button', colors.buttonColor);
  root.style.setProperty('--color-border', colors.borderColor);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);

  useEffect(() => {
    applyTheme(theme);

    // Try to load theme from DB
    supabase
      .from('theme_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const dbTheme: ThemeColors = {
            primaryColor: data.primary_color,
            accentColor: data.accent_color,
            backgroundColor: data.background_color,
            cardBackground: data.card_background,
            textColor: data.text_color,
            navColor: data.nav_color,
            buttonColor: data.button_color,
            borderColor: data.border_color,
          };
          setTheme(dbTheme);
          applyTheme(dbTheme);
        }
      });
  }, []);

  const updateTheme = useCallback((colors: Partial<ThemeColors>) => {
    setTheme((prev) => {
      const newTheme = { ...prev, ...colors };
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  const value = useMemo(() => ({ theme, updateTheme }), [theme, updateTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
