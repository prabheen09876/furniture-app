import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Package, Clock, Calendar, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

// Order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type Tables = Database['public']['Tables'];
type OrderRow = Tables['orders']['Row'];
type OrderItemRow = Tables['order_items']['Row'];
type ProductRow = Tables['products']['Row'];

// Order item interface
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
}

// Order interface
interface Order {
  id: string;
  user_id: string;
  order_number: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

// Status color mapping
const statusColors = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

// Status label mapping
const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/profile');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders from Supabase
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        // Fetch order items for each order with product details
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            // Fetch order items with product details
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id,
                product_id,
                quantity,
                price,
                products (
                  name,
                  image_url
                )
              `)
              .eq('order_id', order.id);

            if (itemsError) {
              console.error('Error fetching order items:', itemsError);
              return {
                ...order,
                items: [],
                status: order.status as OrderStatus
              } as Order;
            }

            // Format items with product details
            const formattedItems = (itemsData || []).map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              product_name: item.products?.name || 'Unknown Product',
              product_image: item.products?.image_url,
            }));

            return {
              ...order,
              items: formattedItems,
              status: order.status as OrderStatus
            } as Order;
          })
        );

        setOrders(ordersWithItems);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Navigate to order details
  const handleOrderPress = (orderId: string) => {
    // For now, just log the order ID
    console.log('View order details:', orderId);
    // In the future, implement order details page
    // router.push(`/orders/${orderId}`);
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Package size={64} color="#8B7355" strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        Your order history will appear here once you make a purchase.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  // Render order card
  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => handleOrderPress(order.id)}
    >
      <BlurView intensity={40} style={styles.orderCardInner}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.order_number || `Order #${order.id.slice(-6)}`}</Text>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="#8B7355" strokeWidth={1.5} />
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColors[order.status]}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColors[order.status] },
              ]}
            >
              {statusLabels[order.status]}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderSummary}>
          <Text style={styles.itemsCount}>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.orderTotal}>₹{order.total_amount.toFixed(2)}</Text>
        </View>

        {order.status === 'shipped' && order.tracking_number && (
          <View style={styles.trackingContainer}>
            <View style={styles.trackingInfo}>
              <Clock size={14} color="#8B7355" strokeWidth={1.5} />
              <Text style={styles.trackingText}>
                Estimated delivery: {order.estimated_delivery || 'In transit'}
              </Text>
            </View>
            <Text style={styles.trackingNumber}>
              Tracking: {order.tracking_number}
            </Text>
          </View>
        )}

        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <ChevronRight size={16} color="#2D1B16" strokeWidth={1.5} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#2D1B16" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D1B16" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error}. Please try again later.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {orders.map(renderOrderCard)}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2D1B16',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#2D1B16',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    marginVertical: 12,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: '#8B7355',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  trackingContainer: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackingText: {
    fontSize: 14,
    color: '#2D1B16',
    marginLeft: 6,
  },
  trackingNumber: {
    fontSize: 12,
    color: '#8B7355',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginRight: 4,
  },
});
