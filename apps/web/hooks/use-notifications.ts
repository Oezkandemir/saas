"use client";

import { createElement, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserNotifications } from "@/actions/user-profile-actions";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { useSupabase } from "@/components/supabase-provider";

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
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant bell-like sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      600,
      audioContext.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    // Fallback: use a simple beep if Web Audio API is not available
    logger.warn("Could not play notification sound:", err);
  }
}

export function useNotifications(): UseNotificationsResult {
  const supabaseContext = useSupabase();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const router = useRouter();
  const previousCountRef = useRef<number>(0);

  // Translation fallbacks (useTranslations might not be available in all contexts)
  const getTranslation = (key: string): string => {
    const translations: Record<string, string> = {
      newNotification: "Neue Benachrichtigung",
      newNotificationDescription:
        "Sie haben eine neue Benachrichtigung erhalten",
      viewAll: "Öffnen",
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
          const count = result.data.length;
          logger.debug(`📊 Fetched unread notification count: ${count}`);
          return count;
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
        logger.error("Error fetching notifications", err);
        return 0;
      }
    },
    staleTime: 0, // Always consider stale so realtime updates are reflected immediately
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: true, // Refetch on focus as backup
    refetchInterval: 2000, // Poll every 2 seconds as fallback (works even if realtime fails)
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
        isSubscribedRef.current = false;
      }
      return;
    }

    // ⚡ CRITICAL: Check if channel already exists and is subscribed
    // This prevents double subscription in React Strict Mode
    if (channelRef.current) {
      const channelState = channelRef.current.state;
      if (channelState === "joined" || channelState === "joining") {
        // Channel is already active, don't create a new one
        return;
      }
      // Channel exists but is not active, clean it up
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Setup realtime subscription with proper error handling
    const setupRealtime = async () => {
      try {
        // Create new channel for real-time notifications
        const channelName = `notifications:${userId}:${Date.now()}`;
        logger.debug(`🔧 Setting up realtime channel: ${channelName}`);
        
        // Try with filter first
        let channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "user_notifications",
              filter: `user_id=eq.${userId}`,
            },
            async (payload) => {
              logger.debug("🔔 Real-time INSERT event received:", payload);
              const newNotification = payload.new as {
                read?: boolean;
                title?: string;
                content?: string;
                id?: string;
                type?: string;
                user_id?: string;
              };

              // Verify this notification is for the current user
              if (newNotification.user_id !== userId) {
                logger.debug("Notification is for different user, ignoring");
                return;
              }

              // Only process if notification is unread
              if (!newNotification.read) {
                // Increment count immediately (optimistic update)
                queryClient.setQueryData<number>(
                  ["notifications", "unread", userId],
                  (oldCount = 0) => {
                    const newCount = oldCount + 1;
                    logger.debug(`📊 Updated unread count: ${oldCount} -> ${newCount}`);
                    return newCount;
                  },
                );

                // Play notification sound
                playNotificationSound();

                // Show toast notification with link
                toast.success(
                  newNotification.title || getTranslation("newNotification"),
                  {
                    description:
                      newNotification.content ||
                      getTranslation("newNotificationDescription"),
                    duration: 8000,
                    icon: createElement(Bell, {
                      className: "h-5 w-5 text-blue-500",
                    }),
                    action: {
                      label: getTranslation("viewAll"),
                      onClick: () => {
                        router.push("/profile/notifications");
                      },
                    },
                    className: "border-l-4 border-l-blue-500 shadow-lg",
                  },
                );

                // Immediately refetch to ensure we have the latest count
                // Don't wait - refetch right away
                queryClient.refetchQueries({
                  queryKey: ["notifications", "unread", userId],
                }).catch(() => {
                  // Silently handle errors
                });
                queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
              } else {
                // Even if read, invalidate to ensure consistency
                queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "user_notifications",
              filter: `user_id=eq.${userId}`,
            },
          async () => {
            // Notification updated (e.g., marked as read) - immediately refetch count
            logger.debug("📝 Notification UPDATE event received");
            // Immediately refetch without delay
            queryClient.refetchQueries({
              queryKey: ["notifications", "unread", userId],
            }).catch(() => {
              // Silently handle errors
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications"],
            });
          },
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
              logger.debug("🗑️ Notification DELETE event received");
              const deletedNotification = payload.old as { read?: boolean };

              // Optimistically update count if deleted notification was unread
              if (!deletedNotification.read) {
                queryClient.setQueryData<number>(
                  ["notifications", "unread", userId],
                  (oldCount = 0) => Math.max(0, oldCount - 1),
                );
              }

            // Immediately refetch to ensure we have the correct count
            queryClient.refetchQueries({
              queryKey: ["notifications", "unread", userId],
            }).catch(() => {
              // Silently handle errors
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications"],
            });
            },
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              isSubscribedRef.current = true;
              logger.debug(
                `✅ Successfully subscribed to real-time notifications for user: ${userId}`,
              );
              logger.debug(
                `📡 Listening for changes on user_notifications where user_id = ${userId}`,
              );
            } else if (status === "CHANNEL_ERROR") {
              isSubscribedRef.current = false;
              logger.error("⚠️ Error subscribing to notifications channel:", err);
              // Try to refetch count as fallback
              queryClient.invalidateQueries({
                queryKey: ["notifications", "unread", userId],
              });
            } else if (status === "TIMED_OUT") {
              isSubscribedRef.current = false;
              logger.warn(
                "⏱️ Subscription timed out, will retry on next effect run",
              );
            } else if (status === "CLOSED") {
              isSubscribedRef.current = false;
              logger.warn("🔌 Channel closed, will reconnect on next mount");
            } else {
              logger.debug(`📡 Channel status: ${status}`, err);
            }
          });

        channelRef.current = channel;
        
        // Also set up a fallback channel that listens to ALL notifications
        // and filters client-side (in case the filter doesn't work)
        const fallbackChannelName = `notifications-fallback:${userId}:${Date.now()}`;
        const fallbackChannel = supabase
          .channel(fallbackChannelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "user_notifications",
            },
            async (payload) => {
              const newNotification = payload.new as {
                read?: boolean;
                title?: string;
                content?: string;
                id?: string;
                type?: string;
                user_id?: string;
              };

              // Only process if this notification is for the current user
              if (newNotification.user_id === userId && !newNotification.read) {
                logger.debug("🔔 Fallback channel received notification:", newNotification);
                
                // Increment count
                queryClient.setQueryData<number>(
                  ["notifications", "unread", userId],
                  (oldCount = 0) => oldCount + 1,
                );

                // Play sound and show toast
                playNotificationSound();
                toast.success(
                  newNotification.title || getTranslation("newNotification"),
                  {
                    description:
                      newNotification.content ||
                      getTranslation("newNotificationDescription"),
                    duration: 8000,
                    icon: createElement(Bell, {
                      className: "h-5 w-5 text-blue-500",
                    }),
                    action: {
                      label: getTranslation("viewAll"),
                      onClick: () => {
                        router.push("/profile/notifications");
                      },
                    },
                    className: "border-l-4 border-l-blue-500 shadow-lg",
                  },
                );

                // Immediately refetch
                queryClient.refetchQueries({
                  queryKey: ["notifications", "unread", userId],
                }).catch(() => {
                  // Silently handle errors
                });
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              logger.debug("✅ Fallback channel subscribed");
            }
          });
        
        // Store fallback channel reference (we'll clean it up in the return)
        (channelRef.current as any).fallbackChannel = fallbackChannel;
      } catch (err) {
        isSubscribedRef.current = false;
        logger.error("❌ Failed to set up real-time notifications:", err);
      }
    };

    setupRealtime();

    // Cleanup on unmount
    return () => {
      if (channelRef.current && supabase) {
        try {
          // Remove main channel
          const channelState = channelRef.current.state;
          if (channelState === "joined" || channelState === "joining") {
            supabase.removeChannel(channelRef.current);
          }
          
          // Remove fallback channel if it exists
          const fallbackChannel = (channelRef.current as any).fallbackChannel;
          if (fallbackChannel) {
            supabase.removeChannel(fallbackChannel).catch(() => {
              // Ignore cleanup errors
            });
          }
        } catch (err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [userId, supabase, queryClient, router]);

  // Track count changes for initial load (don't show toast on initial load)
  useEffect(() => {
    if (!isLoading && typeof unreadCount === "number") {
      previousCountRef.current = unreadCount;
    }
  }, [unreadCount, isLoading]);

  // Aggressive polling fallback: Always poll every 1 second to ensure we get updates immediately
  // This ensures notifications work even if realtime fails
  useEffect(() => {
    if (!userId || !supabase || isLoading) return;

    // Poll every 1 second to ensure we catch any missed notifications immediately
    const pollInterval = setInterval(async () => {
      try {
        // Silently refetch without logging to avoid spam
        await queryClient.refetchQueries({
          queryKey: ["notifications", "unread", userId],
        });
      } catch (err) {
        // Silently handle errors to avoid console spam
      }
    }, 1000); // Poll every 1 second for immediate updates

    return () => clearInterval(pollInterval);
  }, [userId, supabase, isLoading, queryClient]);

  return {
    unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch: async () => {
      await refetch();
    },
  };
}
