import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  hasSuccess?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, hasSuccess, ...props }, ref) => {
    // Ensure proper ARIA attributes
    const {
      "aria-invalid": _,
      "aria-describedby": ariaDescribedBy,
      ...restProps
    } = props;
    const ariaProps: {
      "aria-invalid"?: "true" | "false";
      "aria-describedby"?: string;
    } = {
      "aria-invalid": hasError ? ("true" as const) : ("false" as const),
      "aria-describedby": ariaDescribedBy,
    };

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex px-3 py-2 w-full h-10 text-base rounded-md border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError
              ? "pr-10 border-destructive focus-visible:ring-destructive"
              : hasSuccess
                ? "pr-10 border-green-500 focus-visible:ring-green-500"
                : "border-subtle focus-visible:border-border",
            className,
          )}
          ref={ref}
          {...restProps}
          {...ariaProps}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none size-4 text-destructive" />
        )}
        {hasSuccess && !hasError && (
          <CheckCircle2 className="absolute right-3 top-1/2 text-green-500 -translate-y-1/2 pointer-events-none size-4" />
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
