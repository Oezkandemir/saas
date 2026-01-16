import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface UserProfile {
  id: string;
  email: string | undefined;
  name: string | null;
  role: string;
  avatar_url: string | null;
  status: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is properly configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey && 
                       supabaseUrl !== "https://placeholder.supabase.co";

  const fetchUserProfile = async (authUser: User): Promise<UserProfile | null> => {
    if (!isConfigured) {
      return null;
    }

    try {
      // First, try to get user data from users table (single query, faster)
      // Use a shorter timeout and don't wait for user_profiles
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
          )
        ]);
      };

      // Only query users table for essential fields - skip user_profiles for faster loading
      // Use single() instead of maybeSingle() for better performance, but handle errors gracefully
      const usersQuery = supabase
        .from("users")
        .select("role, name, avatar_url")
        .eq("id", authUser.id)
        .single();

      let dbUser: any = null;
      try {
        const result = await withTimeout(usersQuery, 800); // Reduced timeout to 800ms
        if (result && !result.error && result.data) {
          dbUser = result.data;
        }
      } catch (error) {
        // Silently fail - use fallback from metadata (faster than waiting)
      }

      // Determine role - prioritize database, fallback to metadata
      let userRole = authUser.user_metadata?.role || 
                     authUser.app_metadata?.role || 
                     dbUser?.role || 
                     "USER";

      // Build profile with database data or fallback to metadata
      const profile: UserProfile = {
        id: authUser.id,
        email: dbUser?.email || authUser.email,
        name: dbUser?.name || 
              authUser.user_metadata?.name || 
              authUser.email?.split("@")[0] || 
              null,
        role: userRole,
        avatar_url: dbUser?.avatar_url || 
                   authUser.user_metadata?.avatar_url || 
                   null,
        status: dbUser?.status || "active",
      };

      return profile;
    } catch (error) {
      // Return fallback profile immediately on any error
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || null,
        role: authUser.user_metadata?.role || authUser.app_metadata?.role || "USER",
        avatar_url: authUser.user_metadata?.avatar_url || null,
        status: "active",
      };
    }
  };

  const refreshUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const profile = await fetchUserProfile(authUser);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;

    // Set a shorter timeout to ensure loading doesn't hang (reduced to 1.5 seconds)
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1500); // 1.5 second timeout

    const clearLoadingTimeout = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    };

    // Get initial session - use getSession which is faster than getUser
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error || !session?.user) {
          clearLoadingTimeout();
          setLoading(false);
          return;
        }
        
        // Fetch profile with timeout - use fallback quickly if DB is slow
        Promise.race([
          fetchUserProfile(session.user),
          new Promise<UserProfile | null>((resolve) => 
            setTimeout(() => {
              // Return fallback profile on timeout - use metadata immediately
              resolve({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || null,
                role: session.user.user_metadata?.role || session.user.app_metadata?.role || "USER",
                avatar_url: session.user.user_metadata?.avatar_url || null,
                status: "active",
              });
            }, 1000) // 1 second timeout for profile fetch - faster fallback
          )
        ])
        .then((profile) => {
          if (mounted && profile) {
            clearLoadingTimeout();
            setUser(profile);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            clearLoadingTimeout();
            setLoading(false);
          }
        });
      })
      .catch(() => {
        if (mounted) {
          clearLoadingTimeout();
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setLoading(true);
        
        // Use timeout for profile fetch - faster fallback
        Promise.race([
          fetchUserProfile(session.user),
          new Promise<UserProfile | null>((resolve) => 
            setTimeout(() => {
              resolve({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || null,
                role: session.user.user_metadata?.role || session.user.app_metadata?.role || "USER",
                avatar_url: session.user.user_metadata?.avatar_url || null,
                status: "active",
              });
            }, 1000) // 1 second timeout
          )
        ])
        .then((profile) => {
          if (mounted && profile) {
            clearLoadingTimeout();
            setUser(profile);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            clearLoadingTimeout();
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || null,
              role: session.user.user_metadata?.role || session.user.app_metadata?.role || "USER",
              avatar_url: session.user.user_metadata?.avatar_url || null,
              status: "active",
            });
            setLoading(false);
          }
        });
      } else {
        clearLoadingTimeout();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
