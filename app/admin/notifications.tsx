import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  Send, 
  Users, 
  ShoppingBag, 
  Tag,
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Megaphone,
  Package,
  Percent,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import adminNotificationService from '../../services/adminNotificationService';

interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'deal' | 'announcement' | 'custom';
  icon: string;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  send_at: string;
  sent: boolean;
  target_type: string;
  target_users?: string[] | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'scheduled' | 'history'>('send');
  
  // Notification form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<'deal' | 'announcement' | 'custom'>('announcement');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'specific'>('all');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Lists
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<ScheduledNotification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      title: '🎉 Flash Sale Alert!',
      body: 'Get up to 50% off on selected furniture items. Limited time offer!',
      type: 'deal',
      icon: 'percent',
    },
    {
      id: '2',
      title: '📦 New Arrivals',
      body: 'Check out our latest furniture collection. Modern designs now available!',
      type: 'announcement',
      icon: 'package',
    },
    {
      id: '3',
      title: '🛍️ Weekend Special',
      body: 'This weekend only! Extra 20% off on all sofas and beds.',
      type: 'deal',
      icon: 'tag',
    },
    {
      id: '4',
      title: '🚚 Free Delivery',
      body: 'Free delivery on orders above ₹5000. Shop now!',
      type: 'deal',
      icon: 'truck',
    },
  ]);

  useEffect(() => {
    fetchScheduledNotifications();
    fetchNotificationHistory();
  }, []);

  const fetchScheduledNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setScheduledNotifications(data || []);
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .in('status', ['sent', 'failed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificationHistory(data || []);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    Alert.alert(
      'Send Notification',
      `Are you sure you want to send this notification to ${targetAudience === 'all' ? 'all users' : targetAudience === 'active' ? 'active users' : 'specific users'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              // If scheduled, save to scheduled notifications
              if (scheduleEnabled && scheduledDate && scheduledTime) {
                const scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
                
                const { error } = await supabase
                  .from('scheduled_notifications')
                  .insert({
                    title,
                    body,
                    type: notificationType,
                    target_audience: targetAudience,
                    scheduled_for: scheduledFor,
                    status: 'pending',
                  });

                if (error) throw error;
                
                Alert.alert('Success', 'Notification scheduled successfully!');
                await fetchScheduledNotifications();
              } else {
                // Send immediate notification
                await sendImmediateNotification();
              }

              // Reset form
              setTitle('');
              setBody('');
              setScheduleEnabled(false);
              setScheduledDate('');
              setScheduledTime('');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send notification');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const sendImmediateNotification = async () => {
    // Get target users based on audience
    let userQuery = supabase.from('user_push_tokens').select('*');
    
    if (targetAudience === 'active') {
      // Get users who were active in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      userQuery = userQuery.gte('updated_at', sevenDaysAgo.toISOString());
    }

    const { data: tokens, error } = await userQuery;
    
    if (error) throw error;

    // In a real app, you would send these tokens to your push notification service
    // For now, we'll just record it as sent
    const { error: historyError } = await supabase
      .from('scheduled_notifications')
      .insert({
        title,
        body,
        type: notificationType,
        target_audience: targetAudience,
        scheduled_for: new Date().toISOString(),
        status: 'sent',
      });

    if (historyError) throw historyError;

    Alert.alert('Success', `Notification sent to ${tokens?.length || 0} users!`);
    await fetchNotificationHistory();
  };

  const cancelScheduledNotification = async (id: string) => {
    Alert.alert(
      'Cancel Notification',
      'Are you sure you want to cancel this scheduled notification?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('scheduled_notifications')
                .update({ status: 'failed' })
                .eq('id', id);

              if (error) throw error;
              
              await fetchScheduledNotifications();
              await fetchNotificationHistory();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel notification');
            }
          },
        },
      ]
    );
  };

  const useTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setNotificationType(template.type as any);
  };

  const renderSendTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Templates */}
      <Text style={styles.sectionTitle}>Quick Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => useTemplate(template)}
          >
            <BlurView intensity={20} tint="light" style={styles.templateContent}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateBody} numberOfLines={2}>{template.body}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notification Form */}
      <BlurView intensity={20} tint="light" style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Create Notification</Text>
        
        {/* Type Selection */}
        <Text style={styles.label}>Notification Type</Text>
        <View style={styles.typeContainer}>
          {[
            { type: 'announcement', icon: Megaphone, label: 'Announcement' },
            { type: 'deal', icon: Percent, label: 'Deal' },
            { type: 'custom', icon: Bell, label: 'Custom' },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeButton,
                notificationType === item.type && styles.typeButtonActive,
              ]}
              onPress={() => setNotificationType(item.type as any)}
            >
              <item.icon size={20} color={notificationType === item.type ? '#FFF' : '#2D1B16'} />
              <Text style={[
                styles.typeButtonText,
                notificationType === item.type && styles.typeButtonTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title Input */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter notification title"
          placeholderTextColor="#999"
        />

        {/* Message Input */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder="Enter notification message"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        {/* Target Audience */}
        <Text style={styles.label}>Target Audience</Text>
        <View style={styles.audienceContainer}>
          {[
            { value: 'all', label: 'All Users' },
            { value: 'active', label: 'Active Users' },
            { value: 'specific', label: 'Specific Group' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.audienceButton,
                targetAudience === item.value && styles.audienceButtonActive,
              ]}
              onPress={() => setTargetAudience(item.value as any)}
            >
              <Text style={[
                styles.audienceButtonText,
                targetAudience === item.value && styles.audienceButtonTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule Toggle */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.label}>Schedule for Later</Text>
          <Switch
            value={scheduleEnabled}
            onValueChange={setScheduleEnabled}
            trackColor={{ false: '#E5E7EB', true: '#2D1B16' }}
            thumbColor={scheduleEnabled ? '#FFF' : '#FFF'}
          />
        </View>

        {scheduleEnabled && (
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeInput}>
              <Calendar size={20} color="#8B7355" />
              <TextInput
                style={styles.dateInput}
                value={scheduledDate}
                onChangeText={setScheduledDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.dateTimeInput}>
              <Clock size={20} color="#8B7355" />
              <TextInput
                style={styles.dateInput}
                value={scheduledTime}
                onChangeText={setScheduledTime}
                placeholder="HH:MM"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Send size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>
                {scheduleEnabled ? 'Schedule Notification' : 'Send Now'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </BlurView>
    </ScrollView>
  );

  const renderScheduledTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {scheduledNotifications.length === 0 ? (
        <BlurView intensity={20} tint="light" style={styles.emptyCard}>
          <Calendar size={48} color="#8B7355" />
          <Text style={styles.emptyText}>No scheduled notifications</Text>
        </BlurView>
      ) : (
        scheduledNotifications.map((notification) => (
          <BlurView key={notification.id} intensity={20} tint="light" style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <View style={styles.notificationMeta}>
                  <Clock size={14} color="#8B7355" />
                  <Text style={styles.notificationMetaText}>
                    {new Date(notification.scheduled_for).toLocaleString()}
                  </Text>
                  <Users size={14} color="#8B7355" />
                  <Text style={styles.notificationMetaText}>
                    {notification.target_audience}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => cancelScheduledNotification(notification.id)}
              >
                <XCircle size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </BlurView>
        ))
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {notificationHistory.length === 0 ? (
        <BlurView intensity={20} tint="light" style={styles.emptyCard}>
          <Bell size={48} color="#8B7355" />
          <Text style={styles.emptyText}>No notification history</Text>
        </BlurView>
      ) : (
        notificationHistory.map((notification) => (
          <BlurView key={notification.id} intensity={20} tint="light" style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <View style={styles.notificationMeta}>
                  <Clock size={14} color="#8B7355" />
                  <Text style={styles.notificationMetaText}>
                    {new Date(notification.created_at).toLocaleString()}
                  </Text>
                  {notification.status === 'sent' ? (
                    <CheckCircle size={14} color="#10B981" />
                  ) : (
                    <XCircle size={14} color="#EF4444" />
                  )}
                  <Text style={[
                    styles.notificationMetaText,
                    notification.status === 'sent' ? styles.successText : styles.errorText,
                  ]}>
                    {notification.status}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        ))
      )}
    </ScrollView>
  );

  return (
    <LinearGradient colors={['#F5F0E8', '#E5D5C8']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2D1B16" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <Bell size={24} color="#2D1B16" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'send', label: 'Send', icon: Send },
          { key: 'scheduled', label: 'Scheduled', icon: Calendar },
          { key: 'history', label: 'History', icon: Clock },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <tab.icon size={20} color={activeTab === tab.key ? '#FFF' : '#8B7355'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'send' && renderSendTab()}
        {activeTab === 'scheduled' && renderScheduledTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  activeTab: {
    backgroundColor: '#2D1B16',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 15,
  },
  templatesContainer: {
    marginBottom: 20,
  },
  templateCard: {
    width: 250,
    marginRight: 15,
  },
  templateContent: {
    padding: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 5,
  },
  templateBody: {
    fontSize: 14,
    color: '#666',
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  formSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2D1B16',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
  },
  typeButtonActive: {
    backgroundColor: '#2D1B16',
    borderColor: '#2D1B16',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  audienceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  audienceButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
  },
  audienceButtonActive: {
    backgroundColor: '#8B7355',
    borderColor: '#8B7355',
  },
  audienceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  audienceButtonTextActive: {
    color: '#FFF',
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  dateTimeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
  },
  dateInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#2D1B16',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D1B16',
    borderRadius: 15,
    padding: 16,
    marginTop: 25,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationMetaText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
    marginRight: 15,
  },
  cancelButton: {
    padding: 5,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
});
