/**
 * AlignUI - Tag Component
 * 
 * Based on AlignUI design system using Radix UI and Tailwind CSS
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        gray: "bg-muted text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TagRootProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

const TagRoot = React.forwardRef<HTMLSpanElement, TagRootProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(tagVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
TagRoot.displayName = "TagRoot";

export interface TagDismissButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const TagDismissButton = React.forwardRef<
  HTMLButtonElement,
  TagDismissButtonProps
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className,
      )}
      {...props}
    >
      <X className="size-2.5" />
      <span className="sr-only">Remove</span>
    </button>
  );
});
TagDismissButton.displayName = "TagDismissButton";

export const Tag = {
  Root: TagRoot,
  DismissButton: TagDismissButton,
};














