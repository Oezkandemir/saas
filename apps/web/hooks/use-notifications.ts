"use client";

import { useEffect, useRef, createElement } from "react";
import { getUserNotifications } from "@/actions/user-profile-actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/components/supabase-provider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UseNotificationsResult {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Optimized real-time notification hook with Supabase Realtime
 * Automatically updates when new notifications are created
 */
// Notification sound - create audio context for notification sound
function playNotificationSound() {
  try {
    // Create a pleasant notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant bell-like sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    // Fallback: use a simple beep if Web Audio API is not available
    console.warn("Could not play notification sound:", err);
  }
}

export function useNotifications(): UseNotificationsResult {
  const supabaseContext = useSupabase();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const router = useRouter();
  const previousCountRef = useRef<number>(0);
  
  // Translation fallbacks (useTranslations might not be available in all contexts)
  const getTranslation = (key: string): string => {
    const translations: Record<string, string> = {
      "newNotification": "Neue Benachrichtigung",
      "newNotificationDescription": "Sie haben eine neue Benachrichtigung erhalten",
      "viewAll": "Öffnen",
    };
    return translations[key] || key;
  };

  // Safely get supabase and session with null checks
  const supabase = supabaseContext?.supabase;
  const session = supabaseContext?.session;
  const userId = session?.user?.id;

  const {
    data: unreadCount = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: async () => {
      try {
        const result = await getUserNotifications(true); // Only get unread notifications

        if (result.success && result.data) {
          return result.data.length;
        } else {
          // If user is not authenticated, return 0 instead of throwing error
          if (result.error === "User not authenticated") {
            return 0;
          }
          throw new Error(result.error || "Failed to fetch notifications");
        }
      } catch (err) {
        // Return 0 instead of throwing for unauthenticated users
        if (err instanceof Error && err.message.includes("not authenticated")) {
          return 0;
        }
        // Log error but don't throw - return 0 as fallback
        console.error("Error fetching notifications", err);
        return 0;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (realtime handles updates)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on window focus - realtime handles it
    refetchInterval: false, // Disable polling - use realtime instead
    enabled: !!userId && !!supabase, // Only run if we have a user session and supabase client
  });

  // Set up real-time subscription for instant updates
  useEffect(() => {
    if (!userId || !supabase) {
      // Clean up if we don't have what we need
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current).catch(() => {
          // Ignore cleanup errors
        });
        channelRef.current = null;
      }
      return;
    }

    // Clean up existing channel before creating a new one
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
    }

    try {
      // Create new channel for real-time notifications with better error handling
      const channel = supabase
        .channel(`notifications:${userId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: userId },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("🔔 Real-time INSERT event received:", payload);
            const newNotification = payload.new as { 
              read?: boolean; 
              title?: string; 
              content?: string;
              id?: string;
              type?: string;
            };
            
            // Only process if notification is unread
            if (!newNotification.read) {
              // Increment count immediately (optimistic update)
              queryClient.setQueryData<number>(
                ["notifications", "unread", userId],
                (oldCount = 0) => oldCount + 1
              );
              
              // Play notification sound
              playNotificationSound();
              
              // Show toast notification with link
              toast.success(newNotification.title || getTranslation("newNotification"), {
                description: newNotification.content || getTranslation("newNotificationDescription"),
                duration: 8000,
                icon: createElement(Bell, { className: "h-5 w-5 text-blue-500" }),
                action: {
                  label: getTranslation("viewAll"),
                  onClick: () => {
                    router.push("/profile/notifications");
                  },
                },
                className: "border-l-4 border-l-blue-500 shadow-lg",
              });
            }
            
            // Always invalidate to ensure fresh data
            queryClient.invalidateQueries({
              queryKey: ["notifications"],
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread", userId],
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Notification updated (e.g., marked as read) - refetch count
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread", userId],
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const deletedNotification = payload.old as { read?: boolean };
            
            // Optimistically update count if deleted notification was unread
            if (!deletedNotification.read) {
              queryClient.setQueryData<number>(
                ["notifications", "unread", userId],
                (oldCount = 0) => Math.max(0, oldCount - 1)
              );
            }
            
            // Invalidate to ensure we have the correct count
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread", userId],
            });
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Successfully subscribed to real-time notifications for user:", userId);
          } else if (status === "CHANNEL_ERROR") {
            console.error("⚠️ Error subscribing to notifications channel:", err);
          } else if (status === "TIMED_OUT") {
            console.warn("⏱️ Subscription timed out, will retry on next effect run");
            // Don't retry subscribe() on same channel - it will cause error
            // The useEffect will recreate the channel if dependencies change
          } else if (status === "CLOSED") {
            console.warn("🔌 Channel closed, will reconnect on next mount");
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn("Failed to set up real-time notifications:", err);
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current && supabase) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }
    };
  }, [userId, supabase, queryClient]);

  // Track count changes for initial load (don't show toast on initial load)
  useEffect(() => {
    if (!isLoading && typeof unreadCount === "number") {
      previousCountRef.current = unreadCount;
    }
  }, [unreadCount, isLoading]);

  return {
    unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch: async () => {
      await refetch();
    },
  };
}
