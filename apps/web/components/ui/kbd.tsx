"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The keyboard shortcut keys to display
   */
  children: React.ReactNode;
}

const KbdRoot = React.forwardRef<HTMLDivElement, KbdProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
KbdRoot.displayName = "Kbd";

export const Kbd = {
  Root: KbdRoot,
};

// Default export for convenience
export { KbdRoot as KbdDefault };
