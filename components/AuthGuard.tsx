import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Wait for auth loading to complete before making navigation decisions
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAdminGroup = segments[0] === 'admin';

    // If user is not authenticated and not on auth screen, redirect to auth
    if (!user && !inAuthGroup) {
      console.log('User not authenticated, redirecting to auth');
      setIsNavigationReady(false);
      router.replace('/auth');
      return;
    }

    // If user is authenticated and on auth screen, redirect to home
    if (user && inAuthGroup) {
      console.log('User authenticated, redirecting to home');
      setIsNavigationReady(false);
      router.replace('/');
      return;
    }

    // Navigation is ready
    console.log('Navigation ready, user:', user?.email || 'none', 'segments:', segments);
    setIsNavigationReady(true);
  }, [user, loading, segments]);

  // Show loading screen while auth is being determined or navigation is happening
  if (loading || !isNavigationReady) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2D1B16" />
        </View>
      </LinearGradient>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 20,
  },
});
