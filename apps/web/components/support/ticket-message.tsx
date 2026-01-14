"use client";

import { TicketMessage } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import { ShieldCheck, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TicketMessageProps {
  message: TicketMessage;
  isCurrentUser: boolean;
  isAdminView?: boolean; // If true, admin messages align right, user messages align left
}

export function TicketMessageItem({
  message,
  isCurrentUser,
  isAdminView = false,
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
  // Use actual avatar_url from user data, fallback to placeholder service
  const avatarUrl =
    message.user?.avatar_url ||
    `https://avatar.vercel.sh/${message.user_id}.png`;

  // Determine alignment based on view type
  // Admin view: admin messages right, user messages left
  // User view: current user messages right, others left
  const alignRight = isAdminView
    ? isAdmin
    : isCurrentUser && !isAdmin;

  return (
    <div
      className={cn(
        "mb-4 flex w-full gap-3",
        alignRight ? "justify-end" : "justify-start",
      )}
    >
      {/* For left-aligned messages: Avatar on left */}
      {!alignRight && (
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={avatarUrl} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[80%] flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
          alignRight ? "items-end" : "items-start",
        )}
      >
        {/* Message sender info - Order: Avatar → Username → Badge → Timestamp */}
        {/* For right-aligned: reverse order so Avatar (right) → Username → Badge → Timestamp (left) */}
        <div
          className={cn(
            "mb-1.5 flex items-center gap-2 flex-wrap",
            alignRight && "flex-row-reverse",
          )}
        >
          {/* Avatar inline for right-aligned messages */}
          {alignRight && (
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}

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

          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedTime}
          </span>
        </div>

        {/* Message content */}
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            isAdmin
              ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50"
              : alignRight && isCurrentUser && !isAdmin
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
          )}
        >
          {message.message}
        </div>
      </div>

      {/* For right-aligned messages: Avatar removed from here, now inline in info row */}
    </div>
  );
}
