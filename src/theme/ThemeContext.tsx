import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, radii, fonts, ThemeColors } from './tokens';

interface Theme {
  colors: ThemeColors;
  radii: typeof radii;
  fonts: typeof fonts;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const value = useMemo<Theme>(() => {
    const isDark = scheme !== 'light';
    return { colors: isDark ? dark : light, radii, fonts, isDark };
  }, [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used within ThemeProvider');
  return t;
}
