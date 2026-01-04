/**
 * AlignUI - LinkButton Component
 * 
 * Based on AlignUI design system using Radix UI and Tailwind CSS
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const linkButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-primary hover:text-primary/80",
        primary: "text-primary hover:text-primary/80",
        gray: "text-muted-foreground hover:text-foreground",
        destructive: "text-destructive hover:text-destructive/80",
      },
      size: {
        small: "text-xs",
        medium: "text-sm",
        large: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  }
);

export interface LinkButtonRootProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkButtonVariants> {
  asChild?: boolean;
  underline?: boolean;
}

const LinkButtonRoot = React.forwardRef<
  HTMLAnchorElement,
  LinkButtonRootProps
>(
  (
    { className, variant, size, asChild = false, underline, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "a";
    return (
      <Comp
        className={cn(
          linkButtonVariants({ variant, size }),
          underline && "underline underline-offset-4",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
LinkButtonRoot.displayName = "LinkButtonRoot";

export const LinkButton = {
  Root: LinkButtonRoot,
};










