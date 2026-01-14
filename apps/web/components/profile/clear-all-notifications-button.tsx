"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAllNotifications } from "@/actions/user-profile-actions";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { useSupabase } from "@/components/supabase-provider";

export function ClearAllNotificationsButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refetchAll } = useNotificationsContext();
  const queryClient = useQueryClient();
  const { session } = useSupabase();
  const userId = session?.user?.id;

  const handleClearAllNotifications = async () => {
    setLoading(true);
    try {
      // Optimistically set count to 0 immediately
      if (userId) {
        queryClient.setQueryData<number>(
          ["notifications", "unread", userId],
          0,
        );
      }

      const result = await deleteAllNotifications();

      if (!result.success) {
        // Revert optimistic update on error
        if (userId) {
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread", userId],
          });
        }
        throw new Error(result.error || "Failed to clear notifications");
      }

      toast({
        title: "Success",
        description: "All notifications cleared",
        variant: "default",
      });

      // Trigger global notification updates
      await refetchAll();
      router.refresh();
    } catch (error) {
      logger.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to clear notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearAllNotifications}
      disabled={loading}
      className="w-full sm:w-auto text-red-500 hover:bg-red-100/30 hover:text-red-600"
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 size-4" />
      )}
      Clear All
    </Button>
  );
}
