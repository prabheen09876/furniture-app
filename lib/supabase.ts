import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { supabaseStorageAdapter } from './supabaseStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables! Check your build configuration.');
  // Fallback to avoid instant crash, though requests will fail
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Use secure storage adapter for mobile platforms
    storage: Platform.OS !== 'web' ? supabaseStorageAdapter : undefined,
  },
});