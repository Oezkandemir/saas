import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';


interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await syncUserData(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await syncUserData(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserData = async (supabaseUser: User) => {
    try {
      // Try to get user from user_profiles table first
      const { data: dbUser } = await supabase
        .from('user_profiles')
        .select('name, email, image')
        .eq('id', supabaseUser.id)
        .single();

      // If no user profile exists, try to get from users table (legacy support)
      let userData = dbUser;
      if (!userData) {
        const { data: legacyUser } = await supabase
          .from('users')
          .select('name, email, image')
          .eq('id', supabaseUser.id)
          .single();
        userData = legacyUser;
      }

      setUser({
        id: supabaseUser.id,
        email: userData?.email || supabaseUser.email || null,
        name: userData?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || null,
        image: userData?.image || supabaseUser.user_metadata?.avatar_url || null,
      });
    } catch (error) {
      console.error('Error syncing user data:', error);
      // Fallback to basic user data from auth
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || null,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || null,
        image: supabaseUser.user_metadata?.avatar_url || null,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (data.user && !error) {
        // Create or update user profile
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: name || email.split('@')[0],
          });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 