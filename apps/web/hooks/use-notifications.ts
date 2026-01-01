"use client";

import { getUserNotifications } from "@/actions/user-profile-actions";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

export interface UseNotificationsResult {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const {
    data: unreadCount = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      try {
        const result = await getUserNotifications(true); // Only get unread notifications

        if (result.success && result.data) {
          return result.data.length;
        } else {
          throw new Error(result.error || "Failed to fetch notifications");
        }
      } catch (err) {
        logger.error("Error fetching notifications", err);
        throw new Error("An unexpected error occurred");
      }
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (notifications change frequently)
    gcTime: 5 * 60 * 1000, // Keep in cache for garbage collection for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on window focus for notifications
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });

  return {
    unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch: async () => {
      await refetch();
    },
  };
}
