"use client";

import { TicketMessage } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/alignui/data-display/avatar';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';

interface TicketMessageProps {
  message: TicketMessage;
  isCurrentUser: boolean;
}

export function TicketMessageItem({
  message,
  isCurrentUser,
}: TicketMessageProps) {
  const isAdmin = message.is_admin;
  const formattedTime = formatDistance(
    new Date(message.created_at),
    new Date(),
    { addSuffix: true },
  );

  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = message.user?.name || "Unknown";
  const initials = getInitials(userName);

  return (
    <div
      className={cn(
        "mb-4 flex w-full gap-2",
        isCurrentUser && !isAdmin ? "justify-end" : "justify-start",
      )}
    >
      {/* For admin or other users, show avatar on left */}
      {(!isCurrentUser || isAdmin) && (
        <Avatar className="size-8">
          <AvatarImage
            src={`https://avatar.vercel.sh/${message.user_id}.png`}
            alt={userName}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[80%] flex-col",
          isCurrentUser && !isAdmin ? "items-end" : "items-start",
        )}
      >
        {/* Message sender info */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">
            {isCurrentUser && !isAdmin ? "You" : userName}
          </span>

          {isAdmin && (
            <Badge
              variant="outline"
              className="flex h-5 items-center gap-1 py-0 text-xs"
            >
              <ShieldCheck className="size-3" />
              Admin
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>

        {/* Message content */}
        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isCurrentUser && !isAdmin
              ? "bg-primary text-primary-foreground"
              : isAdmin
                ? "border border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-950"
                : "bg-muted",
          )}
        >
          {message.message}
        </div>
      </div>

      {/* For current user (not admin), show avatar on right */}
      {isCurrentUser && !isAdmin && (
        <Avatar className="size-8">
          <AvatarImage
            src={`https://avatar.vercel.sh/${message.user_id}.png`}
            alt={userName}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
