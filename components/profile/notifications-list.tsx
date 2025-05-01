"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { UserNotification, markNotificationAsRead } from "@/actions/user-profile-actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, CheckCircle2, Info, AlertCircle, CreditCard, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface NotificationsListProps {
  notifications: UserNotification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "system":
        return <Info className="size-5 text-blue-500" />;
      case "billing":
        return <CreditCard className="size-5 text-purple-500" />;
      case "support":
        return <AlertCircle className="size-5 text-yellow-500" />;
      case "success":
        return <CheckCircle2 className="size-5 text-green-500" />;
      default:
        return <Bell className="size-5 text-gray-500" />;
    }
  };

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setLoadingId(notificationId);
      const result = await markNotificationAsRead(notificationId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      router.refresh();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <Card 
            key={notification.id}
            className={notification.read ? "bg-muted/30" : ""}
          >
            <CardHeader className="flex flex-row items-start gap-2 space-y-0 pb-2">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  {!notification.read && (
                    <Badge variant="default" className="bg-blue-500">New</Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {formatDistance(new Date(notification.created_at), new Date(), { addSuffix: true })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notification.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              {notification.action_url && (
                <Link href={notification.action_url}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              )}
              
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={loadingId === notification.id}
                >
                  {loadingId === notification.id ? (
                    <Clock className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  Mark as Read
                </Button>
              )}
            </CardFooter>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No notifications</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any notifications at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 