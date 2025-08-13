import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import TabBar from './TabBar';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '../components/ErrorBoundary';
function LayoutContent() {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <View style={styles.content}>
                <Slot />
              </View>
              <TabBar onSearchPress={() => router.replace('/search')} />
              <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LayoutContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B47',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});