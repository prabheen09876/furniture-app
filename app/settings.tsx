import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Lock,
  Moon,
  Settings,
  Shield,
  Trash2,
  ArrowLeft,
  User,
  Mail,
  Globe,
  HelpCircle,
  Star,
  LogOut
} from 'lucide-react-native';
import { router, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Handle notification toggle
  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    // In a real app, you would save this preference to the user's profile
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    toggleTheme();
  };

  // Handle password change
  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            if (!user?.email) return;
            
            setLoading(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(
                user.email,
                {
                  redirectTo: 'casa://reset-password',
                }
              );
              
              if (error) {
                throw error;
              }
              
              Alert.alert(
                'Reset Link Sent',
                'Check your email for a password reset link.'
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send reset link');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // In a real app, you would implement proper account deletion
              // This is just a placeholder for demonstration
              Alert.alert(
                'Account Deletion',
                'For security reasons, please contact support to delete your account.'
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render user profile section
  const renderUserProfile = () => (
    <BlurView intensity={25} tint="light" style={styles.profileCard}>
      <View style={styles.profileContent}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <User size={32} color="#2D1B16" strokeWidth={1.5} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.editProfileButton}>
          <Settings size={18} color="#2D1B16" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </BlurView>
  );

  // Render a settings section
  const renderSection = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );

  // Render a settings item with toggle
  const renderToggleItem = (
    icon: React.ReactNode,
    label: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onToggle} activeOpacity={0.8}>
      <BlurView intensity={25} tint="light" style={styles.settingCard}>
        <View style={styles.settingCardContent}>
          <View style={styles.settingItemLeft}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <Text style={styles.settingItemLabel}>{label}</Text>
          </View>
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E7EB', true: '#2D1B16' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  // Render a settings item with arrow
  const renderArrowItem = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.8}>
      <BlurView intensity={25} tint="light" style={styles.settingCard}>
        <View style={styles.settingCardContent}>
          <View style={styles.settingItemLeft}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <Text style={styles.settingItemLabel}>{label}</Text>
          </View>
          <ChevronRight size={20} color="#8B7355" strokeWidth={1.5} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  // Render a settings item with arrow
  const renderDangerItem = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.8}>
      <BlurView intensity={25} tint="light" style={styles.dangerCard}>
        <View style={styles.settingCardContent}>
          <View style={styles.settingItemLeft}>
            <View style={styles.dangerIconContainer}>
              {icon}
            </View>
            <Text style={styles.dangerItemLabel}>{label}</Text>
          </View>
          <ChevronRight size={20} color="#EF4444" strokeWidth={1.5} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  if (!user) {
    router.replace('/profile');
    return null;
  }

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      style={styles.container}
    >
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2D1B16" />
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2D1B16" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {renderUserProfile()}

        {renderSection('Preferences')}
        
        {renderToggleItem(
          <Bell size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Push Notifications',
          notificationsEnabled,
          () => handleNotificationToggle(!notificationsEnabled)
        )}
        
        {renderToggleItem(
          <Moon size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Dark Mode',
          isDarkMode,
          handleDarkModeToggle
        )}
        
        {renderSection('Account & Security')}
        
        {renderArrowItem(
          <Lock size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Change Password',
          handleChangePassword
        )}
        
        {renderArrowItem(
          <Shield size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Privacy & Security',
          () => Alert.alert('Privacy', 'Privacy settings would go here')
        )}
        
        {renderSection('General')}
        
        {renderArrowItem(
          <Globe size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Language',
          () => Alert.alert('Language', 'Language settings would go here')
        )}
        
        {renderArrowItem(
          <HelpCircle size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Help & Support',
          () => Alert.alert('Help', 'Help & Support would go here')
        )}
        
        {renderArrowItem(
          <Star size={20} color="#2D1B16" strokeWidth={1.5} />,
          'Rate App',
          () => Alert.alert('Rate App', 'Thank you for your feedback!')
        )}
        
        {renderSection('Danger Zone')}
        
        {renderDangerItem(
          <Trash2 size={20} color="#EF4444" strokeWidth={1.5} />,
          'Delete Account',
          handleDeleteAccount
        )}
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <BlurView intensity={25} tint="light" style={styles.signOutCard}>
            <View style={styles.signOutContent}>
              <LogOut size={20} color="#2D1B16" strokeWidth={1.5} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </BlurView>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Casa Furniture v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 16,
    color: '#2D1B16',
    fontFamily: 'Inter-Bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Profile Section
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8D5C4',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  profileEmail: {
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Regular',
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section Headers
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  // Setting Items
  settingItem: {
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1B16',
    fontFamily: 'Inter-Medium',
  },
  // Danger Zone
  dangerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 245, 245, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dangerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
  },
  // Sign Out Button
  signOutButton: {
    marginTop: 30,
    marginBottom: 20,
  },
  signOutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  // Version
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#8B7355',
    fontFamily: 'Inter-Regular',
  },
});
