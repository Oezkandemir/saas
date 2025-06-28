import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Database types matching the web app
export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          emailVerified: Date | null;
          image: string | null;
          created_at: Date;
          updated_at: Date;
          role: "ADMIN" | "USER";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_current_period_end: Date | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
          role?: "ADMIN" | "USER";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: Date | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
          role?: "ADMIN" | "USER";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: Date | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
        };
      };
    };
  };
};

// Environment variables - these should match the web app
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Safe AsyncStorage wrapper for React Native
const createAsyncStorage = () => {
  if (Platform.OS === 'web') {
    // Fallback for web - should not happen in React Native
    return {
      getItem: async (key: string) => null,
      setItem: async (key: string, value: string) => {},
      removeItem: async (key: string) => {},
    };
  }
  return AsyncStorage;
};

// Create Supabase client for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createAsyncStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 