"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface HintRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const HintRoot = React.forwardRef<HTMLDivElement, HintRootProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-2 text-paragraph-sm text-text-sub-600",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
HintRoot.displayName = "Hint.Root";

interface HintIconProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  children?: React.ReactNode;
}

const HintIcon = React.forwardRef<HTMLDivElement, HintIconProps>(
  ({ className, as: Component, children, ...props }, ref) => {
    if (Component) {
      return (
        <Component
          ref={ref}
          className={cn("size-4 shrink-0 mt-0.5 text-text-sub-600", className)}
          {...props}
        />
      );
    }
    return (
      <div
        ref={ref}
        className={cn("size-4 shrink-0 mt-0.5", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
HintIcon.displayName = "Hint.Icon";

// Export individual components
export { HintRoot, HintIcon };

// Export namespace object
export const Hint = {
  Root: HintRoot,
  Icon: HintIcon,
};
