"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

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

function SkeletonRoot({
  className,
  variant = "default",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-bg-white-50",
        variantClasses[variant],
        animationClasses[animation],
        className,
      )}
      {...props}
    />
  );
}

SkeletonRoot.displayName = "Skeleton.Root";

// Export individual components
export { SkeletonRoot };

// Export namespace object
export const Skeleton = {
  Root: SkeletonRoot,
};
