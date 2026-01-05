"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsAsRead } from "@/actions/user-profile-actions";
import { Check, Loader2 } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import { toast } from "sonner";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { useSupabase } from "@/components/supabase-provider";
import { logger } from "@/lib/logger";

export function MarkAllAsReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refetchAll } = useNotificationsContext();
  const { session } = useSupabase();
  const userId = session?.user?.id;

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const result = await markAllNotificationsAsRead();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Optimistically set count to 0
      if (userId) {
        queryClient.setQueryData<number>(
          ["notifications", "unread", userId],
          0
        );
      }

      toast.success("Alle Benachrichtigungen als gelesen markiert", {
        description: "Alle ungelesenen Benachrichtigungen wurden aktualisiert",
      });

      // Trigger global notification updates
      await refetchAll();
      router.refresh();
    } catch (error) {
      logger.error("Error marking all as read:", error);
      
      // Revert optimistic update on error
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread", userId],
        });
      }
      
      toast.error("Fehler", {
        description: error instanceof Error 
          ? error.message 
          : "Benachrichtigungen konnten nicht als gelesen markiert werden",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllAsRead}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Check className="size-4" />
      )}
      <span className="hidden sm:inline">Mark all as read</span>
      <span className="sm:hidden">Mark all read</span>
    </Button>
  );
}
