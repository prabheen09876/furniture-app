import React, { createContext, useContext, ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

type Theme = {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

const defaultTheme: Theme = {
  colors: {
    primary: '#FF6B47',
    background: '#FFFFFF',
    card: '#F8F8F8',
    text: '#2A2A2A',
    border: '#E0E0E0',
    notification: '#FF3B30',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
};

const ThemeContext = createContext<Theme>(defaultTheme);

type ThemeProviderProps = {
  children: ReactNode;
  theme?: Theme;
};

export function ThemeProvider({ children, theme = defaultTheme }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Helper types for themed styles
type ThemedStyle<T> = (theme: Theme) => StyleProp<T>;

export type ThemedViewStyle = ThemedStyle<ViewStyle>;
export type ThemedTextStyle = ThemedStyle<TextStyle>;
