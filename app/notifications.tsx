import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Bell, Package, Tag, Settings, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Custom function to format relative time
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'promotion' | 'system';
  data?: any;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // @ts-ignore - Temporary fix until user_notifications table is created
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Notifications table not found, showing demo notifications:', error);
        // Show demo notifications until database is set up
        setNotifications([
          {
            id: '1',
            title: '🎉 Welcome to Kesarwala!',
            body: 'Thank you for joining us. Start exploring our amazing furniture collection.',
            type: 'system',
            read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: '📦 Database Setup Required',
            body: 'Apply the COMPLETE_DATABASE_FIX.sql to enable real notifications.',
            type: 'system',
            read: false,
            created_at: new Date(Date.now() - 60000).toISOString(),
          }
        ]);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // @ts-ignore - Temporary fix until user_notifications table is created
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.warn('Cannot mark as read - database not set up');
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.type === 'order' && notification.data?.order_id) {
      router.push(`/orders`);
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return Package;
      case 'promotion':
        return Tag;
      case 'system':
        return Settings;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#8B7355';
      case 'promotion':
        return '#D2691E';
      case 'system':
        return '#2D1B16';
      default:
        return '#8B7355';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const IconComponent = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        style={styles.notificationWrapper}
      >
        <BlurView intensity={40} style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}>
          <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(item.type)}15` }]}>
            <IconComponent size={20} color={getIconColor(item.type)} strokeWidth={2} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <BlurView intensity={40} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Stay updated with your orders</Text>
          </View>
          <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
            <Trash2 size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
        </BlurView>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Bell size={48} color="#8B7355" strokeWidth={1} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BlurView intensity={40} style={styles.emptyCard}>
              <Bell size={64} color="#8B7355" strokeWidth={1} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You'll see order updates and important information here
              </Text>
            </BlurView>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchNotifications}
                tintColor="#8B7355"
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1B16',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1B16',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B7355',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
    lineHeight: 22,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#A0937D',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B7355',
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
