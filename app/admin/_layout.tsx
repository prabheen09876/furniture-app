import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading) return;
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      if (!isAdmin) {
        router.replace('/');
        return;
      }

      setChecking(false);
    };

    checkAccess();
  }, [user, isAdmin, loading]);

  if (loading || checking) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Checking admin access...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.unauthorized}>
          <Text style={styles.unauthorizedText}>Authentication Required</Text>
          <Text style={styles.unauthorizedSubtext}>Please sign in to continue.</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.unauthorized}>
          <Text style={styles.unauthorizedText}>Unauthorized Access</Text>
          <Text style={styles.unauthorizedSubtext}>
            You don't have permission to access the admin panel.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="users" />
      <Stack.Screen name="categories" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2D1B16',
  },
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unauthorizedText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF3B30',
    textAlign: 'center',
  },
  unauthorizedSubtext: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
  },
});