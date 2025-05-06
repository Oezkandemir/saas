"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { markAllNotificationsAsRead } from "@/actions/user-profile-actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function MarkAllAsReadButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Check className="mr-2 h-4 w-4" />
      )}
      Mark all as read
    </Button>
  );
} 