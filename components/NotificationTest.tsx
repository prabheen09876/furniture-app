import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import notificationService from '../services/notificationService';
import { supabase } from '../lib/supabase';

interface NotificationTestProps {}

const NotificationTest: React.FC<NotificationTestProps> = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Initialize notification service
      await notificationService.initialize();
      
      // Get push token
      const token = await notificationService.getPushToken();
      setPushToken(token);

      if (currentUser) {
        // Load user notifications
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error initializing notification test:', error);
      Alert.alert('Error', 'Failed to initialize notification test');
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await notificationService.getUserNotifications(user.id);
      if (error) {
        console.warn('Error loading notifications:', error);
        Alert.alert('Warning', 'Could not load notifications. Make sure to run NOTIFICATION_SYSTEM_FIX.sql in Supabase.');
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    setLoading(false);
  };

  const testLocalNotification = async () => {
    try {
      await notificationService.sendImmediateNotification({
        title: 'Test Local Notification',
        body: 'This is a test local notification from the Furniture Expo app!',
        data: { type: 'test', timestamp: Date.now() }
      });
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      console.error('Error sending local notification:', error);
      Alert.alert('Error', 'Failed to send local notification');
    }
  };

  const testPushNotification = async () => {
    if (!pushToken) {
      Alert.alert('Error', 'No push token available');
      return;
    }

    try {
      await notificationService.sendPushNotification(pushToken, {
        title: 'Test Push Notification',
        body: 'This is a test push notification!',
        data: { type: 'test_push', timestamp: Date.now() }
      });
      Alert.alert('Success', 'Push notification sent!');
    } catch (error) {
      console.error('Error sending push notification:', error);
      Alert.alert('Error', 'Failed to send push notification');
    }
  };

  const testOrderNotification = async () => {
    try {
      await notificationService.sendOrderNotification(
        'test_order_123',
        'shipped',
        'Your order has been shipped and is on its way!',
        user?.id
      );
      Alert.alert('Success', 'Order notification sent!');
      // Reload notifications to see the new one
      setTimeout(loadNotifications, 1000);
    } catch (error) {
      console.error('Error sending order notification:', error);
      Alert.alert('Error', 'Failed to send order notification');
    }
  };

  const testDealNotification = async () => {
    try {
      await notificationService.sendDealNotification(
        '🔥 Flash Sale Alert!',
        'Get 50% off on all furniture items. Limited time offer!',
        'deal_123'
      );
      Alert.alert('Success', 'Deal notification sent!');
    } catch (error) {
      console.error('Error sending deal notification:', error);
      Alert.alert('Error', 'Failed to send deal notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllNotificationsAsRead(user.id);
      Alert.alert('Success', 'All notifications marked as read');
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const updateBadgeCount = async () => {
    try {
      const count = await notificationService.updateBadgeCount();
      Alert.alert('Badge Updated', `Badge count: ${count || 0}`);
    } catch (error) {
      console.error('Error updating badge count:', error);
      Alert.alert('Error', 'Failed to update badge count');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Notification Test</Text>
        <Text style={styles.headerSubtitle}>
          Test notification functionality
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              User: {user ? user.email : 'Not logged in'}
            </Text>
            <Text style={styles.statusText}>
              Push Token: {pushToken ? '✅ Available' : '❌ Not available'}
            </Text>
            <Text style={styles.statusText}>
              Notifications: {notifications.length} loaded
            </Text>
          </View>
        </View>

        {/* Test Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testLocalNotification}>
            <Text style={styles.buttonText}>Test Local Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testPushNotification}>
            <Text style={styles.buttonText}>Test Push Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testOrderNotification}>
            <Text style={styles.buttonText}>Test Order Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testDealNotification}>
            <Text style={styles.buttonText}>Test Deal Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          
          <TouchableOpacity style={styles.managementButton} onPress={loadNotifications}>
            <Text style={styles.buttonText}>Reload Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementButton} onPress={markAllAsRead}>
            <Text style={styles.buttonText}>Mark All as Read</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementButton} onPress={updateBadgeCount}>
            <Text style={styles.buttonText}>Update Badge Count</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading notifications...</Text>
          ) : notifications.length > 0 ? (
            notifications.slice(0, 5).map((notification, index) => (
              <View key={notification.id || index} style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationMeta}>
                  {notification.read ? '✅ Read' : '🔔 Unread'} • {notification.type}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No notifications found</Text>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            1. Make sure you're logged in to test notifications{'\n'}
            2. Run NOTIFICATION_SYSTEM_FIX.sql in Supabase if you see database errors{'\n'}
            3. Local notifications work without internet{'\n'}
            4. Push notifications require a valid push token{'\n'}
            5. Check your device notification settings if notifications don't appear
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  testButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  managementButton: {
    backgroundColor: '#764ba2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default NotificationTest;
