"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { BadgeRoot } from "./badge";

export type StatusVariant = "completed" | "pending" | "failed" | "disabled";

interface StatusBadgeProps {
  status: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

interface StatusBadgeIconProps {
  as: React.ComponentType<{ className?: string }>;
  className?: string;
}

const StatusBadgeRoot = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, children, className, ...props }, ref) => {
    const variantMap: Record<
      StatusVariant,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      disabled: "outline",
    };

    return (
      <BadgeRoot
        ref={ref}
        variant={variantMap[status]}
        className={cn("inline-flex items-center gap-1.5", className)}
        {...props}
      >
        {children}
      </BadgeRoot>
    );
  },
);
StatusBadgeRoot.displayName = "StatusBadge.Root";

const StatusBadgeIcon = ({ as: Icon, className }: StatusBadgeIconProps) => {
  return <Icon className={cn("size-3.5", className)} />;
};
StatusBadgeIcon.displayName = "StatusBadge.Icon";

export const StatusBadge = {
  Root: StatusBadgeRoot,
  Icon: StatusBadgeIcon,
};

// Export for compatibility
export { StatusBadgeRoot, StatusBadgeIcon };
