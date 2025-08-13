import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  sendOrderNotification: (orderId: string, status: string, message?: string) => Promise<void>;
  sendDealNotification: (title: string, body: string, dealId?: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  badgeCount: number;
  setBadgeCount: (count: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [badgeCount, setBadgeCountState] = useState(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Initialize notification service
    initializeNotifications();

    // Subscribe to order updates if user is logged in
    if (user) {
      cleanup = subscribeToOrderUpdates();
    }

    return () => {
      // Cleanup subscriptions
      if (cleanup) {
        cleanup();
      }
    };
  }, [user]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      
      // Load user notification preferences
      if (user) {
        const { data } = await supabase
          .from('user_notification_preferences')
          .select('orders_updates, promotions, app_updates')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setNotificationsEnabled(data.orders_updates ?? true);
        }
      }

      // Get initial badge count
      const count = await notificationService.getBadgeCount();
      setBadgeCountState(count);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const subscribeToOrderUpdates = () => {
    // Subscribe to order status changes
    const subscription = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user?.id}`,
        },
        async (payload) => {
          const { new: newOrder, old: oldOrder } = payload;
          
          // Check if status changed
          if (newOrder.status !== oldOrder.status && notificationsEnabled) {
            await notificationService.sendOrderNotification(
              newOrder.id,
              newOrder.status
            );
            
            // Update badge count
            const count = await notificationService.getBadgeCount();
            setBadgeCountState(count + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);
      
      // Save preference to database
      if (user) {
        await supabase
          .from('user_notification_preferences')
          .upsert({
            user_id: user.id,
            orders_updates: enabled,
            promotions: enabled,
            app_updates: enabled,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const sendOrderNotification = async (orderId: string, status: string, message?: string) => {
    if (notificationsEnabled) {
      await notificationService.sendOrderNotification(orderId, status, message);
    }
  };

  const sendDealNotification = async (title: string, body: string, dealId?: string) => {
    if (notificationsEnabled) {
      await notificationService.sendDealNotification(title, body, dealId);
    }
  };

  const clearNotifications = async () => {
    await notificationService.clearAllNotifications();
    await setBadgeCount(0);
  };

  const setBadgeCount = async (count: number) => {
    await notificationService.setBadgeCount(count);
    setBadgeCountState(count);
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        toggleNotifications,
        sendOrderNotification,
        sendDealNotification,
        clearNotifications,
        badgeCount,
        setBadgeCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
