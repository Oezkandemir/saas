"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { logger } from "@/lib/logger";

export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface UseTypingIndicatorResult {
  typingUsers: TypingUser[];
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  sendTypingEvent: () => void;
}

/**
 * Real-time typing indicator hook for ticket conversations
 * Tracks when users are typing in a ticket conversation
 */
export function useTypingIndicator(
  ticketId: string,
  currentUserId: string,
  currentUserName: string
): UseTypingIndicatorResult {
  const supabaseContext = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isSettingUpRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEventRef = useRef<number>(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTypingState] = useState(false);

  const supabase = supabaseContext?.supabase;
  const TYPING_TIMEOUT = 3000; // 3 seconds of inactivity = stop typing
  const TYPING_THROTTLE = 1000; // Only send typing event max once per second

  // Set up real-time typing indicator subscription
  useEffect(() => {
    if (!ticketId || !currentUserId || !supabase) {
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

    // Check if channel already exists and is subscribed
    if (channelRef.current) {
      const channelState = channelRef.current.state;
      if (
        channelState === "joined" ||
        channelState === "joining" ||
        isSubscribedRef.current ||
        isSettingUpRef.current
      ) {
        return;
      }
      try {
        supabase.removeChannel(channelRef.current);
      } catch (_err) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    const setupRealtime = async () => {
      if (isSettingUpRef.current) {
        return;
      }

      if (channelRef.current) {
        const channelState = channelRef.current.state;
        if (channelState === "joined" || channelState === "joining") {
          return;
        }
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
        const channelName = `typing-indicator:${ticketId}`;
        // Use a consistent channel name per ticket (not timestamp-based) for broadcast
        // Configure channel for broadcast events
        let channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false }, // Don't receive our own broadcasts
            presence: { key: "" },
          },
        });

        channelRef.current = channel;

        // Listen for typing events from other users
        channel = channel.on("broadcast", { event: "typing" }, (payload) => {
          const { userId, userName, timestamp } = payload.payload as {
            userId: string;
            userName: string;
            timestamp: number;
          };

          // Ignore our own typing events
          if (userId === currentUserId) {
            return;
          }

          // Add or update typing user
          setTypingUsers((prev) => {
            const existing = prev.find((u) => u.userId === userId);
            if (existing) {
              // Update timestamp
              return prev.map((u) =>
                u.userId === userId ? { ...u, timestamp } : u
              );
            } else {
              // Add new typing user
              return [...prev, { userId, userName, timestamp }];
            }
          });

          // Remove typing user after timeout
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
          }, TYPING_TIMEOUT);
        });

        // Check before subscribing
        if (channelRef.current !== channel) {
          isSettingUpRef.current = false;
          return;
        }

        const currentState = channel.state;
        if (currentState === "joined" || currentState === "joining") {
          isSettingUpRef.current = false;
          isSubscribedRef.current = currentState === "joined";
          return;
        }

        // Subscribe to the channel
        channel.subscribe((status, err) => {
          isSettingUpRef.current = false;

          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
          } else if (status === "CHANNEL_ERROR") {
            isSubscribedRef.current = false;
            logger.error("Error subscribing to typing indicator channel:", err);
          }
        });
      } catch (err) {
        isSubscribedRef.current = false;
        isSettingUpRef.current = false;
        channelRef.current = null;
        logger.error("❌ Failed to set up typing indicator:", err);
      }
    };

    setupRealtime();

    return () => {
      if (channelRef.current && supabase) {
        try {
          const channelState = channelRef.current.state;
          if (channelState === "joined" || channelState === "joining") {
            supabase.removeChannel(channelRef.current);
          }
        } catch (_err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [ticketId, currentUserId, supabase]);

  // Clean up expired typing users
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => now - user.timestamp < TYPING_TIMEOUT)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Send typing event to other users
  const sendTypingEvent = useCallback(() => {
    if (!channelRef.current || !isSubscribedRef.current) {
      return;
    }

    const now = Date.now();
    // Throttle typing events
    if (now - lastTypingEventRef.current < TYPING_THROTTLE) {
      return;
    }

    lastTypingEventRef.current = now;

    try {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          timestamp: now,
        },
      } as any);
    } catch (err) {
      logger.error("Error sending typing event:", err);
    }
  }, [currentUserId, currentUserName]);

  // Handle typing state changes
  const setIsTyping = useCallback(
    (typing: boolean) => {
      setIsTypingState(typing);
      if (typing) {
        sendTypingEvent();
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          setIsTypingState(false);
        }, TYPING_TIMEOUT);
      } else {
        // Clear timeout when stopping typing
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    },
    [sendTypingEvent]
  );

  return {
    typingUsers,
    isTyping,
    setIsTyping,
    sendTypingEvent,
  };
}
