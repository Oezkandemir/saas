import type React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  children,
  className,
  ...props
}: PageHeaderProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-6 flex flex-col space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

interface PageHeaderHeadingProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageHeaderHeading({
  children,
  className,
  ...props
}: PageHeaderHeadingProps & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-3xl font-bold tracking-tight", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

interface PageHeaderDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageHeaderDescription({
  children,
  className,
  ...props
}: PageHeaderDescriptionProps & React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}
