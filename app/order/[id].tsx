import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Package, Clock, Calendar, MapPin, Truck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/lib/database.types';

// Order status types
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type Tables = Database['public']['Tables'];
type OrderRow = Tables['orders']['Row'];
type OrderItemRow = Tables['order_items']['Row'];
type ProfileRow = Tables['profiles']['Row'];

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
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
  profile?: {
    full_name: string;
    email: string;
  };
}

// Status color mapping
const statusColors = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#10B981',
  delivered: '#059669',
  cancelled: '#EF4444',
};

// Status label mapping
const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/profile');
      return;
    }

    if (id) {
      fetchOrderDetails(id as string);
    }
  }, [id, user]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw orderError;
      }

      if (!orderData) {
        throw new Error('Order not found');
      }

      // Check if the order belongs to the current user
      if (orderData.user_id !== user?.id) {
        throw new Error('You do not have permission to view this order');
      }

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
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', orderData.user_id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile:', profileError);
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

      // Format order with items and profile
      const formattedOrder: Order = {
        ...orderData,
        status: orderData.status as OrderStatus,
        items: formattedItems,
        profile: profileData || undefined,
      };

      setOrder(formattedOrder);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: OrderStatus) => {
    return statusColors[status] || '#8B7355';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return statusLabels[status] || status;
  };

  const renderOrderItems = () => {
    if (!order || !order.items || order.items.length === 0) {
      return (
        <View style={styles.emptyItems}>
          <Text style={styles.emptyItemsText}>No items found</Text>
        </View>
      );
    }

    return order.items.map((item) => (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemImageContainer}>
          {item.product_image ? (
            <Image
              source={{ uri: item.product_image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.noImage]}>
              <Package size={24} color="#8B7355" />
            </View>
          )}
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
        </View>
        <Text style={styles.itemTotal}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
      </View>
    ));
  };

  const renderTrackingInfo = () => {
    if (!order || !order.tracking_number) return null;

    return (
      <View style={styles.trackingContainer}>
        <View style={styles.trackingHeader}>
          <Truck size={18} color="#2D1B16" />
          <Text style={styles.trackingTitle}>Tracking Information</Text>
        </View>
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingLabel}>Tracking Number:</Text>
          <Text style={styles.trackingValue}>{order.tracking_number}</Text>
        </View>
        {order.estimated_delivery && (
          <View style={styles.trackingInfo}>
            <Text style={styles.trackingLabel}>Estimated Delivery:</Text>
            <Text style={styles.trackingValue}>
              {formatDate(order.estimated_delivery)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#F5F0E8', '#E1D4C3']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D1B16" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#F5F0E8', '#E1D4C3']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => id && fetchOrderDetails(id as string)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!order) {
    return (
      <LinearGradient
        colors={['#F5F0E8', '#E1D4C3']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#F5F0E8', '#E1D4C3']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#2D1B16" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <BlurView intensity={20} tint="light" style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumberLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>{order.order_number}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) },
                  ]}
                >
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.orderMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#8B7355" />
              <Text style={styles.metaText}>
                Ordered on {formatDate(order.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
          </View>

          <View style={styles.itemsContainer}>{renderOrderItems()}</View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>

          <View style={styles.addressContainer}>
            <MapPin size={16} color="#8B7355" style={styles.addressIcon} />
            <Text style={styles.address}>{order.shipping_address}</Text>
          </View>

          {renderTrackingInfo()}

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.shipping_amount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.tax_amount)}
              </Text>
            </View>
            {order.discount_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>
                  -{formatCurrency(order.discount_amount)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.total_amount)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.paymentMethodText}>Pay on Delivery</Text>
          </View>
        </BlurView>
      </ScrollView>
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
  placeholder: {
    width: 40,
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
  orderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderMeta: {
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    marginVertical: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  itemsContainer: {
    marginBottom: 8,
  },
  emptyItems: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#8B7355',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    alignSelf: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#2D1B16',
    lineHeight: 20,
  },
  trackingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 8,
  },
  trackingInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 14,
    color: '#8B7355',
    width: 120,
  },
  trackingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8B7355',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2D1B16',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  paymentMethod: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#2D1B16',
    fontWeight: '500',
  },
});
