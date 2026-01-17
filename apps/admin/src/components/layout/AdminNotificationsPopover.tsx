import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, XCircle, AlertCircle, UserPlus, Mail, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { formatRelativeTime } from "../../lib/format";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { getAllNotifications, updateNotificationReadStatus, markAllNotificationsAsRead } from "../../api/admin-notifications";
import { toast } from "sonner";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export function AdminNotificationsPopover() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isEnabled, sendNotification, requestPermission, permission } = usePushNotifications();

  // Fetch unread notifications count for current admin user
  const { data: unreadResponse, refetch: refetchUnread } = useQuery({
    queryKey: ["admin-notifications", "unread", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const result = await getAllNotifications({
          page: 1,
          pageSize: 100,
          userId: user.id,
          read: false,
        });
        if (result.success && result.data) {
          return result.data.data || [];
        }
        console.error("Failed to fetch notifications:", result.error);
        return [];
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch recent notifications when popover is open
  const { data: notificationsResponse, refetch } = useQuery({
    queryKey: ["admin-notifications", "recent", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const result = await getAllNotifications({
          page: 1,
          pageSize: 10,
          userId: user.id,
        });
        if (result.success && result.data) {
          console.log("Fetched notifications:", result.data.data?.length || 0);
          return result.data.data || [];
        }
        console.error("Failed to fetch notifications:", result.error);
        return [];
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    enabled: open && !!user?.id,
    staleTime: 0, // Always refetch when popover opens
  });

  // Refetch when popover opens
  useEffect(() => {
    if (open && user?.id) {
      refetch();
      refetchUnread();
    }
  }, [open, user?.id, refetch, refetchUnread]);

  const updateReadStatus = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      updateNotificationReadStatus(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      refetch();
      refetchUnread();
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not found");
      const result = await markAllNotificationsAsRead(user.id);
      if (!result.success) {
        throw new Error(result.error || "Failed to mark notifications as read");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      refetch();
      refetchUnread();
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark notifications as read");
    },
  });

  const unreadCount = unreadResponse?.length || 0;
  const notifications = notificationsResponse || [];

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Refetch notifications when changes occur
          console.log("Notification change detected:", payload);
          
          // Check current push notification setting (including unsaved edits)
          const getCurrentPushEnabled = () => {
            const immediateValue = localStorage.getItem("notifications.push_enabled.immediate");
            if (immediateValue !== null) {
              return immediateValue === "true";
            }
            // Check query cache for latest setting
            const cachedSettings = queryClient.getQueryData<{ data: Array<{ key: string; value: string }> }>(["system-settings"]);
            if (cachedSettings?.data) {
              const setting = cachedSettings.data.find(s => s.key === "notifications.push_enabled");
              return setting?.value === "true";
            }
            return isEnabled; // Fallback to hook value
          };
          
          const currentPushEnabled = getCurrentPushEnabled() && isEnabled;
          
          // Send browser push notification for new notifications
          if (payload.eventType === "INSERT" && payload.new) {
            const newNotification = payload.new as any;
            // Only send push notification if popover is closed (user might not be viewing the app)
            // or if push notifications are enabled
            if (currentPushEnabled && (!open || document.hidden)) {
              try {
                await sendNotification({
                  id: newNotification.id,
                  title: newNotification.title || "New Notification",
                  content: newNotification.content || "",
                  type: newNotification.type,
                  action_url: newNotification.action_url,
                  created_at: newNotification.created_at,
                });
              } catch (error) {
                console.error("Failed to send push notification:", error);
              }
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          if (open) {
            refetch();
          }
          refetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, isEnabled, open, sendNotification]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SYSTEM":
      case "SECURITY":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "SUPPORT":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case "WELCOME":
      case "USER":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "MAIL":
      case "EMAIL":
        return <Mail className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      updateReadStatus.mutate({ id: notification.id, read: true });
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {!isEnabled && permission.state === "default" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const granted = await requestPermission();
                  if (granted) {
                    toast.success("Push notifications enabled");
                  } else {
                    toast.error("Failed to enable push notifications");
                  }
                }}
                title="Enable browser push notifications"
              >
                🔔
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  navigate("/notifications");
                  setOpen(false);
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
