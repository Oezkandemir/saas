"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserNotification } from "@/actions/user-profile-actions";
import { toast } from "sonner";

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

    console.log(
      "Setting up notifications realtime subscription for user:",
      session.user.id,
    );

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
        (payload) => {
          console.log("Received notification change:", payload);

          // Show toast for new notifications
          if (payload.eventType === "INSERT") {
            const notification = payload.new as UserNotification;
            if (notification && notification.title) {
              toast.info(notification.title, {
                description: notification.content,
              });
            }
          }

          // Refetch unread count for the bell indicator
          refetchUnreadCount();

          // Explicitly invalidate React Query cache to force refetches
          window.dispatchEvent(new CustomEvent("notifications-changed"));
        },
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up notifications subscription");
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
