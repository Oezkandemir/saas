/**
 * AlignUI - Input Component (Free Base Component)
 *
 * Based on AlignUI design system using Tailwind CSS
 * Source: alignui.com/docs/v1.2/components/forms/input
 */

import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "hasError" | "hasSuccess"
  > {
  hasError?: boolean;
  hasSuccess?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, hasSuccess, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            // Base Styles - AlignUI Pro Styles
            "flex h-10 w-full rounded-md border bg-bg-white-0 px-3 py-2 text-sm text-text-strong-950",
            "ring-offset-bg-white-0 file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-text-sub-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-soft-400 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error State - Deutlich sichtbar
            hasError
              ? "border-destructive focus-visible:ring-destructive pr-10"
              : // Success State
                hasSuccess
                ? "border-green-500 focus-visible:ring-green-500 pr-10"
                : // Default State - AlignUI Pro Borders
                  "border-stroke-soft-200 focus-visible:border-stroke-soft-400 focus-visible:ring-stroke-soft-400",
            className,
          )}
          ref={ref}
          {...props}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive pointer-events-none" />
        )}
        {hasSuccess && !hasError && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500 pointer-events-none" />
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
