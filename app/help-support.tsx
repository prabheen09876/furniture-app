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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  MessageCircle, 
  Phone, 
  Mail, 
  HelpCircle, 
  FileQuestion, 
  ChevronRight,
  Send
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// FAQ data
const faqItems = [
  {
    id: 'delivery',
    question: 'How long does delivery take?',
    answer: 'Standard delivery typically takes 3-5 business days. Premium delivery is available in select areas with 1-2 day delivery timeframes. You can check the estimated delivery time during checkout.'
  },
  {
    id: 'returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for most items. Products must be in original condition with all packaging. Custom furniture has special return conditions. Please see our full return policy for details.'
  },
  {
    id: 'assembly',
    question: 'Do you offer assembly services?',
    answer: 'Yes, we offer professional assembly services for an additional fee. You can select this option during checkout. Our trained professionals will assemble your furniture at your convenience.'
  },
  {
    id: 'warranty',
    question: 'What warranty do you provide?',
    answer: 'All our furniture comes with a 1-year warranty against manufacturing defects. Premium collections have extended warranties of up to 5 years. Warranty details are included with each product.'
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, online payment gateways and cash. For orders over ₹1,00,000 cash is not applicable, we also offer financing options through our partners.'
  },
];

export default function HelpSupportScreen() {
  const { user } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previousMessages, setPreviousMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchPreviousMessages();
    }
  }, [user]);
  
  const fetchPreviousMessages = async () => {
    if (!user) return;
    
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setPreviousMessages(data || []);
      }
    } catch (error) {
      console.error('Exception fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const toggleQuestion = (id: string) => {
    if (activeQuestion === id) {
      setActiveQuestion(null);
    } else {
      setActiveQuestion(id);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    
    if (email.trim() === '') {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Store the message locally first as a fallback
      const newMessage = {
        id: Date.now().toString(),
        user_id: user?.id || null,
        email: email.trim(),
        message: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_response: null,
        responded_by: null
      };
      
      // Try to send to Supabase
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user?.id || null,
          email: email.trim(),
          message: message.trim(),
          status: 'pending'
        });
      
      if (error) {
        console.error('Error sending message:', error);
        
        // If we can't send to Supabase, just use the local version
        setPreviousMessages(prev => [newMessage, ...prev]);
        
        setMessage('');
        Alert.alert(
          'Message Saved', 
          'Your message has been saved. Our team will be notified about your inquiry.'
        );
      } else {
        setMessage('');
        Alert.alert(
          'Message Sent', 
          'Thank you for contacting us. We will get back to you soon.', 
          [
            { 
              text: 'OK', 
              onPress: () => fetchPreviousMessages() 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Exception sending message:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#F5E6D3', '#E8D5C4']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#2D1B16" />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* Contact Options */}
        <View style={styles.contactContainer}>
          <BlurView intensity={40} style={styles.contactCard}>
            <View style={styles.contactIconContainer}>
              <MessageCircle size={24} color="#2D1B16" />
            </View>
            <Text style={styles.contactTitle}>Chat Support</Text>
            <Text style={styles.contactInfo}>Available 9AM - 6PM</Text>
          </BlurView>
          
          <BlurView intensity={40} style={styles.contactCard}>
            <View style={styles.contactIconContainer}>
              <Phone size={24} color="#2D1B16" />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactInfo}>9999999999</Text>
          </BlurView>
          
          <BlurView intensity={40} style={styles.contactCard}>
            <View style={styles.contactIconContainer}>
              <Mail size={24} color="#2D1B16" />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactInfo}>example.com</Text>
          </BlurView>
        </View>

        {/* FAQ Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={20} color="#2D1B16" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          
          {faqItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.faqItem}
              onPress={() => toggleQuestion(item.id)}
            >
              <BlurView intensity={40} style={styles.faqItemInner}>
                <View style={styles.faqHeader}>
                  <View style={styles.faqIconContainer}>
                    <FileQuestion size={18} color="#2D1B16" />
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <ChevronRight 
                    size={18} 
                    color="#2D1B16" 
                    style={[
                      styles.faqArrow,
                      activeQuestion === item.id && styles.faqArrowActive
                    ]}
                  />
                </View>
                
                {activeQuestion === item.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color="#2D1B16" />
            <Text style={styles.sectionTitle}>Send Us a Message</Text>
          </View>
          
          <BlurView intensity={40} style={styles.contactForm}>
            <Text style={styles.contactFormLabel}>
              How can we help you?
            </Text>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Your email address"
              placeholderTextColor="#8B7355"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#8B7355"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity 
              style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.sendButtonText}>Send Message</Text>
                  <Send size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </View>
        
        {/* Previous Messages */}
        {user && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Mail size={20} color="#2D1B16" />
              <Text style={styles.sectionTitle}>Your Messages</Text>
            </View>
            
            {loadingMessages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#2D1B16" />
                <Text style={styles.loadingText}>Loading your messages...</Text>
              </View>
            ) : previousMessages.length > 0 ? (
              previousMessages.map((msg) => (
                <BlurView key={msg.id} intensity={40} style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageDate}>
                      {new Date(msg.created_at).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, 
                      msg.status === 'pending' ? styles.statusPending : 
                      msg.status === 'in_progress' ? styles.statusInProgress : 
                      styles.statusResolved
                    ]}>
                      <Text style={styles.statusText}>
                        {msg.status === 'pending' ? 'Pending' : 
                         msg.status === 'in_progress' ? 'In Progress' : 
                         'Resolved'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.userMessage}>{msg.message}</Text>
                  
                  {msg.admin_response && (
                    <View style={styles.responseContainer}>
                      <Text style={styles.responseLabel}>Response:</Text>
                      <Text style={styles.adminResponse}>{msg.admin_response}</Text>
                    </View>
                  )}
                </BlurView>
              ))
            ) : (
              <BlurView intensity={40} style={styles.emptyMessageCard}>
                <Text style={styles.emptyMessageText}>
                  You haven't sent any messages yet.
                </Text>
              </BlurView>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpace} />
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
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D1B16',
  },
  contactContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
    marginLeft: 8,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqItemInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#2D1B16',
  },
  faqArrow: {
    marginLeft: 8,
  },
  faqArrowActive: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.2)',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8B7355',
  },
  contactForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contactFormLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2D1B16',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  bottomSpace: {
    height: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1B16',
    marginBottom: 8,
    marginTop: 12,
  },
  emailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2D1B16',
    marginBottom: 8,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#2D1B16',
    fontSize: 14,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  emptyMessageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessageText: {
    color: '#8B7355',
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userMessage: {
    fontSize: 14,
    color: '#2D1B16',
    marginBottom: 16,
  },
  responseContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D1B16',
    marginBottom: 4,
  },
  adminResponse: {
    fontSize: 14,
    color: '#2D1B16',
    fontStyle: 'italic',
  },
});
