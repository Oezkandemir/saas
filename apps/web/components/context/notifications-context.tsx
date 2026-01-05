"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { logger } from "@/lib/logger";
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
  const [, setForceUpdate] = useState(0);
  const queryClient = useQueryClient();
  const { session } = useSupabase();
  const userId = session?.user?.id;

  const clearCache = () => {
    try {
      // Invalidate all notification-related queries
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["notifications"],
        });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread", userId],
        });
      }

      // Dispatch a custom event to invalidate caches
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      logger.warn("Error clearing cache:", error);
    }
  };

  const refetchAll = async () => {
    try {
      // Invalidate React Query cache first
      clearCache();

      // Force a re-render
      setForceUpdate((prev) => prev + 1);

      // Refetch all notification queries
      if (userId) {
        await queryClient.refetchQueries({
          queryKey: ["notifications"],
        });
      }
    } catch (error) {
      logger.warn("Error refetching notifications:", error);
    }
  };

  // Listen for DELETE events from Supabase Realtime to update cache
  useEffect(() => {
    if (!userId) return;

    // Listen for custom events dispatched when notifications are deleted
    const handleNotificationsChanged = () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", userId],
      });
    };

    window.addEventListener(
      "notifications-changed",
      handleNotificationsChanged,
    );

    return () => {
      window.removeEventListener(
        "notifications-changed",
        handleNotificationsChanged,
      );
    };
  }, [userId, queryClient]);

  return (
    <NotificationsContext.Provider value={{ refetchAll, clearCache }}>
      {children}
    </NotificationsContext.Provider>
  );
}
