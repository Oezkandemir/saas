"use client";

import { useState, useEffect } from "react";
import { getUserNotifications } from "@/actions/user-profile-actions";

export interface UseNotificationsResult {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getUserNotifications(true); // Only get unread notifications
      
      if (result.success && result.data) {
        setUnreadCount(result.data.length);
      } else {
        setError(result.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications
  };
} 