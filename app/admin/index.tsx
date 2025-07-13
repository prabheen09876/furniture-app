import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Grid3x3, Settings, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/admin/settings' as any)}>
            <Settings size={20} color="#2D1B16" strokeWidth={2} />
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    width: (screenWidth - 50) / 2,
    marginRight: 10,
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
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
  },
  alertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: (screenWidth - 50) / 2,
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
});