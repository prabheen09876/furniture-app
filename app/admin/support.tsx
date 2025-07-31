import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Email sending function (simulated)
const sendEmail = async (to: string, subject: string, body: string) => {
  // In a real app, this would connect to an email service like SendGrid, Mailgun, etc.
  console.log(`Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success (in a real app, this would be the actual API response)
  return { success: true };
};

interface SupportMessage {
  id: string;
  user_id: string | null;
  email: string;
  message: string;
  status: string; // Database stores as string, we'll validate values in our code
  admin_response: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
  };
}

export default function SupportAdminScreen() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      router.replace('/');
      return;
    }
    
    fetchMessages();
  }, [isAdmin, filter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data: messagesData, error } = await query;
      
      if (error) {
        console.error('Error fetching support messages:', error);
        Alert.alert('Error', 'Failed to load support messages');
      } else if (messagesData) {
        // Get user profiles for messages with user_id
        const userIds = messagesData
          .filter(msg => msg.user_id)
          .map(msg => msg.user_id as string);
        
        let profilesData: Record<string, { full_name: string | null }> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
            
          if (profiles) {
            profilesData = profiles.reduce((acc, profile) => {
              acc[profile.id] = { full_name: profile.full_name };
              return acc;
            }, {} as Record<string, { full_name: string | null }>);
          }
        }
        
        // Combine messages with profiles
        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          profile: msg.user_id ? profilesData[msg.user_id] : undefined
        }));
        
        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Exception fetching support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setResponseText(message.admin_response || '');
    setModalVisible(true);
  };

  const toggleMessageExpand = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleSendResponse = async () => {
    if (!selectedMessage) return;
    
    if (responseText.trim() === '') {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    
    setSendingResponse(true);
    
    try {
      // Update the message in the database
      const { error: updateError } = await supabase
        .from('support_messages')
        .update({
          admin_response: responseText,
          status: 'resolved',
          responded_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Send email to the user
      const emailResult = await sendEmail(
        selectedMessage.email,
        'Response to Your Support Request - AceQuint Furniture',
        `Dear Customer,

Thank you for contacting AceQuint Furniture Support.

Your Message:
"${selectedMessage.message}"

Our Response:
"${responseText}"

If you have any further questions, please don't hesitate to contact us.

Best regards,
AceQuint Furniture Support Team`
      );
      
      if (emailResult.success) {
        Alert.alert(
          'Response Sent',
          'Your response has been sent to the customer via email.',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            fetchMessages();
          }}]
        );
      }
    } catch (error) {
      console.error('Error sending response:', error);
      Alert.alert('Error', 'Failed to send response. Please try again.');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleUpdateStatus = async (message: SupportMessage, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);
      
      if (error) {
        throw error;
      }
      
      fetchMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle size={16} color="#F59E0B" />;
      case 'in_progress':
        return <Clock size={16} color="#3B82F6" />;
      case 'resolved':
        return <CheckCircle2 size={16} color="#10B981" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'resolved':
        return '#10B981';
      default:
        return '#8B7355';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'rgba(245, 158, 11, 0.1)';
      case 'in_progress':
        return 'rgba(59, 130, 246, 0.1)';
      case 'resolved':
        return 'rgba(16, 185, 129, 0.1)';
      default:
        return 'rgba(139, 115, 85, 0.1)';
    }
  };

  const renderFilterButton = (filterValue: 'all' | 'pending' | 'in_progress' | 'resolved', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#2D1B16" />
        </TouchableOpacity>
        <Text style={styles.title}>Support Messages</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchMessages}
        >
          <RefreshCw size={20} color="#2D1B16" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('in_progress', 'In Progress')}
        {renderFilterButton('resolved', 'Resolved')}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D1B16" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color="#8B7355" strokeWidth={1} />
          <Text style={styles.emptyText}>No messages found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all' 
              ? 'There are no support messages yet.' 
              : `There are no ${filter} messages.`}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.messagesList}>
          {messages.map((message) => (
            <BlurView key={message.id} intensity={40} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.messageHeaderLeft}>
                  <Mail size={16} color="#2D1B16" style={styles.messageIcon} />
                  <Text style={styles.messageEmail}>{message.email}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusBgColor(message.status) }
                ]}>
                  {getStatusIcon(message.status)}
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(message.status) }
                  ]}>
                    {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.messageInfo}>
                <Text style={styles.messageDate}>
                  {new Date(message.created_at).toLocaleString()}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.messageContent}
                onPress={() => toggleMessageExpand(message.id)}
              >
                <Text 
                  style={styles.messageText}
                  numberOfLines={expandedMessages[message.id] ? undefined : 2}
                >
                  {message.message}
                </Text>
                <View style={styles.expandButton}>
                  {expandedMessages[message.id] ? (
                    <ChevronUp size={16} color="#8B7355" />
                  ) : (
                    <ChevronDown size={16} color="#8B7355" />
                  )}
                </View>
              </TouchableOpacity>
              
              {message.admin_response && (
                <View style={styles.responsePreview}>
                  <Text style={styles.responseLabel}>Response:</Text>
                  <Text 
                    style={styles.responseText}
                    numberOfLines={expandedMessages[message.id] ? undefined : 2}
                  >
                    {message.admin_response}
                  </Text>
                </View>
              )}
              
              <View style={styles.messageActions}>
                {message.status !== 'pending' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.pendingButton]}
                    onPress={() => handleUpdateStatus(message, 'pending')}
                  >
                    <Text style={styles.actionButtonText}>Mark Pending</Text>
                  </TouchableOpacity>
                )}
                
                {message.status !== 'in_progress' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.progressButton]}
                    onPress={() => handleUpdateStatus(message, 'in_progress')}
                  >
                    <Text style={styles.actionButtonText}>In Progress</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.respondButton]}
                  onPress={() => handleSelectMessage(message)}
                >
                  <Text style={styles.actionButtonText}>
                    {message.admin_response ? 'Edit Response' : 'Respond'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ))}
          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
      
      {/* Response Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Respond to Message</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedMessage && (
              <>
                <View style={styles.modalMessageInfo}>
                  <Text style={styles.modalLabel}>From:</Text>
                  <Text style={styles.modalEmail}>{selectedMessage.email}</Text>
                </View>
                
                <View style={styles.modalMessageContent}>
                  <Text style={styles.modalLabel}>Message:</Text>
                  <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
                </View>
                
                <View style={styles.responseInputContainer}>
                  <Text style={styles.modalLabel}>Your Response:</Text>
                  <TextInput
                    style={styles.responseInput}
                    placeholder="Type your response here..."
                    placeholderTextColor="#8B7355"
                    multiline
                    value={responseText}
                    onChangeText={setResponseText}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.sendButton, sendingResponse && styles.sendButtonDisabled]}
                  onPress={handleSendResponse}
                  disabled={sendingResponse}
                >
                  {sendingResponse ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.sendButtonText}>Send Response</Text>
                      <Send size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
                
                <Text style={styles.emailNote}>
                  This response will be sent to the customer via email.
                </Text>
              </>
            )}
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  filterButtonActive: {
    backgroundColor: '#2D1B16',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2D1B16',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2D1B16',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D1B16',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 8,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 8,
  },
  messageEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageInfo: {
    marginBottom: 12,
  },
  messageDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  messageContent: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: '#2D1B16',
    lineHeight: 20,
  },
  expandButton: {
    alignItems: 'center',
    marginTop: 4,
  },
  responsePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#2D1B16',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  pendingButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  progressButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  respondButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D1B16',
  },
  bottomSpace: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2D1B16',
  },
  modalMessageInfo: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  modalEmail: {
    fontSize: 14,
    color: '#2D1B16',
  },
  modalMessageContent: {
    marginBottom: 16,
    maxHeight: 120,
  },
  modalMessage: {
    fontSize: 14,
    color: '#2D1B16',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 12,
  },
  responseInputContainer: {
    marginBottom: 16,
  },
  responseInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2D1B16',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emailNote: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
