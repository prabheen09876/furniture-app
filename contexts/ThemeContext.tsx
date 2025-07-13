import React, { createContext, useContext } from 'react';

interface ThemeType {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
}

const theme: ThemeType = {
  colors: {
    primary: '#6200ee',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#333333',
    border: '#e0e0e0',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

const ThemeContext = createContext(theme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
