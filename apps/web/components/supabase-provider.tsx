"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { type Session } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { type Database } from "@/lib/supabase";

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient<Database>>;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined,
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        `Supabase environment variables are missing:
        NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "defined" : "missing"}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "defined" : "missing"}`,
      );
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  });
  const [session, setSession] = useState<Session | null>(null);

  // ⚡ PERFORMANCE: Removed global notifications channel - useNotifications hook handles it per-user
  // This prevents duplicate subscriptions and reduces unnecessary realtime connections

  useEffect(() => {
    // Note: onAuthStateChange provides session from storage (less secure)
    // but it's OK here for UI state updates. For authentication checks, use getUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    async function loadInitialSession() {
      try {
        // Use getUser() for secure authentication check
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          // Get session for UI state (session is OK here for client-side UI updates)
          const { data: sessionData } = await supabase.auth.getSession();
          setSession(sessionData.session);
        }
      } catch (error) {
        logger.error("Error loading initial session:", error);
      }
    }

    loadInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
