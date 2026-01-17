import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  getActivityFeed,
  getAuditLogs,
  getCombinedActivityLogs,
  type ActivityLog,
} from "../api/admin-activity";
import { supabase } from "../lib/supabase";

export function useActivityFeed(limit?: number, enableRealtime = true) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: ["activity-feed", limit],
    queryFn: () => getCombinedActivityLogs({ limit: limit || 500 }),
    refetchInterval: enableRealtime ? false : 30000, // Only auto-refresh if realtime is disabled
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const setupRealtime = async () => {
      // Clean up existing channels
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a single channel for both tables
      const channel = supabase
        .channel("activity-realtime", {
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
            table: "audit_logs",
          },
          () => {
            // Invalidate and refetch when new activity is added
            queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_activity_logs",
          },
          () => {
            // Invalidate and refetch when new activity is added
            queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Subscribed to real-time activity updates");
          } else if (status === "CHANNEL_ERROR") {
            console.warn("⚠️ Realtime channel error, will retry on next refresh");
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
  }, [enableRealtime, queryClient]);

  return query;
}

export function useAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => getAuditLogs(filters),
  });
}
