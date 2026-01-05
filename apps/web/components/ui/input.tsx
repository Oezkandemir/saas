import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  hasSuccess?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, hasSuccess, ...props }, ref) => {
    // Ensure proper ARIA attributes
    const ariaProps = {
      "aria-invalid": hasError ? "true" : "false",
      "aria-describedby": props["aria-describedby"],
    };

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError
              ? "border-destructive focus-visible:ring-destructive pr-10"
              : hasSuccess
              ? "border-green-500 focus-visible:ring-green-500 pr-10"
              : "border-subtle focus-visible:border-border",
            className,
          )}
          ref={ref}
          {...ariaProps}
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
