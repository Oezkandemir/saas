"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getUserNotifications } from "@/actions/user-profile-actions";
import { useSupabase } from "@/components/supabase-provider";
import { usePathname } from "@/i18n/routing";
import { logger } from "@/lib/logger";

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
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant bell-like sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      600,
      audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSettingUpRef = useRef<boolean>(false); // Prevent multiple simultaneous setup attempts
  const router = useRouter();
  const pathname = usePathname();
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
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Realtime handles updates, no need to refetch on focus
    refetchInterval: false, // Disable automatic polling - rely on realtime instead
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
      // If channel is already joined, joining, or we're in the process of setting up, don't create a new one
      if (
        channelState === "joined" ||
        channelState === "joining" ||
        isSubscribedRef.current ||
        isSettingUpRef.current
      ) {
        // Channel is already active or being set up, don't create a new one
        return;
      }
      // Channel exists but is not active, clean it up
      try {
        supabase.removeChannel(channelRef.current);
      } catch (_err) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Setup realtime subscription with proper error handling
    const setupRealtime = async () => {
      // Prevent multiple simultaneous setup attempts
      if (isSettingUpRef.current) {
        return;
      }

      // Check if channel already exists and is subscribed
      if (channelRef.current) {
        const channelState = channelRef.current.state;
        if (channelState === "joined" || channelState === "joining") {
          // Channel is already active, don't create a new one
          return;
        }
        // Channel exists but is not active, clean it up first
        try {
          await supabase.removeChannel(channelRef.current);
        } catch (_err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }

      isSettingUpRef.current = true;

      try {
        // Create new channel for real-time notifications
        // Use consistent channel name per user (not timestamp-based) to avoid conflicts
        const channelName = `notifications:${userId}`;

        // Create channel instance first
        let channel = supabase.channel(channelName);

        // Set channel ref IMMEDIATELY after creation to prevent race conditions
        // This ensures that if setupRealtime is called again, it will see the channel
        channelRef.current = channel;

        // Configure channel event handlers
        // Remove filter to avoid binding mismatch - we'll filter in the handler instead
        channel = channel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "user_notifications",
            },
            async (payload) => {
              // Verify payload structure first
              if (!payload || !payload.new) {
                return;
              }

              const newNotification = payload.new as {
                read?: boolean;
                title?: string;
                content?: string;
                id?: string;
                type?: string;
                user_id?: string;
              };

              // Verify this notification is for the current user
              // Filter in handler instead of using filter parameter to avoid binding mismatch
              if (
                !newNotification.user_id ||
                newNotification.user_id !== userId
              ) {
                return;
              }

              // Only process if notification is unread
              if (!newNotification.read) {
                // Increment count immediately (optimistic update)
                queryClient.setQueryData<number>(
                  ["notifications", "unread", userId],
                  (oldCount = 0) => oldCount + 1
                );

                // Check if user is currently on a ticket/conversation page
                // Don't show toast if user is already viewing a ticket conversation
                // Handle both locale-prefixed paths (e.g., /de/admin/support/123) and non-prefixed paths
                const normalizedPathname = pathname || "";
                const isOnTicketPage =
                  normalizedPathname.includes("/support/") ||
                  normalizedPathname.includes("/admin/support/") ||
                  normalizedPathname.match(/\/support\/[^/]+$/) !== null ||
                  normalizedPathname.match(/\/admin\/support\/[^/]+$/) !== null;

                // Only show toast and play sound if NOT on ticket page
                if (!isOnTicketPage) {
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
                    }
                  );
                }

                // Invalidate queries to trigger refetch (more efficient than direct refetch)
                queryClient.invalidateQueries({
                  queryKey: ["notifications", "unread", userId],
                });
              } else {
                // Even if read, invalidate to ensure consistency
                queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
              }
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
            async () => {
              // Notification updated (e.g., marked as read) - invalidate to trigger refetch
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

              // Invalidate to trigger refetch
              queryClient.invalidateQueries({
                queryKey: ["notifications", "unread", userId],
              });
            }
          );

        // Check again before subscribing to ensure channel hasn't been cleaned up or already subscribed
        if (channelRef.current !== channel) {
          // Channel was replaced, don't subscribe
          isSettingUpRef.current = false;
          // Clean up the channel we created but won't use
          try {
            await supabase.removeChannel(channel);
          } catch (_cleanupErr) {
            // Ignore cleanup errors
          }
          return;
        }

        // Double-check channel state before subscribing to prevent double subscription
        const currentState = channel.state;
        if (currentState === "joined" || currentState === "joining") {
          // Channel is already subscribed or in the process, don't subscribe again
          isSettingUpRef.current = false;
          isSubscribedRef.current = currentState === "joined";
          return;
        }

        // Subscribe to the channel
        channel.subscribe((status, err) => {
          // Reset setup flag in all cases
          isSettingUpRef.current = false;

          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          } else if (status === "CHANNEL_ERROR") {
            isSubscribedRef.current = false;
            // Only log error if err is actually provided and meaningful
            if (err) {
              logger.error("Error subscribing to notifications channel:", err);
            } else {
              logger.warn("Notifications channel error (no details provided)");
            }
            // Invalidate to trigger refetch as fallback
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread", userId],
            });
            // Attempt to reconnect after a delay (only if not already reconnecting)
            if (!reconnectTimeoutRef.current && userId && supabase) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (channelRef.current?.state !== "joined") {
                  setupRealtime();
                }
              }, 5000);
            }
          } else if (status === "TIMED_OUT") {
            isSubscribedRef.current = false;
            logger.warn(
              "Notifications channel subscription timed out, will retry"
            );
            // Attempt to reconnect (only if not already reconnecting)
            if (!reconnectTimeoutRef.current && userId && supabase) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (channelRef.current?.state !== "joined") {
                  setupRealtime();
                }
              }, 5000);
            }
          } else if (status === "CLOSED") {
            isSubscribedRef.current = false;
            logger.debug("Notifications channel closed, will reconnect");
            // Attempt to reconnect (only if not already reconnecting)
            if (!reconnectTimeoutRef.current && userId && supabase) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (channelRef.current?.state !== "joined") {
                  setupRealtime();
                }
              }, 2000);
            }
          }
        });
      } catch (err) {
        isSubscribedRef.current = false;
        isSettingUpRef.current = false;
        // Clean up channel if it was created
        if (channelRef.current && supabase) {
          try {
            await supabase.removeChannel(channelRef.current);
          } catch (_cleanupErr) {
            // Ignore cleanup errors
          }
        }
        channelRef.current = null;
        // Only log if err is meaningful
        if (err instanceof Error) {
          logger.error("❌ Failed to set up real-time notifications:", err);
        } else if (err) {
          logger.error("❌ Failed to set up real-time notifications:", err);
        } else {
          logger.warn(
            "Failed to set up real-time notifications (no error details)"
          );
        }
      }
    };

    setupRealtime();

    // Cleanup on unmount
    return () => {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset setup flag
      isSettingUpRef.current = false;

      if (channelRef.current && supabase) {
        try {
          // Remove main channel - try to remove regardless of state
          // Supabase will handle cleanup even if channel is not fully joined
          supabase.removeChannel(channelRef.current).catch(() => {
            // Ignore cleanup errors - channel might already be removed
          });
        } catch (_err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [userId, supabase, queryClient, router, pathname, getTranslation]);

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
