import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  UserCheck, 
  Shield,
  Mail,
  Phone,
  MapPin
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  order_count?: number;
  total_spent?: number;
  is_admin?: boolean;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with order statistics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('is_active', true);

      if (adminError) throw adminError;

      const adminIds = new Set(adminUsers?.map(admin => admin.id) || []);

      // Fetch order statistics for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', profile.id)
            .eq('payment_status', 'paid');

          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

          return {
            ...profile,
            order_count: orderCount,
            total_spent: totalSpent,
            is_admin: adminIds.has(profile.id),
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    Alert.alert(
      'Make Admin',
      'Are you sure you want to grant admin access to this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('admin_users')
                .insert({
                  id: userId,
                  role: 'admin',
                  is_active: true,
                });

              if (error) throw error;
              
              setUsers(users.map(user => 
                user.id === userId ? { ...user, is_admin: true } : user
              ));
              
              Alert.alert('Success', 'User granted admin access');
            } catch (error) {
              console.error('Error making user admin:', error);
              Alert.alert('Error', 'Failed to grant admin access');
            }
          }
        }
      ]
    );
  };

  const removeAdmin = async (userId: string) => {
    Alert.alert(
      'Remove Admin',
      'Are you sure you want to remove admin access from this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', userId);

              if (error) throw error;
              
              setUsers(users.map(user => 
                user.id === userId ? { ...user, is_admin: false } : user
              ));
              
              Alert.alert('Success', 'Admin access removed');
            } catch (error) {
              console.error('Error removing admin access:', error);
              Alert.alert('Error', 'Failed to remove admin access');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.is_admin).length;
  const activeUsers = users.filter(user => (user.order_count || 0) > 0).length;

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2D1B16" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <BlurView intensity={40} style={styles.searchBar}>
          <Search size={20} color="#8B7355" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <BlurView intensity={40} style={styles.statCard}>
          <Users size={20} color="#4F46E5" strokeWidth={2} />
          <Text style={styles.statValue}>{totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <UserCheck size={20} color="#059669" strokeWidth={2} />
          <Text style={styles.statValue}>{activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </BlurView>
        
        <BlurView intensity={40} style={styles.statCard}>
          <Shield size={20} color="#DC2626" strokeWidth={2} />
          <Text style={styles.statValue}>{adminUsers}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </BlurView>
      </View>

      {/* Users List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.usersContainer}>
          {filteredUsers.map((user) => (
            <BlurView key={user.id} intensity={40} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>
                      {user.full_name || 'No name'}
                    </Text>
                    {user.is_admin && (
                      <View style={styles.adminBadge}>
                        <Shield size={12} color="#DC2626" strokeWidth={2} />
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.userDetail}>
                    <Mail size={12} color="#8B7355" strokeWidth={2} />
                    <Text style={styles.userDetailText}>{user.email}</Text>
                  </View>
                  
                  {user.phone && (
                    <View style={styles.userDetail}>
                      <Phone size={12} color="#8B7355" strokeWidth={2} />
                      <Text style={styles.userDetailText}>{user.phone}</Text>
                    </View>
                  )}
                  
                  {user.city && (
                    <View style={styles.userDetail}>
                      <MapPin size={12} color="#8B7355" strokeWidth={2} />
                      <Text style={styles.userDetailText}>{user.city}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{user.order_count || 0}</Text>
                  <Text style={styles.statItemLabel}>Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>${(user.total_spent || 0).toFixed(0)}</Text>
                  <Text style={styles.statItemLabel}>Spent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.statItemLabel}>Joined</Text>
                </View>
              </View>

              <View style={styles.userActions}>
                {user.is_admin ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeAdminButton]}
                    onPress={() => removeAdmin(user.id)}
                  >
                    <Text style={styles.actionButtonText}>Remove Admin</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.makeAdminButton]}
                    onPress={() => makeAdmin(user.id)}
                  >
                    <Text style={styles.actionButtonText}>Make Admin</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  scrollView: {
    flex: 1,
  },
  usersContainer: {
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D1B16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 4,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userDetailText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 2,
  },
  statItemLabel: {
    fontSize: 12,
    color: '#8B7355',
  },
  userActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  makeAdminButton: {
    backgroundColor: '#059669',
  },
  removeAdminButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});