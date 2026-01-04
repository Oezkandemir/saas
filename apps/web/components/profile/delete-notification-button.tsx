"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { deleteNotification } from "@/actions/user-profile-actions";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { useSupabase } from "@/components/supabase-provider";

interface DeleteNotificationButtonProps {
  notificationId: string;
  isUnread?: boolean;
}

export function DeleteNotificationButton({
  notificationId,
  isUnread = false,
}: DeleteNotificationButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refetchAll } = useNotificationsContext();
  const queryClient = useQueryClient();
  const { session } = useSupabase();
  const userId = session?.user?.id;

  const handleDeleteNotification = async () => {
    setLoading(true);
    try {
      // Optimistically update count if notification is unread
      if (userId && isUnread) {
        queryClient.setQueryData<number>(
          ["notifications", "unread", userId],
          (oldCount = 0) => Math.max(0, oldCount - 1)
        );
      }

      const result = await deleteNotification(notificationId);

      if (!result.success) {
        // Revert optimistic update on error
        if (userId && isUnread) {
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread", userId],
          });
        }
        throw new Error(result.error || "Failed to delete notification");
      }

      toast({
        title: "Success",
        description: "Notification deleted",
        variant: "default",
      });

      // Trigger global notification updates
      await refetchAll();
      router.refresh();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDeleteNotification}
      disabled={loading}
      className="text-red-500 hover:bg-red-100/30 hover:text-red-600"
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 size-4" />
      )}
      Delete
    </Button>
  );
}
