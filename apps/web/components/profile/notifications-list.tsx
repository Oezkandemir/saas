"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationAsRead,
  UserNotification,
} from "@/actions/user-profile-actions";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  FileText,
  Gift,
  Info,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/alignui/actions/button";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { Card, CardContent } from "@/components/alignui/data-display/card";

import { DeleteNotificationButton } from "./delete-notification-button";

interface NotificationsListProps {
  notifications: UserNotification[];
}

// Get action icon based on metadata action
const getActionIcon = (action?: string, type?: string) => {
  if (action) {
    switch (action.toLowerCase()) {
      case "created":
        return <Plus className="h-3.5 w-3.5" />;
      case "updated":
        return <Edit className="h-3.5 w-3.5" />;
      case "deleted":
        return <Trash2 className="h-3.5 w-3.5" />;
      case "sent":
        return <ArrowRight className="h-3.5 w-3.5" />;
      case "paid":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "overdue":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  }

  // Fallback to type-based icons
  const normalizedType = type?.toUpperCase() || "";
  switch (normalizedType) {
    case "SYSTEM":
      return <Info className="h-3.5 w-3.5" />;
    case "BILLING":
      return <CreditCard className="h-3.5 w-3.5" />;
    case "SUPPORT":
      return <Info className="h-3.5 w-3.5" />;
    case "SUCCESS":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "WELCOME":
      return <Gift className="h-3.5 w-3.5" />;
    case "TEAM":
      return <Users className="h-3.5 w-3.5" />;
    case "CUSTOMER":
      return <Users className="h-3.5 w-3.5" />;
    case "DOCUMENT":
      return <FileText className="h-3.5 w-3.5" />;
    case "INVOICE":
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <Bell className="h-3.5 w-3.5" />;
  }
};

// Get action color based on action type
const getActionColor = (action?: string) => {
  if (!action) return "text-muted-foreground";

  switch (action.toLowerCase()) {
    case "created":
      return "text-green-600 dark:text-green-400";
    case "updated":
      return "text-blue-600 dark:text-blue-400";
    case "deleted":
      return "text-red-600 dark:text-red-400";
    case "sent":
      return "text-purple-600 dark:text-purple-400";
    case "paid":
      return "text-green-600 dark:text-green-400";
    case "overdue":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-muted-foreground";
  }
};

// Get action label in German
const getActionLabel = (action?: string) => {
  if (!action) return "";

  switch (action.toLowerCase()) {
    case "created":
      return "erstellt";
    case "updated":
      return "aktualisiert";
    case "deleted":
      return "gelöscht";
    case "sent":
      return "gesendet";
    case "paid":
      return "bezahlt";
    case "overdue":
      return "überfällig";
    default:
      return action;
  }
};

// Get type label in German
const getTypeLabel = (type: string) => {
  const normalizedType = type.toUpperCase();
  switch (normalizedType) {
    case "CUSTOMER":
      return "Kunde";
    case "DOCUMENT":
      return "Dokument";
    case "INVOICE":
      return "Rechnung";
    case "SYSTEM":
      return "System";
    case "BILLING":
      return "Abrechnung";
    case "SUPPORT":
      return "Support";
    case "SUCCESS":
      return "Erfolg";
    case "WELCOME":
      return "Willkommen";
    case "TEAM":
      return "Team";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
};

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setLoadingId(notificationId);
      const result = await markNotificationAsRead(notificationId);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh();
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      toast({
        title: "Fehler",
        description:
          "Benachrichtigung konnte nicht als gelesen markiert werden",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {notifications.length > 0 ? (
        notifications.map((notification) => {
          const metadata = notification.metadata || {};
          const action = metadata.action as string | undefined;
          const customerName = metadata.customer_name as string | undefined;
          const documentNumber = metadata.document_number as string | undefined;
          const documentType = metadata.document_type as string | undefined;

          return (
            <Card
              key={notification.id}
              className={cn(
                "group transition-all duration-200 hover:shadow-md",
                notification.read
                  ? "bg-muted/20 border-muted"
                  : "bg-background border-border shadow-sm",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Action Icon */}
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 rounded-md p-1.5",
                      getActionColor(action),
                      !notification.read && "bg-muted/50",
                    )}
                  >
                    {getActionIcon(action, notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              "text-sm font-medium leading-tight",
                              !notification.read && "font-semibold",
                            )}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge
                              variant="default"
                              className="h-4 px-1.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            >
                              Neu
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Info */}
                    {(action || customerName || documentNumber) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {action && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">Aktion:</span>
                            <span className={getActionColor(action)}>
                              {getActionLabel(action)}
                            </span>
                          </div>
                        )}
                        {customerName && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">Kunde:</span>
                            <span className="font-medium">{customerName}</span>
                          </div>
                        )}
                        {documentNumber && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">Dokument:</span>
                            <span className="font-medium">
                              {documentNumber}
                            </span>
                            {documentType && (
                              <span className="text-muted-foreground/70">
                                ({documentType})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistance(
                            new Date(notification.created_at),
                            new Date(),
                            { addSuffix: true, locale: de },
                          )}
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[10px] font-normal bg-muted/50"
                        >
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        {notification.action_url && (
                          <Link href={notification.action_url}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              Öffnen
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={loadingId === notification.id}
                            className="h-7 px-2 text-xs"
                            title="Als gelesen markieren"
                          >
                            {loadingId === notification.id ? (
                              <Clock className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <DeleteNotificationButton
                          notificationId={notification.id}
                          isUnread={!notification.read}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Keine Benachrichtigungen
            </h3>
            <p className="text-center text-sm text-muted-foreground max-w-md">
              Sie haben derzeit keine Benachrichtigungen. Neue
              Benachrichtigungen werden hier angezeigt, sobald sie eintreffen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
