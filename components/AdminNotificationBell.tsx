import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Bell, X, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import adminNotificationService from '../services/adminNotificationService';

interface NotificationAlert {
  id: string;
  type: 'order_update' | 'low_stock' | 'new_order' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AdminNotificationBellProps {
  onNotificationPress?: (notification: NotificationAlert) => void;
}

export default function AdminNotificationBell({ onNotificationPress }: AdminNotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSent: 0,
    todaySent: 0,
    successRate: 0,
    activeTokens: 0,
  });

  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          handleNewOrder(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          handleOrderUpdate(payload.new, payload.old);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      // Generate mock notifications based on recent orders and activities
      const mockNotifications: NotificationAlert[] = [
        {
          id: '1',
          type: 'new_order',
          title: 'New Order Received',
          message: 'Order #ORD-12345 from John Doe - ₹15,000',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          read: false,
          priority: 'high',
        },
        {
          id: '2',
          type: 'order_update',
          title: 'Order Shipped',
          message: 'Order #ORD-12344 has been successfully shipped',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          read: false,
          priority: 'medium',
        },
        {
          id: '3',
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: 'Modern Sofa Set - Only 2 items remaining',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: true,
          priority: 'medium',
        },
        {
          id: '4',
          type: 'system',
          title: 'Daily Report Ready',
          message: 'Your daily sales report is ready for review',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          read: true,
          priority: 'low',
        },
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const stats = await adminNotificationService.getNotificationStats();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const handleNewOrder = (order: any) => {
    const newNotification: NotificationAlert = {
      id: `order-${order.id}-${Date.now()}`,
      type: 'new_order',
      title: '🛍️ New Order Received!',
      message: `${order.customer_name || 'Customer'} placed an order worth ₹${order.total_amount?.toLocaleString() || '0'}`,
      timestamp: new Date().toISOString(),
      read: false,
      orderId: order.id,
      priority: 'high',
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep only latest 50
    setUnreadCount(prev => prev + 1);
    
    // Also show a brief system notification
    console.log('🔔 New Order Alert:', newNotification.message);
  };

  const handleOrderUpdate = (newOrder: any, oldOrder: any) => {
    if (newOrder.status !== oldOrder.status) {
      const statusEmojis: { [key: string]: string } = {
        confirmed: '✅',
        processing: '📦',
        shipped: '🚚',
        delivered: '🎉',
        cancelled: '❌',
      };

      const newNotification: NotificationAlert = {
        id: `update-${newOrder.id}-${Date.now()}`,
        type: 'order_update',
        title: `${statusEmojis[newOrder.status] || '📋'} Order ${newOrder.status.charAt(0).toUpperCase() + newOrder.status.slice(1)}`,
        message: `Order #ORD-${newOrder.id.substring(0, 8).toUpperCase()} status updated to ${newOrder.status}`,
        timestamp: new Date().toISOString(),
        read: false,
        orderId: newOrder.id,
        priority: 'medium',
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package size={20} color="#3B82F6" />;
      case 'order_update':
        return <CheckCircle size={20} color="#10B981" />;
      case 'low_stock':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'system':
        return <Clock size={20} color="#6B7280" />;
      default:
        return <Bell size={20} color="#8B7355" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#6B7280';
      default:
        return '#8B7355';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={() => setModalVisible(true)}
      >
        <Bell size={24} color="#2D1B16" strokeWidth={2} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markAllAsRead}
                  >
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color="#2D1B16" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification Stats */}
            <View style={styles.statsContainer}>
              <View style={[styles.statsCard, styles.statsBackground]}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.totalSent}</Text>
                    <Text style={styles.statLabel}>Total Sent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.todaySent}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.successRate}%</Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.activeTokens}</Text>
                    <Text style={styles.statLabel}>Active Users</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#8B7355" strokeWidth={1} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification,
                    ]}
                    onPress={() => {
                      markAsRead(notification.id);
                      if (onNotificationPress) {
                        onNotificationPress(notification);
                      }
                    }}
                  >
                    <View style={[styles.notificationContent, styles.notificationBackground]}>
                      <View style={styles.notificationLeft}>
                        {getNotificationIcon(notification.type)}
                        <View style={styles.notificationText}>
                          <Text style={styles.notificationTitle}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationMessage}>
                            {notification.message}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatTimestamp(notification.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.priorityIndicator,
                          { backgroundColor: getPriorityColor(notification.priority) },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(172, 172, 172, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    color: '#2D1B16',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  statsCard: {
    borderRadius: 15,
    padding: 15,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 15,
  },
  notificationItem: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  unreadNotification: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  notificationBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  statsBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
});
