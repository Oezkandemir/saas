"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsAsRead } from "@/actions/user-profile-actions";
import { Check, Loader2 } from "lucide-react";

import { Button } from '@/components/alignui/actions/button';
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsContext } from "@/components/context/notifications-context";

export function MarkAllAsReadButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refetchAll } = useNotificationsContext();

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const result = await markAllNotificationsAsRead();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "default",
      });

      // Trigger global notification updates
      await refetchAll();
      router.refresh();
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
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
