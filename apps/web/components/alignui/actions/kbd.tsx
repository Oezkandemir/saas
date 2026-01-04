/**
 * AlignUI - Kbd Component (Keyboard Shortcut Display)
 * 
 * Based on AlignUI design system
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdRootProps extends React.HTMLAttributes<HTMLDivElement> {}

const KbdRoot = React.forwardRef<HTMLDivElement, KbdRootProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground shadow-sm",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
KbdRoot.displayName = "KbdRoot";

export const Kbd = {
  Root: KbdRoot,
};









