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

  // Subscribe to realtime notifications channel (only once)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase.channel("global_notifications_changes");
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.debug("✅ Successfully subscribed to realtime notifications");
        } else if (status === "CHANNEL_ERROR") {
          logger.warn("Failed to subscribe to realtime notifications:", status);
        }
      });
    } catch (error) {
      logger.warn("Failed to subscribe to realtime notifications:", error);
    }

    // Cleanup: remove channel when component unmounts
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    async function loadInitialSession() {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
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
