import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#2D1B16', '#8B7355']}
        style={styles.background}
      />
      
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: '#2D1B16' },
          headerTintColor: '#F5F0E8',
          headerBackTitle: 'Back',
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#F5F0E8" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollContainer}>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.date}>Last updated: {currentDate}</Text>
          
          <Text style={styles.section}>1. INTRODUCTION</Text>
          <Text style={styles.paragraph}>
            Welcome to Furniture Expo. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data when you visit our app 
            and tell you about your privacy rights and how the law protects you.
          </Text>
          
          <Text style={styles.section}>2. THE DATA WE COLLECT ABOUT YOU</Text>
          <Text style={styles.paragraph}>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </Text>
          <Text style={styles.bulletPoint}>• Identity Data: first name, last name, username</Text>
          <Text style={styles.bulletPoint}>• Contact Data: billing address, delivery address, email address, phone numbers</Text>
          <Text style={styles.bulletPoint}>• Transaction Data: details about payments and products you've purchased</Text>
          <Text style={styles.bulletPoint}>• Technical Data: device information, IP address, login data, browser type</Text>
          <Text style={styles.bulletPoint}>• Usage Data: information about how you use our app and services</Text>
          
          <Text style={styles.section}>3. HOW WE USE YOUR PERSONAL DATA</Text>
          <Text style={styles.paragraph}>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </Text>
          <Text style={styles.bulletPoint}>• To create and manage your account</Text>
          <Text style={styles.bulletPoint}>• To process and deliver your orders</Text>
          <Text style={styles.bulletPoint}>• To manage our relationship with you</Text>
          <Text style={styles.bulletPoint}>• To improve our app, products/services, and customer relationships</Text>
          <Text style={styles.bulletPoint}>• To recommend products that might be of interest to you</Text>
          
          <Text style={styles.section}>4. DATA SECURITY</Text>
          <Text style={styles.paragraph}>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
            used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those 
            employees, agents, contractors and other third parties who have a business need to know.
          </Text>
          
          <Text style={styles.section}>5. DATA RETENTION</Text>
          <Text style={styles.paragraph}>
            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
            including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </Text>
          
          <Text style={styles.section}>6. YOUR LEGAL RIGHTS</Text>
          <Text style={styles.paragraph}>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Request access to your personal data</Text>
          <Text style={styles.bulletPoint}>• Request correction of your personal data</Text>
          <Text style={styles.bulletPoint}>• Request erasure of your personal data</Text>
          <Text style={styles.bulletPoint}>• Object to processing of your personal data</Text>
          <Text style={styles.bulletPoint}>• Request restriction of processing your personal data</Text>
          <Text style={styles.bulletPoint}>• Request transfer of your personal data</Text>
          <Text style={styles.bulletPoint}>• Right to withdraw consent</Text>
          
          <Text style={styles.section}>7. CONTACT US</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </Text>
          <Text style={styles.bulletPoint}>Email: privacy@furniture-expo.com</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:privacy@furniture-expo.com')}>
            <Text style={styles.link}>privacy@furniture-expo.com</Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1B16',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 240, 232, 0.1)',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F0E8',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#F5F0E8',
    opacity: 0.6,
    marginBottom: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F0E8',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#F5F0E8',
    marginBottom: 10,
    lineHeight: 22,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#F5F0E8',
    marginLeft: 15,
    marginBottom: 5,
    lineHeight: 22,
  },
  link: {
    fontSize: 16,
    color: '#FFBC4B',
    marginVertical: 5,
    textDecorationLine: 'underline',
  },
});
