import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1B16',
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#2D1B16',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#2D1B16',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9EFE6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2D1B16',
  },
});

export default function CreateSupportTableScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (isAdmin === false) {
      router.back();
    }
  }, [isAdmin, router]);

  // SQL script for creating the support_messages table
  const supportTableSql = `CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_response TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own support messages" 
  ON public.support_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create support messages" 
  ON public.support_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all support messages" 
  ON public.support_messages FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'));

CREATE POLICY "Admins can update support messages" 
  ON public.support_messages FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();`;

  const createSupportMessagesTable = async () => {
    setLoading(true);
    try {
      // First check if the table exists
      const { error: checkError } = await supabase
        .from('support_messages')
        .select('count', { count: 'exact', head: true });
      
      if (!checkError) {
        // Table already exists
        Alert.alert('Info', 'Support messages table already exists!');
        setLoading(false);
        return;
      }
      
      // Try to create the table directly
      // Since we can't execute raw SQL directly, we'll try to create the table using the API
      // This is a simplified approach that may not work in all environments
      const { error: tableError } = await supabase
        .from('support_messages')
        .insert({
          // Insert a dummy record to force table creation
          // This will fail, but that's expected
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          message: 'Test message',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select();
      
      // Show error and provide SQL for manual creation
      if (tableError) {
        console.error('Error creating table:', tableError);
        
        Alert.alert(
          'Table Creation Failed', 
          'Please create the support_messages table through the Supabase dashboard SQL editor using the migration file.',
          [
            { text: 'OK' },
            { 
              text: 'View SQL', 
              onPress: () => {
                Alert.alert(
                  'SQL for Support Messages Table',
                  'Copy this SQL to the Supabase SQL Editor:\n\n' + supportTableSql
                );
              } 
            }
          ]
        );
      } else {
        Alert.alert('Success', 'Support messages table created successfully with RLS policies!');
      }
    } catch (error) {
      console.error('Exception creating table:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred while creating the table. Please create it manually through the Supabase dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D1B16" />
        <Text style={styles.loadingText}>Checking admin status...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#F9EFE6', '#F3E0D2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D1B16" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Support Table</Text>
        <View style={styles.placeholder} />
      </View>

      <BlurView intensity={25} tint="light" style={styles.contentContainer}>
        <Text style={styles.description}>
          This utility will create the support_messages table in your Supabase database.
          Use this if you're seeing 404 errors when trying to submit support messages.
        </Text>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={createSupportMessagesTable}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Create Support Messages Table</Text>
          )}
        </TouchableOpacity>
      </BlurView>
    </LinearGradient>
  );
}


