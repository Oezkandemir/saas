import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "muted";
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const variantClasses = {
  default: "text-foreground",
  primary: "text-primary",
  muted: "text-muted-foreground",
};

export function LoadingSpinner({
  className,
  size = "md",
  variant = "default",
  text,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}













