import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

class AdminNotificationService {
  // Send push notification to specific user
  async sendPushNotificationToUser(
    userId: string, 
    title: string, 
    body: string, 
    data?: any
  ): Promise<boolean> {
    try {
      // Get user's push tokens
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error || !tokens || tokens.length === 0) {
        console.log('No active push tokens found for user:', userId);
        return false;
      }

      // Send notification to all user's devices
      const messages = tokens.map(tokenData => ({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: data || {},
        badge: 1,
      }));

      // Send via Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);

      // Log to notification history
      await this.logNotificationHistory(title, body, 'user_specific', 1, 1, 0, data);

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send order status notification
  async sendOrderStatusNotification(orderData: OrderNotificationData): Promise<boolean> {
    try {
      // Get order details with user info
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('id', orderData.orderId)
        .single();

      if (error || !order) {
        console.error('Order not found:', orderData.orderId);
        return false;
      }

      // Generate notification content based on status
      const { title, body } = this.generateOrderNotificationContent(orderData);

      // Send push notification to user
      const success = await this.sendPushNotificationToUser(
        order.user_id,
        title,
        body,
        {
          type: 'order_update',
          orderId: orderData.orderId,
          status: orderData.status,
          trackingNumber: orderData.trackingNumber,
        }
      );

      return success;
    } catch (error) {
      console.error('Error sending order notification:', error);
      return false;
    }
  }

  // Generate notification content based on order status
  private generateOrderNotificationContent(orderData: OrderNotificationData): { title: string; body: string } {
    const { status, orderNumber, trackingNumber, estimatedDelivery } = orderData;

    switch (status) {
      case 'confirmed':
        return {
          title: '✅ Order Confirmed!',
          body: `Your order #${orderNumber} has been confirmed and is being prepared for processing.`
        };
      
      case 'processing':
        return {
          title: '📦 Order Processing',
          body: `Great news! Your order #${orderNumber} is now being processed and will be shipped soon.`
        };
      
      case 'shipped':
        return {
          title: '🚚 Order Shipped!',
          body: trackingNumber 
            ? `Your order #${orderNumber} has been shipped! Track with: ${trackingNumber}${estimatedDelivery ? `. Expected delivery: ${estimatedDelivery}` : ''}`
            : `Your order #${orderNumber} has been shipped and is on its way to you!`
        };
      
      case 'delivered':
        return {
          title: '🎉 Order Delivered!',
          body: `Your order #${orderNumber} has been successfully delivered. Thank you for shopping with us!`
        };
      
      case 'cancelled':
        return {
          title: '❌ Order Cancelled',
          body: `Your order #${orderNumber} has been cancelled. If you have any questions, please contact support.`
        };
      
      default:
        return {
          title: '📋 Order Update',
          body: `Your order #${orderNumber} status has been updated to: ${status}`
        };
    }
  }

  // Send bulk notifications to all users
  async sendBulkNotification(
    title: string, 
    body: string, 
    targetType: 'all' | 'active' = 'all',
    data?: any
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all active push tokens
      let query = supabase
        .from('user_push_tokens')
        .select('token, user_id')
        .eq('is_active', true);

      if (targetType === 'active') {
        // Get tokens for users who have been active in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        query = query.gte('updated_at', thirtyDaysAgo.toISOString());
      }

      const { data: tokens, error } = await query;

      if (error || !tokens || tokens.length === 0) {
        console.log('No push tokens found');
        return { success: 0, failed: 0 };
      }

      // Prepare messages
      const messages = tokens.map(tokenData => ({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: data || {},
        badge: 1,
      }));

      // Send in batches of 100 (Expo limit)
      const batchSize = 100;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batch),
          });

          const result = await response.json();
          
          if (result.data) {
            result.data.forEach((item: any) => {
              if (item.status === 'ok') {
                successCount++;
              } else {
                failedCount++;
              }
            });
          }
        } catch (batchError) {
          console.error('Batch send error:', batchError);
          failedCount += batch.length;
        }
      }

      // Log to notification history
      await this.logNotificationHistory(
        title, 
        body, 
        targetType, 
        tokens.length, 
        successCount, 
        failedCount, 
        data
      );

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Log notification to history
  private async logNotificationHistory(
    title: string,
    body: string,
    targetType: string,
    targetCount: number,
    successCount: number,
    failureCount: number,
    data?: any
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      await supabase
        .from('notification_history')
        .insert({
          title,
          body,
          data,
          target_type: targetType,
          target_count: targetCount,
          success_count: successCount,
          failure_count: failureCount,
          created_by: user.user?.id,
        });
    } catch (error) {
      console.error('Error logging notification history:', error);
    }
  }

  // Send notification to all admin users when new order is received
  async sendNewOrderNotificationToAdmins(orderData: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    itemCount: number;
  }): Promise<boolean> {
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (adminError || !adminUsers || adminUsers.length === 0) {
        console.log('No active admin users found');
        return false;
      }

      // Get push tokens for all admin users
      const adminUserIds = adminUsers.map(admin => admin.user_id);
      const { data: adminTokens, error: tokensError } = await supabase
        .from('user_push_tokens')
        .select('token, user_id')
        .in('user_id', adminUserIds)
        .eq('is_active', true);

      if (tokensError || !adminTokens || adminTokens.length === 0) {
        console.log('No active push tokens found for admin users');
        return false;
      }

      // Create notification content
      const title = '🛍️ New Order Received!';
      const body = `${orderData.customerName} placed an order worth ₹${orderData.totalAmount.toLocaleString()} (${orderData.itemCount} items)`;

      // Prepare messages for all admin devices
      const messages = adminTokens.map(tokenData => ({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: {
          type: 'new_order',
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          totalAmount: orderData.totalAmount,
          itemCount: orderData.itemCount,
          timestamp: new Date().toISOString(),
        },
        badge: 1,
        priority: 'high',
      }));

      // Send notifications
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Admin notification sent for new order:', result);

      // Log to notification history
      await this.logNotificationHistory(
        title,
        body,
        'admin_users',
        adminTokens.length,
        result.data?.filter((item: any) => item.status === 'ok').length || 0,
        result.data?.filter((item: any) => item.status !== 'ok').length || 0,
        {
          type: 'new_order',
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending new order notification to admins:', error);
      return false;
    }
  }

  // Send notification to admins for low stock alerts
  async sendLowStockNotificationToAdmins(productData: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
  }): Promise<boolean> {
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (adminError || !adminUsers || adminUsers.length === 0) {
        return false;
      }

      // Get push tokens for all admin users
      const adminUserIds = adminUsers.map(admin => admin.user_id);
      const { data: adminTokens, error: tokensError } = await supabase
        .from('user_push_tokens')
        .select('token')
        .in('user_id', adminUserIds)
        .eq('is_active', true);

      if (tokensError || !adminTokens || adminTokens.length === 0) {
        return false;
      }

      // Create notification content
      const title = '⚠️ Low Stock Alert';
      const body = `${productData.productName} is running low (${productData.currentStock} remaining)`;

      // Prepare messages
      const messages = adminTokens.map(tokenData => ({
        to: tokenData.token,
        sound: 'default',
        title,
        body,
        data: {
          type: 'low_stock',
          productId: productData.productId,
          productName: productData.productName,
          currentStock: productData.currentStock,
          timestamp: new Date().toISOString(),
        },
        badge: 1,
        priority: 'normal',
      }));

      // Send notifications
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Low stock notification sent to admins:', result);

      return true;
    } catch (error) {
      console.error('Error sending low stock notification to admins:', error);
      return false;
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    totalSent: number;
    todaySent: number;
    successRate: number;
    activeTokens: number;
  }> {
    try {
      // Get total notifications sent
      const { data: totalData } = await supabase
        .from('notification_history')
        .select('success_count, failure_count');

      const totalSent = totalData?.reduce((sum, item) => sum + item.success_count, 0) || 0;
      const totalFailed = totalData?.reduce((sum, item) => sum + item.failure_count, 0) || 0;
      const successRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

      // Get today's notifications
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('notification_history')
        .select('success_count')
        .gte('sent_at', today);

      const todaySent = todayData?.reduce((sum, item) => sum + item.success_count, 0) || 0;

      // Get active tokens count
      const { count: activeTokens } = await supabase
        .from('user_push_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalSent,
        todaySent,
        successRate: Math.round(successRate),
        activeTokens: activeTokens || 0,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalSent: 0,
        todaySent: 0,
        successRate: 0,
        activeTokens: 0,
      };
    }
  }
}

export default new AdminNotificationService();
