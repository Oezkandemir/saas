"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAllNotifications } from "@/actions/user-profile-actions";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsContext } from "@/components/context/notifications-context";

export function ClearAllNotificationsButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refetchAll } = useNotificationsContext();

  const handleClearAllNotifications = async () => {
    setLoading(true);
    try {
      const result = await deleteAllNotifications();

      if (!result.success) {
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
      console.error("Error clearing notifications:", error);
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
