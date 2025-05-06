"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface NotificationBellProps {
  variant?: "default" | "ghost" | "outline";
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

  const bellContent = (
    <Link 
      href="/profile/notifications"
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <Button
        variant={variant}
        size={size}
        className="relative"
        type="button"
      >
        <Bell className="size-5" />
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {isLoading && (
          <Skeleton className="absolute -right-1 -top-1 size-5 rounded-full" />
        )}
      </Button>
    </Link>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {bellContent}
          </TooltipTrigger>
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
    );
  }

  return bellContent;
} 