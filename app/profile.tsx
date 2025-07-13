import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { User, Settings, ShoppingBag, Heart, CircleHelp as HelpCircle, LogOut, ChevronRight, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const menuItems = [
  { id: 'orders', title: 'My Orders', icon: ShoppingBag, action: () => {} },
  { id: 'settings', title: 'Settings', icon: Settings, action: () => {} },
  { id: 'help', title: 'Help & Support', icon: HelpCircle, action: () => {} },
];

export default function ProfileScreen() {
  const { user, signOut, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const { items: wishlistItems } = useWishlist();

  if (!user) {
    return (
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
        <View style={styles.authPrompt}>
          <User size={64} color="#8B7355" strokeWidth={1} />
          <Text style={styles.authTitle}>Welcome to Casa</Text>
          <Text style={styles.authSubtitle}>Sign in to access your profile and orders</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleAdminAccess = () => {
    router.push('/admin');
  };

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info */}
        <BlurView intensity={40} style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={32} color="#2D1B16" strokeWidth={2} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.email}</Text>
              <Text style={styles.userEmail}>
                {isAdmin ? 'Administrator' : 'Member since 2024'}
              </Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Shield size={12} color="#4F46E5" strokeWidth={2} />
                  <Text style={styles.adminBadgeText}>Admin Access</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <BlurView intensity={40} style={styles.statCard}>
            <Text style={styles.statNumber}>{getTotalItems()}</Text>
            <Text style={styles.statLabel}>Cart Items</Text>
          </BlurView>
          <BlurView intensity={40} style={styles.statCard}>
            <Text style={styles.statNumber}>{wishlistItems.length}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </BlurView>
          <BlurView intensity={40} style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </BlurView>
        </View>

        {/* Admin Access - Only show if user is admin */}
        {isAdmin && (
          <TouchableOpacity style={styles.adminButton} onPress={handleAdminAccess}>
            <BlurView intensity={40} style={styles.adminInner}>
              <View style={styles.adminLeft}>
                <View style={styles.adminIcon}>
                  <Shield size={20} color="#4F46E5" strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.adminText}>Admin Dashboard</Text>
                  <Text style={styles.adminSubtext}>Manage products, orders & users</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#8B7355" strokeWidth={2} />
            </BlurView>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
            >
              <BlurView intensity={40} style={styles.menuItemInner}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <item.icon size={20} color="#2D1B16" strokeWidth={2} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <ChevronRight size={16} color="#8B7355" strokeWidth={2} />
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <BlurView intensity={40} style={styles.signOutInner}>
            <View style={styles.signOutLeft}>
              <View style={styles.signOutIcon}>
                <LogOut size={20} color="#FF6B47" strokeWidth={2} />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </BlurView>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  adminButton: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  adminInner: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  adminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adminText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  adminSubtext: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1B16',
  },
  signOutButton: {
    paddingHorizontal: 20,
  },
  signOutInner: {
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.2)',
  },
  signOutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B47',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 8,
    marginTop: 20,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 32,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});