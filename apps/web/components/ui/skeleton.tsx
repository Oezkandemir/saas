import { cn } from "@/lib/utils";
import * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

const variantClasses = {
  default: "rounded-md",
  text: "rounded",
  circular: "rounded-full",
  rectangular: "rounded-none",
};

const animationClasses = {
  pulse: "animate-pulse",
  wave: "animate-shimmer",
  none: "",
};

function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
