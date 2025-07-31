import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Search, Package, Clock, CircleCheck as CheckCircle, Truck, Circle as XCircle, DollarSign } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Order = Database['public']['Tables']['orders']['Row'] & {
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      image_url: string;
    } | null;
  }>;
  order_number: string;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
};

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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      // First, get orders with order items
      const { data: ordersData, error: ordersError } = await supabase
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
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      console.log('Orders data:', ordersData);
      console.log('Orders count:', ordersData?.length || 0);

      // Then get profiles for each order
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', order.user_id)
            .single();

          return {
            ...order,
            order_number: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
            profiles: profileData
          };
        })
      );

      console.log('Final orders with profiles:', ordersWithProfiles);
      setOrders(ordersWithProfiles as unknown as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      let updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Generate tracking number when order is shipped
      if (newStatus === 'shipped') {
        const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
        updateData.tracking_number = trackingNumber;
        
        // Set estimated delivery (7 days from now)
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
        updateData.estimated_delivery = estimatedDelivery.toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, ...updateData } : order
      ));
      
      Alert.alert(
        'Success', 
        newStatus === 'shipped' 
          ? `Order marked as shipped. Tracking number: ${updateData.tracking_number}`
          : 'Order status updated successfully'
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusFilters = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
    { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed || 0 },
    { key: 'processing', label: 'Processing', count: statusCounts.processing || 0 },
    { key: 'shipped', label: 'Shipped', count: statusCounts.shipped || 0 },
    { key: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={40} style={styles.searchBar}>
          <Search size={20} color="#8B7355" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      {/* Status Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedStatus === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setSelectedStatus(filter.key)}
          >
            <BlurView intensity={40} style={styles.filterButtonInner}>
              <Text style={[
                styles.filterButtonText,
                selectedStatus === filter.key && styles.activeFilterButtonText
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.ordersContainer}>
          {loading ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#8B7355" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>Loading Orders...</Text>
              <Text style={styles.emptyStateText}>Please wait while we fetch your orders.</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#8B7355" strokeWidth={1.5} />
              <Text style={styles.emptyStateTitle}>No Orders Found</Text>
              <Text style={styles.emptyStateText}>
                {orders.length === 0 ? 'No orders have been placed yet.' : 'No orders match your current filter.'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
            const statusColor = statusColors[order.status as keyof typeof statusColors];
            
            return (
              <BlurView key={order.id} intensity={40} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.customerName}>
                      {order.profiles?.full_name || order.profiles?.email}
                    </Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.orderMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                      <StatusIcon size={12} color={statusColor} strokeWidth={2} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                  </View>
                </View>

                <View style={styles.orderItems}>
                  <Text style={styles.itemsLabel}>
                    {order.order_items.length} item(s)
                  </Text>
                  {order.order_items.slice(0, 2).map((item) => (
                    <Text key={item.id} style={styles.itemName}>
                      {item.quantity}x {item.products?.name}
                    </Text>
                  ))}
                  {order.order_items.length > 2 && (
                    <Text style={styles.moreItems}>
                      +{order.order_items.length - 2} more items
                    </Text>
                  )}
                </View>

                {/* Payment & Delivery Info */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment:</Text>
                    <Text style={styles.detailValue}>Pay on Delivery</Text>
                  </View>
                  {order.shipping_address && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Address:</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>
                        {order.shipping_address}
                      </Text>
                    </View>
                  )}
                  {order.tracking_number && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tracking:</Text>
                      <Text style={styles.detailValue}>{order.tracking_number}</Text>
                    </View>
                  )}
                  {order.estimated_delivery && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Est. Delivery:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(order.estimated_delivery).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.orderActions}>
                  {order.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        <Text style={styles.actionButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.processButton]}
                      onPress={() => updateOrderStatus(order.id, 'processing')}
                    >
                      <Text style={styles.actionButtonText}>Start Processing</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'processing' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.shipButton]}
                      onPress={() => updateOrderStatus(order.id, 'shipped')}
                    >
                      <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'shipped' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliverButton]}
                      onPress={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </BlurView>
            );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D1B16',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2D1B16',
  },
  filtersContainer: {
    paddingLeft: 20,
    marginBottom: -650,
  },
  filterButton: {
    marginRight: 12,
  },
  activeFilterButton: {},
  filterButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#2D1B16',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  ordersContainer: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  orderItems: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  orderDetails: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#2D1B16',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#059669',
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  processButton: {
    backgroundColor: '#8B5CF6',
  },
  shipButton: {
    backgroundColor: '#3B82F6',
  },
  deliverButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
});