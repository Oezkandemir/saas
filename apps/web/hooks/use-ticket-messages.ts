"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { TicketMessage } from "@/actions/support-ticket-actions";
import { useSupabase } from "@/components/supabase-provider";
import { logger } from "@/lib/logger";

export interface UseTicketMessagesResult {
  messages: TicketMessage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addMessageOptimistically: (message: TicketMessage) => void;
}

/**
 * Real-time ticket messages hook with Supabase Realtime
 * Automatically updates when new messages are added to a ticket
 */
export function useTicketMessages(
  ticketId: string,
  initialMessages: TicketMessage[] = []
): UseTicketMessagesResult {
  const supabaseContext = useSupabase();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const isSettingUpRef = useRef<boolean>(false);
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = supabaseContext?.supabase;
  const session = supabaseContext?.session;
  const userId = session?.user?.id;

  // Set up real-time subscription for instant message updates
  useEffect(() => {
    if (!ticketId || !userId || !supabase) {
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
        // Create new channel for real-time ticket messages
        // Use consistent channel name per ticket (not timestamp-based) to avoid conflicts
        const channelName = `ticket-messages:${ticketId}`;

        logger.debug(
          `🔌 Setting up realtime subscription for ticket ${ticketId}`
        );

        // Create channel instance first
        // For postgres_changes, we don't need broadcast/presence config
        let channel = supabase.channel(channelName);

        // Set channel ref IMMEDIATELY after creation to prevent race conditions
        channelRef.current = channel;

        console.log(`[Realtime] Created channel: ${channelName}`);

        // Configure channel event handlers
        // Use filter to only receive messages for this specific ticket
        // This reduces unnecessary events and improves performance
        channel = channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_ticket_messages",
            filter: `ticket_id=eq.${ticketId}`,
          },
          async (payload) => {
            try {
              logger.debug("📨 Received new message via realtime:", payload);
              console.log("[Realtime] 📨 Received message payload:", payload);
              console.log("[Realtime] Payload type:", typeof payload);
              console.log(
                "[Realtime] Payload keys:",
                Object.keys(payload || {})
              );

              if (!payload || !payload.new) {
                console.error(
                  "[Realtime] ❌ Invalid payload structure:",
                  payload
                );
                return;
              }

              const newMessage = payload.new as {
                id: string;
                ticket_id: string;
                user_id: string;
                message: string;
                is_admin: boolean;
                created_at: string;
              };

              console.log(`[Realtime] 📝 Parsed message:`, {
                id: newMessage.id,
                ticket_id: newMessage.ticket_id,
                user_id: newMessage.user_id,
                message: `${newMessage.message?.substring(0, 50)}...`,
              });

              // Verify this message is for the current ticket (should already be filtered, but double-check)
              if (newMessage.ticket_id !== ticketId) {
                logger.debug(
                  `Message ticket_id ${newMessage.ticket_id} doesn't match current ticket ${ticketId}`
                );
                console.log(
                  `[Realtime] ⏭️ Skipping message - ticket_id mismatch: ${newMessage.ticket_id} vs ${ticketId}`
                );
                return;
              }

              console.log(
                `[Realtime] ✅ Processing message ${newMessage.id} for ticket ${ticketId} from user ${newMessage.user_id}`
              );

              // Process ALL messages, including own messages
              // This ensures both users see messages immediately via realtime
              // The duplicate check below will prevent adding the same message twice
              // IMPORTANT: Don't filter out own messages - we want to see them immediately via realtime

              logger.debug(
                `✅ Processing new message ${newMessage.id} for ticket ${ticketId} from user ${newMessage.user_id}`
              );
              console.log(
                `[Realtime] ✅ Processing message ${newMessage.id} - is own: ${newMessage.user_id === userId}`
              );

              // Add message immediately (optimistic update) to show it right away
              // We'll fetch user data in the background
              const tempMessage: TicketMessage = {
                id: newMessage.id,
                ticket_id: newMessage.ticket_id,
                user_id: newMessage.user_id,
                message: newMessage.message,
                is_admin: newMessage.is_admin,
                created_at: newMessage.created_at,
                // User data will be fetched below
              };

              // Add message immediately to show it right away
              setMessages((prev) => {
                // Check if message already exists (prevent duplicates)
                if (prev.some((msg) => msg.id === newMessage.id)) {
                  logger.debug(
                    `Message ${newMessage.id} already exists, skipping`
                  );
                  return prev;
                }
                logger.debug(`Adding new message ${newMessage.id} to state`);
                return [...prev, tempMessage];
              });

              // Scroll to bottom immediately
              setTimeout(() => {
                const messagesContainer = document.getElementById(
                  "ticket-messages-container"
                );
                if (messagesContainer) {
                  messagesContainer.scrollTo({
                    top: messagesContainer.scrollHeight,
                    behavior: "smooth",
                  });
                }
              }, 50);

              // Fetch full message with user data in the background
              try {
                const { data: messageData, error: fetchError } = await supabase
                  .from("support_ticket_messages")
                  .select(
                    `
                    *,
                    user:users(name, email, avatar_url)
                  `
                  )
                  .eq("id", newMessage.id)
                  .single();

                if (fetchError || !messageData) {
                  logger.warn(
                    "Failed to fetch new message details:",
                    fetchError
                  );
                  // Keep the temp message even if fetch fails
                  return;
                }

                // Update message with user data
                setMessages((prev) => {
                  return prev.map((msg) =>
                    msg.id === newMessage.id
                      ? (messageData as TicketMessage)
                      : msg
                  );
                });
                logger.debug(
                  `✅ Updated message ${newMessage.id} with user data`
                );
              } catch (err) {
                logger.error("Error fetching message user data:", err);
                // Keep the temp message even if fetch fails
              }
            } catch (err) {
              logger.error("Error processing realtime message payload:", err);
            }
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

        // Subscribe to the channel with detailed logging
        console.log(
          `[Realtime] 🔌 Attempting to subscribe to ticket ${ticketId}...`
        );
        channel.subscribe((status, err) => {
          // Reset setup flag in all cases
          isSettingUpRef.current = false;

          console.log(
            `[Realtime] 📡 Subscription status for ticket ${ticketId}:`,
            status,
            err ? JSON.stringify(err, null, 2) : ""
          );

          if (status === "SUBSCRIBED") {
            isSubscribedRef.current = true;
            setError(null);
            logger.debug(
              `✅ Successfully subscribed to ticket messages channel for ticket ${ticketId}`
            );
            console.log(
              `[Realtime] ✅ Successfully subscribed to ticket ${ticketId} messages`
            );
            console.log(`[Realtime] Channel state:`, channel.state);
            console.log(`[Realtime] Channel name: ${channelName}`);
            console.log(
              `[Realtime] Listening for INSERT events on support_ticket_messages with filter: ticket_id=eq.${ticketId}`
            );
          } else if (status === "CHANNEL_ERROR") {
            isSubscribedRef.current = false;
            logger.error(`❌ Channel error for ticket ${ticketId}:`, err);
            console.error(
              `[Realtime] ❌ Channel error for ticket ${ticketId}:`,
              err
            );
            console.error(
              `[Realtime] Error details:`,
              JSON.stringify(err, null, 2)
            );
            // Only log error if err is actually provided and meaningful
            if (err) {
              logger.error(
                "Error subscribing to ticket messages channel:",
                err
              );
            } else {
              logger.warn(
                "Ticket messages channel error (no details provided)"
              );
            }
            setError("Failed to connect to real-time updates");
          } else if (status === "TIMED_OUT") {
            isSubscribedRef.current = false;
            logger.warn("Ticket messages channel subscription timed out");
            console.warn(
              `[Realtime] ⏱️ Subscription timed out for ticket ${ticketId}`
            );
          } else if (status === "CLOSED") {
            isSubscribedRef.current = false;
            logger.debug("Ticket messages channel closed");
            console.log(`[Realtime] 🔒 Channel closed for ticket ${ticketId}`);
          } else {
            console.log(
              `[Realtime] ⚠️ Unknown status "${status}" for ticket ${ticketId}`
            );
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
          logger.error("❌ Failed to set up real-time ticket messages:", err);
        } else if (err) {
          logger.error("❌ Failed to set up real-time ticket messages:", err);
        } else {
          logger.warn(
            "Failed to set up real-time ticket messages (no error details)"
          );
        }
        setError("Failed to set up real-time updates");
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
        } catch (_err) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [ticketId, userId, supabase]);

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Fallback: Poll for new messages every 2 seconds as backup
  // This ensures messages appear even if Realtime subscription fails or is slow
  useEffect(() => {
    if (!ticketId || !userId || !supabase) {
      return;
    }

    // Always poll as backup (even if subscribed, in case Realtime is slow)
    const pollInterval = setInterval(async () => {
      try {
        // Fetch latest messages to check for new ones
        const { data: latestMessages, error } = await supabase
          .from("support_ticket_messages")
          .select(
            `
            *,
            user:users(name, email, avatar_url)
          `
          )
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });

        if (!error && latestMessages) {
          setMessages((prev) => {
            // Check if we have new messages
            const prevIds = new Set(prev.map((m) => m.id));
            const newMessages = latestMessages.filter(
              (m) => !prevIds.has(m.id)
            ) as TicketMessage[];

            if (newMessages.length > 0) {
              console.log(
                `[Fallback Polling] ✅ Found ${newMessages.length} new message(s) via polling`
              );
              // Return all messages (latestMessages is already sorted)
              return latestMessages as TicketMessage[];
            }

            return prev;
          });
        }
      } catch (err) {
        // Silently fail - this is just a fallback
        console.debug("[Fallback] Polling error (ignored):", err);
      }
    }, 2000); // Poll every 2 seconds as backup

    return () => clearInterval(pollInterval);
  }, [ticketId, userId, supabase]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["ticket-messages", ticketId],
      });
    } catch (err) {
      logger.error("Error refetching messages:", err);
      setError("Failed to refresh messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add message optimistically (for immediate display)
  const addMessageOptimistically = (message: TicketMessage) => {
    setMessages((prev) => {
      // Check if message already exists (prevent duplicates)
      if (prev.some((msg) => msg.id === message.id)) {
        logger.debug(
          `Message ${message.id} already exists, skipping optimistic add`
        );
        return prev;
      }
      logger.debug(`Adding message ${message.id} optimistically`);
      console.log(`[Optimistic] Adding message ${message.id} to state`);
      return [...prev, message];
    });

    // Scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.getElementById(
        "ticket-messages-container"
      );
      if (messagesContainer) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  return {
    messages,
    isLoading,
    error,
    refetch,
    addMessageOptimistically,
  };
}
