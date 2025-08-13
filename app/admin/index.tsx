import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Grid3x3, Settings, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle2, ArrowLeft, MessageCircle, ShoppingBag, Image, RefreshCw, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminNotificationBell from '@/components/AdminNotificationBell';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: number;
  activeProducts: number;
}

interface AnalyticsData {
  dailyOrders: number[];
  dailyRevenue: number[];
  topProducts: { name: string; sales: number }[];
  ordersByStatus: { status: string; count: number }[];
  userGrowth: number;
  conversionRate: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    recentOrders: 0,
    activeProducts: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyOrders: [],
    dailyRevenue: [],
    topProducts: [],
    ordersByStatus: [],
    userGrowth: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch last 7 days of orders
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .gte('created_at', sevenDaysAgo);

      // Process daily orders and revenue
      const dailyData: { [key: string]: { orders: number; revenue: number } } = {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      last7Days.forEach(date => {
        dailyData[date] = { orders: 0, revenue: 0 };
      });

      recentOrders?.forEach(order => {
        const date = order.created_at.split('T')[0];
        if (dailyData[date]) {
          dailyData[date].orders++;
          dailyData[date].revenue += Number(order.total_amount) || 0;
        }
      });

      const dailyOrders = last7Days.map(date => dailyData[date].orders);
      const dailyRevenue = last7Days.map(date => dailyData[date].revenue);

      // Fetch top products
      const { data: topProductsData } = await supabase
        .from('order_items')
        .select('product_id, quantity, products(name)')
        .limit(5);

      const productSales: { [key: string]: { name: string; sales: number } } = {};
      topProductsData?.forEach(item => {
        const productName = item.products?.name || 'Unknown';
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: productName, sales: 0 };
        }
        productSales[item.product_id].sales += item.quantity;
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Orders by status
      const statusCounts: { [key: string]: number } = {};
      recentOrders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Calculate user growth (new users in last 7 days vs previous 7 days)
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo);

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { count: previousUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gte('created_at', fourteenDaysAgo)
        .lt('created_at', sevenDaysAgo);

      const userGrowth = previousUsers ? ((newUsers! - previousUsers) / previousUsers) * 100 : 0;

      // Calculate conversion rate (orders / users)
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });
      
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact' });

      const conversionRate = totalUsers ? (totalOrders! / totalUsers) * 100 : 0;

      setAnalytics({
        dailyOrders,
        dailyRevenue,
        topProducts,
        ordersByStatus,
        userGrowth,
        conversionRate,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const resetAnalytics = async () => {
    Alert.alert(
      'Reset Analytics',
      'This will clear all analytics data and recalculate from the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            await fetchDashboardStats();
            await fetchAnalytics();
            setRefreshing(false);
            Alert.alert('Success', 'Analytics data has been reset and recalculated.');
          },
        },
      ]
    );
  };

  const fetchDashboardStats = async () => {
    try {
      const [
        productsResult,
        ordersResult,
        usersResult,
        revenueResult,
        pendingOrdersResult,
        lowStockResult,
        recentOrdersResult,
        activeProductsResult
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact' }).lt('stock_quantity', 10),
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue,
        pendingOrders: pendingOrdersResult.count || 0,
        lowStockProducts: lowStockResult.count || 0,
        recentOrders: recentOrdersResult.count || 0,
        activeProducts: activeProductsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Product',
      description: 'Create new product listing',
      icon: Package,
      color: '#4F46E5',
      route: '/admin/products',
      action: 'add'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: ShoppingCart,
      color: '#059669',
      route: '/admin/orders'
    },
    {
      title: 'Support Messages',
      description: 'Manage customer inquiries',
      icon: MessageCircle,
      color: '#8B5CF6',
      route: '/admin/support'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: Users,
      color: '#DC2626',
      route: '/admin/users'
    },
    {
      title: 'Categories',
      description: 'Organize products',
      icon: Grid3x3,
      color: '#7C2D12',
      route: '/admin/categories'
    },
    {
      title: 'Banner Management',
      description: 'Manage carousel banners',
      icon: Image,
      color: '#7C3AED',
      route: '/admin/banners'
    },
    {
      title: 'Notifications',
      description: 'Send push notifications',
      icon: Bell,
      color: '#F59E0B',
      route: '/admin/notifications'
    },
  ];

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: '#059669',
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: '#4F46E5',
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts.toString(),
      icon: Package,
      color: '#7C2D12',
      change: '+5.1%',
      trend: 'up'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: '#DC2626',
      change: '+15.3%',
      trend: 'up'
    },
  ];

  const alertCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      description: 'Orders awaiting processing',
      icon: Clock,
      color: '#F59E0B',
      urgent: stats.pendingOrders > 5
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      description: 'Products below 10 units',
      icon: AlertTriangle,
      color: '#EF4444',
      urgent: stats.lowStockProducts > 0
    },
    {
      title: 'Recent Orders',
      value: stats.recentOrders,
      description: 'Orders in last 7 days',
      icon: CheckCircle2,
      color: '#059669',
      urgent: false
    },
  ];

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {user?.email?.split('@')[0]}</Text>
          </View>
          <View style={styles.headerActions}>
            <AdminNotificationBell 
              onNotificationPress={(notification) => {
                if (notification.orderId) {
                  router.push(`/admin/order-details/${notification.orderId}`);
                } else if (notification.type === 'low_stock') {
                  router.push('/admin/products');
                }
              }}
            />
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={20} color="#2D1B16" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          {statCards.map((stat, index) => (
            <BlurView key={index} intensity={40} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={20} color={stat.color} strokeWidth={2} />
                </View>
                <View style={styles.statChange}>
                  <TrendingUp size={12} color="#059669" strokeWidth={2} />
                  <Text style={styles.changeText}>{stat.change}</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </BlurView>
          ))}
        </View>

        {/* Alert Cards */}
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>System Alerts</Text>
          <View style={styles.alertsGrid}>
            {alertCards.map((alert, index) => (
              <BlurView 
                key={index} 
                intensity={40} 
                style={[
                  styles.alertCard,
                  alert.urgent && styles.urgentAlert
                ]}
              >
                <View style={styles.alertHeader}>
                  <View style={[styles.alertIcon, { backgroundColor: `${alert.color}15` }]}>
                    <alert.icon size={16} color={alert.color} strokeWidth={2} />
                  </View>
                  {alert.urgent && <View style={styles.urgentDot} />}
                </View>
                <Text style={styles.alertValue}>{alert.value}</Text>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
              </BlurView>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
              >
                <BlurView intensity={40} style={styles.actionItemInner}>
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                    <action.icon size={24} color={action.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Analytics Section */}
        <View style={styles.actionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analytics Overview</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetAnalytics}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <RefreshCw size={18} color="#FFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          <BlurView intensity={40} style={styles.metricsCard}>
            {/* Daily Orders Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Last 7 Days Orders</Text>
              <View style={styles.miniChart}>
                {analytics.dailyOrders.map((value, index) => (
                  <View key={index} style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar,
                        { 
                          height: Math.max(5, (value / Math.max(...analytics.dailyOrders, 1)) * 60),
                          backgroundColor: '#4F46E5'
                        }
                      ]} 
                    />
                    <Text style={styles.barLabel}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Top Products */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Top Products</Text>
              {analytics.topProducts.slice(0, 3).map((product, index) => (
                <View key={index} style={styles.topProductItem}>
                  <Text style={styles.topProductName} numberOfLines={1}>
                    {index + 1}. {product.name}
                  </Text>
                  <Text style={styles.topProductSales}>{product.sales} sold</Text>
                </View>
              ))}
            </View>

            {/* Key Metrics */}
            <View style={styles.keyMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxValue}>
                  {analytics.userGrowth > 0 ? '+' : ''}{analytics.userGrowth.toFixed(1)}%
                </Text>
                <Text style={styles.metricBoxLabel}>User Growth</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricBoxValue}>
                  {analytics.conversionRate.toFixed(1)}%
                </Text>
                <Text style={styles.metricBoxLabel}>Conversion Rate</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <BlurView intensity={40} style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Text style={styles.metricsTitle}>Performance Overview</Text>
              <TouchableOpacity>
                <BarChart3 size={20} color="#4F46E5" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>94%</Text>
                <Text style={styles.metricLabel}>Order Fulfillment</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>4.8</Text>
                <Text style={styles.metricLabel}>Avg Rating</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>2.3d</Text>
                <Text style={styles.metricLabel}>Avg Delivery</Text>
              </View>
            </View>
          </BlurView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: screenWidth < 350 ? 12 : 16,
    width: screenWidth < 350 ? '100%' : (screenWidth - 40) / 2.05,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#8B7355',
  },
  alertsContainer: {
    paddingHorizontal: 4,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 16,
  },
  alertsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  alertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: screenWidth < 350 ? 12 : 16,
    width: screenWidth < 350 ? '100%' : (screenWidth - 40) / 2.05,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  urgentAlert: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  alertValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 10,
    color: '#8B7355',
  },
  actionsContainer: {
    paddingHorizontal: 4,
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: screenWidth < 350 ? '100%' : (screenWidth - 40) / 2.05,
    marginBottom: 16,
  },
  actionItemInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    color: '#8B7355',
    textAlign: 'center',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  metricsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B16',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D1B16',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  utilityButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  utilityButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 12,
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#8B7355',
  },
  topProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.1)',
  },
  topProductName: {
    flex: 1,
    fontSize: 13,
    color: '#2D1B16',
    marginRight: 8,
  },
  topProductSales: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
  keyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  metricBox: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    minWidth: 100,
  },
  metricBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 4,
  },
  metricBoxLabel: {
    fontSize: 11,
    color: '#8B7355',
    textAlign: 'center',
  },
});