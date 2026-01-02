"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteAllNotifications,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  UserNotification,
} from "@/actions/user-profile-actions";
import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  X,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useNotificationsContext } from "@/components/context/notifications-context";
import { useSupabase } from "@/components/supabase-provider";
import { logger } from "@/lib/logger";

interface NotificationsPopoverProps {
  children: React.ReactNode;
}

// Helper to get icon based on notification type
export function getNotificationIcon(type: string) {
  // Normalize type - handle both enum and string versions
  const normalizedType = type.toUpperCase();

  switch (normalizedType) {
    case "SYSTEM":
      return <Bell className="size-4 text-blue-500" />;
    case "BILLING":
      return <Bell className="size-4 text-purple-500" />;
    case "SUPPORT":
      return <Bell className="size-4 text-yellow-500" />;
    case "SUCCESS":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "WELCOME":
      return <Bell className="size-4 text-pink-500" />;
    case "TEAM":
      return <Bell className="size-4 text-indigo-500" />;
    case "FOLLOW":
      return <Users className="size-4 text-blue-600" />;
    default:
      return <Bell className="size-4 text-gray-500" />;
  }
}

export function NotificationsPopover({ children }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<
    string | null
  >(null);
  const router = useRouter();
  const { toast } = useToast();
  const { refetch: refetchUnreadCount } = useNotifications();
  const { refetchAll } = useNotificationsContext();
  const t = useTranslations("Notifications");
  const { supabase, session } = useSupabase();

  // Fetch notifications when popover is opened
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications", "popover"],
    queryFn: async () => {
      try {
        const result = await getUserNotifications(false);
        if (result.success && result.data) {
          // Sort by created_at date (newest first) and limit to 5
          return result.data
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 5);
        }
        return [];
      } catch (err) {
        logger.error("Error fetching popover notifications", err);
        return [];
      }
    },
    enabled: open, // Only fetch when popover is open
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (notifications change frequently)
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Listen for notification changes from other components
  useEffect(() => {
    const handleNotificationsChanged = () => {
      if (open) {
        refetch();
      }
    };

    window.addEventListener(
      "notifications-changed",
      handleNotificationsChanged,
    );
    return () => {
      window.removeEventListener(
        "notifications-changed",
        handleNotificationsChanged,
      );
    };
  }, [open, refetch]);

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      const result = await markAllNotificationsAsRead();

      if (!result.success) {
        throw new Error(result.error || "Failed to update notifications");
      }

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });

      // Refetch all notifications data
      await refetchAll();
      await refetch();
      router.refresh();
    } catch (error) {
      logger.error("Error marking all as read", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark notifications as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearingAll(true);
      // Use the fixed deleteAllNotifications function
      const result = await deleteAllNotifications();

      if (!result.success) {
        throw new Error(result.error || "Failed to clear notifications");
      }

      toast({
        title: "Success",
        description: "All notifications cleared",
      });

      // The UI will update automatically via notifications context
      await refetchAll();
      await refetch();
      router.refresh();
    } catch (error) {
      logger.error("Error clearing notifications", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to clear notifications",
        variant: "destructive",
      });
    } finally {
      setClearingAll(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const result = await markNotificationAsRead(notificationId);

      if (!result.success) {
        throw new Error(result.error || "Failed to mark notification as read");
      }

      toast({
        title: "Success",
        description: "Notification marked as read",
        variant: "default",
      });

      // Trigger notification updates
      await refetchAll();
    } catch (error) {
      logger.error("Error marking notification as read", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setDeletingNotification(notificationId);
      // Use the fixed deleteNotification function
      const result = await deleteNotification(notificationId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete notification");
      }

      toast({
        title: "Success",
        description: "Notification removed",
        variant: "default",
      });

      // Manually trigger updates
      await refetchAll();
    } catch (error) {
      logger.error("Error deleting notification", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete notification",
        variant: "destructive",
      });
    } finally {
      setDeletingNotification(null);
    }
  };

  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.read,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[350px] p-0 shadow-lg"
        align="end"
        side="bottom"
        sideOffset={8}
        onInteractOutside={(e) => {
          // Only close when clicking outside the popover
          setOpen(false);
        }}
        onEscapeKeyDown={() => setOpen(false)}
      >
        <div className="flex items-center justify-between p-4">
          <h4 className="text-sm font-medium">Notifications</h4>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                {hasUnreadNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-xs font-medium"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllAsRead}
                    title="Mark all as read"
                  >
                    {markingAllAsRead ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 size-3" />
                    )}
                    Mark all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs font-medium text-red-500 hover:bg-red-50/30 hover:text-red-600"
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  title="Clear all notifications"
                >
                  {clearingAll ? (
                    <Loader2 className="mr-1.5 size-3 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-3" />
                  )}
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
        <Separator />
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notification: UserNotification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex flex-col gap-1.5 border-b border-border p-4 text-sm last:border-0",
                      !notification.read && "bg-muted/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <span className="line-clamp-1 font-medium">
                          {notification.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Badge
                            variant="default"
                            className="bg-blue-500 text-xs"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistance(
                        new Date(notification.created_at),
                        new Date(),
                        { addSuffix: true },
                      )}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs">
                      {notification.content}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          <ExternalLink className="size-3" />
                          View details
                        </Link>
                      )}

                      <div className="ml-auto flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-green-500 hover:bg-green-50/30 hover:text-green-600"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markingAsRead === notification.id}
                            title="Mark as read"
                          >
                            {markingAsRead === notification.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-red-500 hover:bg-red-50/30 hover:text-red-600"
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          disabled={deletingNotification === notification.id}
                          title="Delete notification"
                        >
                          {deletingNotification === notification.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {notification !==
                      notifications[notifications.length - 1] && (
                      <Separator className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-2 rounded-full bg-muted p-3">
                  <Bell className="size-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No notifications</p>
                <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                  You don&apos;t have any notifications at the moment.
                </p>
              </div>
            )}
          </ScrollArea>
        )}
        <Separator />
        <div className="p-3">
          <Link
            href="/profile/notifications"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-muted/50 p-2 text-center text-xs font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Bell className="size-3.5" />
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
