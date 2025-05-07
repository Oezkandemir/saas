"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserNotification } from "@/actions/user-profile-actions";

import { useNotifications } from "@/hooks/use-notifications";
import { useSupabase } from "@/components/supabase-provider";

type NotificationsContextType = {
  refetchAll: () => Promise<void>;
  clearCache: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  refetchAll: async () => {},
  clearCache: () => {},
});

export const useNotificationsContext = () => useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { refetch: refetchUnreadCount } = useNotifications();
  const { supabase, session } = useSupabase();

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!session?.user?.id) return;

    // Subscribe to changes in the user_notifications table
    const channel = supabase
      .channel("global_notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (insert, update, delete)
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // Refetch unread count for the bell indicator
          refetchUnreadCount();

          // Explicitly invalidate React Query cache to force refetches
          window.dispatchEvent(new CustomEvent("notifications-changed"));
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase, refetchUnreadCount]);

  const clearCache = () => {
    window.dispatchEvent(new CustomEvent("notifications-changed"));
  };

  const refetchAll = async () => {
    await refetchUnreadCount();
    clearCache();
  };

  return (
    <NotificationsContext.Provider value={{ refetchAll, clearCache }}>
      {children}
    </NotificationsContext.Provider>
  );
}
