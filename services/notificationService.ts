import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput;
}

class NotificationServiceSimple {
  private _receivedSubscription: any = null;
  private _responseSubscription: any = null;
  private expoPushToken: string | null = null;

  // Initialize notifications
  async initialize() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('deals', {
          name: 'Deals & Offers',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      // Get push token
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await this.saveTokenToDatabase(token, user.id);
        }
      }

      // Add notification listeners
      this.addNotificationListeners();
    } catch (error) {
      console.warn('Error initializing notifications:', error);
    }
  }

  // Register for push notifications
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
        if (!projectId) {
          console.log('Project ID not found');
          return;
        }

        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('Push token:', token);
      } catch (error) {
        console.log('Error getting push token:', error);
        token = null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Save token to database
  async saveTokenToDatabase(token: string, userId: string) {
    try {
      const deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { error: checkError } = await supabase
        .from('user_push_tokens')
        .select('id')
        .limit(1);

      if (checkError) {
        console.warn('Warning: user_push_tokens table might not exist:', checkError.message);
        console.warn('Please run the NOTIFICATION_SYSTEM_FIX.sql script in Supabase SQL Editor');
        return;
      }

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.warn('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.warn('Error in saveTokenToDatabase:', error);
    }
  }

  // Add notification listeners
  addNotificationListeners() {
    try {
      const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        this.updateBadgeCount();
      });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification clicked:', response);
        this.handleNotificationResponse(response);
      });

      this._receivedSubscription = receivedSubscription;
      this._responseSubscription = responseSubscription;
    } catch (error) {
      console.warn('Error setting up notification listeners:', error);
    }
  }

  // Handle notification response
  handleNotificationResponse(response: Notifications.NotificationResponse) {
    try {
      const data = response.notification.request.content.data;
      console.log('Handling notification response:', data);
      
      // Handle different notification types
      if (data?.type === 'order_update') {
        // Navigate to order details
        console.log('Navigate to order:', data.orderId);
      } else if (data?.type === 'deal') {
        // Navigate to deal details
        console.log('Navigate to deal:', data.dealId);
      }
    } catch (error) {
      console.warn('Error handling notification response:', error);
    }
  }

  // Send immediate notification
  async sendImmediateNotification(notification: NotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('Error sending immediate notification:', error);
    }
  }

  // Send push notification
  async sendPushNotification(expoPushToken: string, notification: NotificationData) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: 'high',
      channelId: notification.data?.type === 'order_update' ? 'orders' : 'default',
    };

    try {
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        console.log('Device is offline, skipping push notification');
        return;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.warn(`Push notification server responded with ${response.status}: ${response.statusText}`);
        return;
      }

      const result = await response.json();
      if (result.data?.status === 'error') {
        console.warn('Push notification error:', result.data.message);
      } else {
        console.log('Push notification sent successfully');
      }
    } catch (error) {
      console.warn('Error sending push notification:', error);
      this.sendImmediateNotification(notification);
    }
  }

  // Helper method to check connectivity
  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Send order notification
  async sendOrderNotification(orderId: string, status: string, message?: string, userId?: string) {
    try {
      const notification: NotificationData = {
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: message || `Your order #${orderId} status has been updated to ${status}`,
        data: {
          type: 'order_update',
          orderId: orderId,
          status: status,
        }
      };

      // Save to database if userId provided
      if (userId) {
        await this.saveNotificationToDatabase(userId, notification);
      }

      // Send immediate notification
      await this.sendImmediateNotification(notification);

      // Send push notification if token available
      if (this.expoPushToken) {
        await this.sendPushNotification(this.expoPushToken, notification);
      }
    } catch (error) {
      console.warn('Error sending order notification:', error);
    }
  }

  // Send deal notification
  async sendDealNotification(title: string, body: string, dealId?: string, scheduledTime?: Date) {
    try {
      const notification: NotificationData = {
        title,
        body,
        data: {
          type: 'deal',
          dealId: dealId,
        },
        trigger: scheduledTime ? { date: scheduledTime } : null,
      };

      if (scheduledTime) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: 'default',
          },
          trigger: { date: scheduledTime },
        });
      } else {
        await this.sendImmediateNotification(notification);
      }
    } catch (error) {
      console.warn('Error sending deal notification:', error);
    }
  }

  // Save notification to database
  private async saveNotificationToDatabase(userId: string, notification: NotificationData) {
    try {
      const { error: checkError } = await supabase
        .from('user_notifications')
        .select('id')
        .limit(1);

      if (checkError) {
        console.warn('Warning: user_notifications table might not exist:', checkError.message);
        return;
      }

      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          type: notification.data?.type || 'general',
          data: notification.data,
          read: false,
        });

      if (error) {
        console.warn('Error saving notification to database:', error);
      }
    } catch (error) {
      console.warn('Error in saveNotificationToDatabase:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    try {
      const { error: checkError } = await supabase
        .from('user_notifications')
        .select('id')
        .limit(1);

      if (checkError) {
        console.warn('Warning: user_notifications table might not exist:', checkError.message);
        console.warn('Please run the NOTIFICATION_SYSTEM_FIX.sql script in Supabase SQL Editor');
        return { data: [], error: checkError };
      }

      return await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    } catch (error) {
      console.warn('Error fetching user notifications:', error);
      return { data: [], error };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      return await supabase
        .from('user_notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (error) {
      console.warn('Error marking notification as read:', error);
      return { error };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string) {
    try {
      return await supabase
        .from('user_notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.warn('Error marking all notifications as read:', error);
      return { error };
    }
  }

  // Update badge count
  async updateBadgeCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);

      const count = data?.length || 0;
      await this.setBadgeCount(count);
      return count;
    } catch (error) {
      console.warn('Error updating badge count:', error);
    }
  }

  // Get push token
  getPushToken() {
    return this.expoPushToken;
  }

  // Clear all notifications
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clean up resources
  cleanup() {
    if (this._receivedSubscription) {
      this._receivedSubscription.remove();
    }
    if (this._responseSubscription) {
      this._responseSubscription.remove();
    }
  }
}

export default new NotificationServiceSimple();
