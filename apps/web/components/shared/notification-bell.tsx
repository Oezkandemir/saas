"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { NotificationsPopover } from "@/components/shared/notifications-popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showTooltip?: boolean;
  className?: string;
}

export function NotificationBell({
  variant = "ghost",
  size = "icon",
  showTooltip = true,
  className,
}: NotificationBellProps) {
  const { unreadCount, isLoading } = useNotifications();
  const t = useTranslations("Notifications");

  const bellButton = (
    <Button variant={variant} size={size} className="relative" type="button">
      <Bell className="size-5" />
      {!isLoading && unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {isLoading && (
        <Skeleton className="absolute -right-1 -top-1 size-5 rounded-full" />
      )}
    </Button>
  );

  // Wrap with tooltip if needed
  const bellWithTooltip = showTooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{bellButton}</TooltipTrigger>
        <TooltipContent>
          <p>{t("notifications")}</p>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("unreadCount", { count: unreadCount })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    bellButton
  );

  return (
    <NotificationsPopover>
      <span
        className={cn(
          "relative inline-flex items-center justify-center",
          className
        )}
      >
        {bellWithTooltip}
      </span>
    </NotificationsPopover>
  );
}
