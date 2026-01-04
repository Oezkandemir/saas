import { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

interface IconProps extends LucideProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
  ...props
}: IconProps & { icon: LucideIcon }) {
  return (
    <IconComponent
      className={cn(sizeMap[size], "transition-colors", className)}
      {...props}
    />
  );
}

export function createIconWrapper(size: IconProps["size"] = "md") {
  return function IconWrapper({
    icon: IconComponent,
    className,
    ...props
  }: Omit<IconProps, "size"> & { icon: LucideIcon }) {
    return (
      <IconComponent
        className={cn(sizeMap[size], "transition-colors", className)}
        {...props}
      />
    );
  };
}














