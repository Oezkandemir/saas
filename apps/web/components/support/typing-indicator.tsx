"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { TypingUser } from "@/hooks/use-typing-indicator";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId: string;
  className?: string;
}

export function TypingIndicator({
  typingUsers,
  currentUserId,
  className,
}: TypingIndicatorProps) {
  // Filter out current user and get unique typing users
  const otherTypingUsers = useMemo(() => {
    return typingUsers.filter((user) => user.userId !== currentUserId);
  }, [typingUsers, currentUserId]);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  // Get display text
  const getDisplayText = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].userName} is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0].userName} and ${otherTypingUsers[1].userName} are typing...`;
    } else {
      return `${otherTypingUsers[0].userName} and ${otherTypingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="italic">{getDisplayText()}</span>
      </div>
      {/* Animated dots */}
      <div className="flex gap-1">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "200ms", animationDuration: "1.4s" }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "400ms", animationDuration: "1.4s" }}
        />
      </div>
    </div>
  );
}


