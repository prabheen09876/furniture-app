import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CircleCheck as CheckCircle, 
  Truck, 
  Circle as XCircle,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Share as ShareIcon,
  FileText,
  Edit,
  Save,
  History,
  MessageSquare
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

// Status colors and icons from the orders page
const statusColors = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#10B981',
  delivered: '#059669',
  cancelled: '#EF4444',
  refunded: '#6B7280',
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: DollarSign,
};

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    image_url: string;
  } | null;
  name?: string;
  image_url?: string;
};

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  subtotal: number;
  subtotal_amount?: number;
  tax_amount: number;
  shipping_amount: number;
  shipping_fee?: number;
  discount_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  user_id: string;
  profiles?: Profile;
  order_items: OrderItem[];
  admin_notes?: string;
  notes?: string;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  order_number: string;
  shipping_address: any;
  billing_address?: any;
  currency?: string;
};

type Profile = {
  full_name: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D1B16',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  spinner: {
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2D1B16',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  returnButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2D1B16',
    borderRadius: 8,
    marginTop: 10,
  },
  returnButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  orderSummary: {
    margin: 15,
    marginTop: 5,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B16',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.2)',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B16',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  section: {
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(45, 27, 22, 0.1)',
    borderRadius: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginLeft: 5,
  },
  customerInfo: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderRadius: 14,
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 70,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
  },
  addressText: {
    lineHeight: 20,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginLeft: 5,
  },
  historyList: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    padding: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 114, 128, 0.1)',
  },
  historyOrderNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2D1B16',
    flex: 1,
  },
  historyOrderDate: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  historyOrderTotal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2D1B16',
    flex: 1,
    textAlign: 'right',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginLeft: 5,
  },
  shippingInfo: {
    width: '100%',
  },
  notesContainer: {
    marginTop: 12,
    width: '100%',
  },
  notesLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  notesInput: {
    width: '100%',
    minHeight: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
    padding: 10,
    fontSize: 14,
    color: '#2D1B16',
    textAlignVertical: 'top',
  },
  itemsList: {
    width: '100%',
  },
  orderItem: {
    paddingVertical: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B16',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    marginTop: 10,
  },
  orderSummaryFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.1)',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLineLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLineValue: {
    fontSize: 14,
    color: '#2D1B16',
  },
  discountText: {
    color: '#059669',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.1)',
  },
  totalLineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  totalLineValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B16',
  }
});

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const orderId = typeof id === 'string' ? id : id ? id[0] : '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [customerHistory, setCustomerHistory] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order with order items and profile details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              name,
              image_url
            )
          ),
          profiles!user_id (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Order fetch error:', orderError);
        // If profiles relationship fails, try without it
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              unit_price,
              total_price,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('id', orderId)
          .single();
          
        if (fallbackError) throw fallbackError;
        
        // Fetch profile separately
        if (fallbackData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone, avatar_url')
            .eq('id', fallbackData.user_id)
            .single();
            
          if (profileData) {
            fallbackData.profiles = profileData;
          }
        }
        
        if (fallbackData) {
          const formattedOrder = {
            ...fallbackData,
            order_number: fallbackData.order_number || `ORD-${fallbackData.id.substring(0, 8).toUpperCase()}`,
            subtotal_amount: fallbackData.subtotal || fallbackData.subtotal_amount || fallbackData.total_amount,
            shipping_fee: fallbackData.shipping_amount || fallbackData.shipping_fee || 0,
            notes: fallbackData.notes || fallbackData.admin_notes || '',
          } as unknown as Order;
          
          setOrder(formattedOrder);
          setTrackingNumber(formattedOrder.tracking_number || '');
          setEstimatedDelivery(formattedOrder.estimated_delivery ? 
            new Date(formattedOrder.estimated_delivery).toISOString().split('T')[0] : '');
          setNotes(formattedOrder.notes || '');
          
          // Fetch customer order history
          if (fallbackData.user_id) {
            fetchCustomerHistory(fallbackData.user_id, orderId);
          }
        }
      } else if (orderData) {
        const formattedOrder = {
          ...orderData,
          order_number: orderData.order_number || `ORD-${orderData.id.substring(0, 8).toUpperCase()}`,
          subtotal_amount: orderData.subtotal || orderData.subtotal_amount || orderData.total_amount,
          shipping_fee: orderData.shipping_amount || orderData.shipping_fee || 0,
          notes: orderData.notes || orderData.admin_notes || '',
        } as unknown as Order;
        
        setOrder(formattedOrder);
        setTrackingNumber(formattedOrder.tracking_number || '');
        setEstimatedDelivery(formattedOrder.estimated_delivery ? 
          new Date(formattedOrder.estimated_delivery).toISOString().split('T')[0] : '');
        setNotes(formattedOrder.notes || '');
        
        // Fetch customer order history
        if (orderData.user_id) {
          fetchCustomerHistory(orderData.user_id, orderId);
        }
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      Alert.alert(
        'Error Loading Order', 
        'Failed to load order details. Please check if the database tables are properly set up.\n\nError: ' + (error.message || 'Unknown error'),
        [
          { text: 'Go Back', onPress: () => router.back() },
          { text: 'Retry', onPress: fetchOrderDetails }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (userId: string, currentOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .neq('id', currentOrderId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        const formattedOrders = data.map(order => ({
          ...order,
          order_number: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
        })) as unknown as Order[];
        
        setCustomerHistory(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
    }
  };

  const updateOrderInfo = async () => {
    try {
      const updateData = {
        tracking_number: trackingNumber,
        estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
        notes: notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      Alert.alert('Success', 'Order information updated successfully');
      setEditMode(false);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order information');
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Generate tracking number when order is shipped
      if (newStatus === 'shipped' && !order?.tracking_number) {
        const trackingNum = `TRK${Date.now().toString().slice(-8)}`;
        updateData.tracking_number = trackingNum;
        setTrackingNumber(trackingNum);
        
        // Set estimated delivery (7 days from now)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        updateData.estimated_delivery = deliveryDate.toISOString();
        setEstimatedDelivery(deliveryDate.toISOString().split('T')[0]);
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      
      // Send push notification to customer
      if (order.user_id) {
        try {
          // Import notification service dynamically
          const notificationService = require('@/services/notificationService').default;
          await notificationService.sendOrderNotification(
            order.id,
            newStatus,
            undefined,
            order.user_id
          );
          
          // Also save notification to database
          await supabase
            .from('user_notifications')
            .insert({
              user_id: order.user_id,
              title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
              body: `Your order #${order.order_number} has been ${newStatus}.`,
              type: 'order_update',
              data: { order_id: order.id, status: newStatus },
              read: false
            });
        } catch (notifError) {
          console.log('Notification error (non-critical):', notifError);
        }
      }
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
      fetchOrderDetails();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const shareOrderDetails = async () => {
    if (!order) return;
    
    try {
      const orderDetails = `
Order: ${order.order_number}
Status: ${order.status}
Customer: ${order.profiles?.full_name || order.profiles?.email || 'N/A'}
Items: ${order.order_items.length}
Total: ₹${order.total_amount}
Date: ${new Date(order.created_at).toLocaleDateString()}
${order.tracking_number ? `Tracking: ${order.tracking_number}` : ''}
`;

      await Share.share({
        message: orderDetails,
        title: `Order ${order.order_number} Details`
      });
    } catch (error) {
      console.error('Error sharing order details:', error);
    }
  };

  const contactCustomer = () => {
    if (!order?.profiles?.email) {
      Alert.alert('Error', 'Customer email not available');
      return;
    }
    
    Alert.alert(
      'Contact Customer',
      `Send email to ${order.profiles.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Email', onPress: () => {
          // In a real app, would integrate with email sending API or open email app
          Alert.alert('Feature Coming Soon', 'Email functionality will be available in the next update.');
        }}
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#F5F0E8', '#E8D5C0']} 
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Package size={48} color="#8B7355" strokeWidth={1.5} />
          <ActivityIndicator size="large" color="#2D1B16" style={styles.spinner} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient 
        colors={['#F5F0E8', '#E8D5C0']} 
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <XCircle size={48} color="#DC2626" strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>The order you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>Return to Orders</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
  const statusColor = statusColors[order.status as keyof typeof statusColors];

  return (
    <LinearGradient 
      colors={['#F5F0E8', '#E8D5C0']} 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <TouchableOpacity style={styles.actionIcon} onPress={shareOrderDetails}>
          <ShareIcon size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Order Header */}
        <BlurView intensity={40} style={styles.orderSummary}>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumberText}>{order.order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <StatusIcon size={14} color={statusColor} strokeWidth={2} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{order.order_items.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>{order.payment_status}</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.total_amount}</Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {order.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#059669' }]}
                  onPress={() => updateOrderStatus('confirmed')}
                >
                  <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
                  onPress={() => updateOrderStatus('cancelled')}
                >
                  <XCircle size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => updateOrderStatus('processing')}
              >
                <Package size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.actionButtonText}>Process</Text>
              </TouchableOpacity>
            )}
            {order.status === 'processing' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => updateOrderStatus('shipped')}
              >
                <Truck size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.actionButtonText}>Ship</Text>
              </TouchableOpacity>
            )}
            {order.status === 'shipped' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#059669' }]}
                onPress={() => updateOrderStatus('delivered')}
              >
                <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.actionButtonText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2D1B16' }]}
              onPress={() => setEditMode(!editMode)}
            >
              <Edit size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.actionButtonText}>
                {editMode ? 'Cancel Edit' : 'Edit Details'}
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Customer Info */}
        <BlurView intensity={40} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={contactCustomer}
            >
              <MessageSquare size={16} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.customerInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FileText size={16} color="#8B7355" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{order.profiles?.full_name || 'Not provided'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={16} color="#8B7355" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{order.profiles?.email}</Text>
            </View>
            
            {order.profiles?.phone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Phone size={16} color="#8B7355" strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{order.profiles.phone}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => setShowHistory(!showHistory)}
            >
              <History size={16} color="#2D1B16" strokeWidth={2} />
              <Text style={styles.historyButtonText}>
                {showHistory ? 'Hide Order History' : 'Show Order History'}
              </Text>
            </TouchableOpacity>
            
            {showHistory && customerHistory.length > 0 && (
              <View style={styles.historyList}>
                <Text style={styles.historyTitle}>Previous Orders ({customerHistory.length})</Text>
                {customerHistory.map(historyOrder => (
                  <TouchableOpacity 
                    key={historyOrder.id}
                    style={styles.historyItem}
                    onPress={() => {
                      router.push(`/admin/order-details/${historyOrder.id}`);
                    }}
                  >
                    <Text style={styles.historyOrderNumber}>
                      {historyOrder.order_number}
                    </Text>
                    <Text style={styles.historyOrderDate}>
                      {new Date(historyOrder.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyOrderTotal}>
                      ₹{historyOrder.total_amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {showHistory && customerHistory.length === 0 && (
              <Text style={styles.noHistoryText}>No previous orders found</Text>
            )}
          </View>
        </BlurView>

        {/* Shipping Info */}
        <BlurView intensity={40} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Information</Text>
            {editMode && (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={updateOrderInfo}
              >
                <Save size={16} color="#2D1B16" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.shippingInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MapPin size={16} color="#8B7355" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={[styles.infoValue, styles.addressText]}>
                {order.shipping_address || 'No address provided'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Truck size={16} color="#8B7355" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Tracking:</Text>
              {editMode ? (
                <TextInput
                  style={styles.editInput}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                  placeholder="Enter tracking number"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {order.tracking_number || 'Not available'}
                </Text>
              )}
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Clock size={16} color="#8B7355" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Delivery:</Text>
              {editMode ? (
                <TextInput
                  style={styles.editInput}
                  value={estimatedDelivery}
                  onChangeText={setEstimatedDelivery}
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {order.estimated_delivery 
                    ? new Date(order.estimated_delivery).toLocaleDateString() 
                    : 'Not available'}
                </Text>
              )}
            </View>
            
            {editMode && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Admin Notes:</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about this order"
                  multiline
                />
              </View>
            )}
          </View>
        </BlurView>

        {/* Order Items */}
        <BlurView intensity={40} style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          
          <View style={styles.itemsList}>
            {order.order_items.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {item.products?.name || 'Product Name Missing'}
                  </Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemPrice}>
                    ₹{item.unit_price} per item
                  </Text>
                  <Text style={styles.itemTotalPrice}>
                    ₹{item.total_price}
                  </Text>
                </View>
                
                {index < order.order_items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.orderSummaryFooter}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Subtotal:</Text>
              <Text style={styles.summaryLineValue}>
                ₹{order.subtotal_amount || order.total_amount}
              </Text>
            </View>
            
            {order.tax_amount > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Tax:</Text>
                <Text style={styles.summaryLineValue}>
                  ₹{order.tax_amount}
                </Text>
              </View>
            )}
            
            {order.shipping_fee > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Shipping:</Text>
                <Text style={styles.summaryLineValue}>
                  ₹{order.shipping_fee}
                </Text>
              </View>
            )}
            
            {order.discount_amount > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Discount:</Text>
                <Text style={[styles.summaryLineValue, styles.discountText]}>
                  -₹{order.discount_amount}
                </Text>
              </View>
            )}
            
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>Total:</Text>
              <Text style={styles.totalLineValue}>
                ₹{order.total_amount}
              </Text>
            </View>
          </View>
        </BlurView>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}
