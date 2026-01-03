"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationAsRead,
  UserNotification,
} from "@/actions/user-profile-actions";
import { formatDistance } from "date-fns";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Info,
  Users,
} from "lucide-react";

import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { useToast } from "@/components/ui/use-toast";

import { DeleteNotificationButton } from "./delete-notification-button";

interface NotificationsListProps {
  notifications: UserNotification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    // Normalize type - handle both enum and string versions
    const normalizedType = type.toUpperCase();

    switch (normalizedType) {
      case "SYSTEM":
        return <Info className="size-5 text-blue-500" />;
      case "BILLING":
        return <CreditCard className="size-5 text-purple-500" />;
      case "SUPPORT":
        return <AlertCircle className="size-5 text-yellow-500" />;
      case "SUCCESS":
        return <CheckCircle2 className="size-5 text-green-500" />;
      case "WELCOME":
        return <Gift className="size-5 text-pink-500" />;
      case "TEAM":
        return <Users className="size-5 text-indigo-500" />;
      case "FOLLOW":
        return <Users className="size-5 text-blue-600" />;
      default:
        return <Bell className="size-5 text-gray-500" />;
    }
  };

  // Get badge color class based on notification type
  const getBadgeColorClass = (type: string) => {
    // Normalize type - handle both enum and string versions
    const normalizedType = type.toUpperCase();

    switch (normalizedType) {
      case "SYSTEM":
        return "bg-blue-500 hover:bg-blue-600";
      case "BILLING":
        return "bg-purple-500 hover:bg-purple-600";
      case "WELCOME":
        return "bg-pink-500 hover:bg-pink-600";
      case "TEAM":
        return "bg-indigo-500 hover:bg-indigo-600";
      case "SUCCESS":
        return "bg-green-500 hover:bg-green-600";
      case "FOLLOW":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-slate-500 hover:bg-slate-600";
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
              <div className="mt-1 shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base break-words">
                    {notification.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {!notification.read && (
                      <Badge variant="default" className="bg-blue-500 text-xs">
                        New
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={`${getBadgeColorClass(notification.type)} text-xs`}
                    >
                      {notification.type.charAt(0).toUpperCase() +
                        notification.type.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  {formatDistance(
                    new Date(notification.created_at),
                    new Date(),
                    { addSuffix: true },
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm break-words">{notification.content}</p>

              {notification.metadata &&
                Object.keys(notification.metadata).length > 0 && (
                  <div className="mt-2 rounded-md bg-muted p-2 text-xs overflow-x-auto">
                    {Object.entries(notification.metadata).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col gap-1 py-1 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <span className="font-medium capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="sm:ml-2 sm:text-right break-words">
                            {typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : String(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {notification.action_url && (
                  <Link href={notification.action_url} className="flex-1 sm:flex-initial">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      View Details
                    </Button>
                  </Link>
                )}
                <DeleteNotificationButton notificationId={notification.id} />
              </div>

              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={loadingId === notification.id}
                  className="w-full sm:w-auto"
                >
                  {loadingId === notification.id ? (
                    <Clock className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  <span className="hidden sm:inline">Mark as Read</span>
                  <span className="sm:hidden">Mark Read</span>
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
