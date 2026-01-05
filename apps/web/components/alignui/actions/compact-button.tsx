/**
 * AlignUI - CompactButton Component
 *
 * Based on AlignUI design system using Radix UI and Tailwind CSS
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const compactButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        small: "h-7 px-2 text-xs",
        medium: "h-8 px-2.5 text-sm",
        large: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "medium",
    },
  },
);

export interface CompactButtonRootProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof compactButtonVariants> {
  asChild?: boolean;
}

const CompactButtonRoot = React.forwardRef<
  HTMLButtonElement,
  CompactButtonRootProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(compactButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
CompactButtonRoot.displayName = "CompactButtonRoot";

export interface CompactButtonIconProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  as?: React.ElementType;
}

const CompactButtonIcon = React.forwardRef<
  HTMLSpanElement,
  CompactButtonIconProps
>(({ className, as: Component, children, ...props }, ref) => {
  if (Component) {
    return (
      <Component
        ref={ref}
        className={cn("size-4 shrink-0", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
  return (
    <span ref={ref} className={cn("size-4 shrink-0", className)} {...props}>
      {children}
    </span>
  );
});
CompactButtonIcon.displayName = "CompactButtonIcon";

export const CompactButton = {
  Root: CompactButtonRoot,
  Icon: CompactButtonIcon,
};
