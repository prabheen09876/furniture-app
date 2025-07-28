import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  textLight: string;
  cardBackground: string;
  gradientStart: string;
  gradientEnd: string;
}

interface ThemeType {
  colors: ThemeColors;
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
  isDark: boolean;
}

const lightTheme: ThemeType = {
  colors: {
    primary: '#2D1B16',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#2D1B16',
    border: '#E0E0E0',
    textLight: '#8B7355',
    cardBackground: 'rgba(255, 255, 255, 0.4)',
    gradientStart: '#F5E6D3',
    gradientEnd: '#E8D5C4',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  isDark: false,
};

const darkTheme: ThemeType = {
  colors: {
    primary: '#E8D5C4',
    background: '#1A1A1A',
    card: '#2D2D2D',
    text: '#F5E6D3',
    border: '#444444',
    textLight: '#B8A99D',
    cardBackground: 'rgba(45, 45, 45, 0.7)',
    gradientStart: '#2D1B16',
    gradientEnd: '#1A1A1A',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  isDark: true,
};

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: lightTheme,
  toggleTheme: () => {},
  isDarkMode: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePref');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          // If no stored preference, use device preference
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Default to device preference if storage fails
        setIsDarkMode(colorScheme === 'dark');
      }
    };
    
    loadThemePreference();
  }, [colorScheme]);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themePref', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Current theme based on mode
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
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
