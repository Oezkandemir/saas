import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTicketMessages, TicketMessage } from "../api/admin-support";
import { supabase } from "../lib/supabase";

export function useTicketMessagesRealtime(ticketId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["support-ticket-messages", ticketId],
    queryFn: () => getTicketMessages(ticketId),
    enabled: !!ticketId,
  });

  // Initialize messages from query
  useEffect(() => {
    if (messagesResponse?.data) {
      setMessages(messagesResponse.data);
    }
  }, [messagesResponse?.data]);

  // Set up realtime subscription
  useEffect(() => {
    if (!ticketId) return;

    const setupRealtime = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create channel for real-time ticket messages
      const channel = supabase
        .channel(`ticket-messages:${ticketId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: "" },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_ticket_messages",
            filter: `ticket_id=eq.${ticketId}`,
          },
          async (payload) => {
            console.log("📨 New message received:", payload);
            
            if (!payload.new) return;

            const newMessage = payload.new as any;
            
            // Fetch user data for the new message
            let userData = null;
            try {
              const { data } = await supabase
                .from("users")
                .select("id, email, name, avatar_url")
                .eq("id", newMessage.user_id)
                .single();
              userData = data;
            } catch (error) {
              console.warn("Could not fetch user data:", error);
            }

            const message: TicketMessage = {
              id: newMessage.id,
              ticket_id: newMessage.ticket_id,
              user_id: newMessage.user_id,
              message: newMessage.message,
              is_admin: newMessage.is_admin,
              created_at: newMessage.created_at,
              user: userData
                ? {
                    name: userData.name || "",
                    email: userData.email || "",
                    avatar_url: userData.avatar_url || null,
                  }
                : undefined,
            };

            // Add new message to state
            setMessages((prev) => [...prev, message]);
            
            // Invalidate query to ensure consistency
            queryClient.invalidateQueries({ 
              queryKey: ["support-ticket-messages", ticketId] 
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Subscribed to real-time ticket messages");
          } else if (status === "CHANNEL_ERROR") {
            console.warn("⚠️ Realtime channel error");
          }
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(console.error);
      }
    };
  }, [ticketId, queryClient]);

  return {
    messages,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ 
      queryKey: ["support-ticket-messages", ticketId] 
    }),
  };
}
