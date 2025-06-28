import React from "react";
import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { useRealtimePageViews } from "@/hooks/use-realtime-page-views";

interface RealtimePageViewsProps {
  slug: string;
  trackView?: boolean;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "simple" | "block";
  showRealtimeIndicator?: boolean;
}

/**
 * A component that displays real-time page views with live updates
 *
 * @param slug - The URL slug for the page
 * @param trackView - Whether to track the page view
 * @param className - Additional CSS classes
 * @param showIcon - Whether to show the eye icon
 * @param variant - The visual style of the component
 * @param showRealtimeIndicator - Whether to show a real-time indicator dot
 */
export function RealtimePageViews({
  slug,
  trackView = true,
  className,
  showIcon = true,
  variant = "default",
  showRealtimeIndicator = true,
}: RealtimePageViewsProps) {
  const { views, isLoading } = useRealtimePageViews({ slug, trackView });

  // Loading state
  if (isLoading) {
    return (
      <span
        className={cn("animate-pulse text-sm text-muted-foreground", className)}
      >
        {showIcon && <Eye className="mr-1 inline-block size-4" />}
        --
      </span>
    );
  }

  const formattedViews = new Intl.NumberFormat().format(views);

  // Realtime indicator - small pulsing dot
  const realtimeIndicator = showRealtimeIndicator && (
    <span className="relative ml-1 flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
    </span>
  );

  // Different visual styles based on variant
  if (variant === "block") {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-md bg-muted p-2",
          className,
        )}
      >
        {showIcon && <Eye className="mr-2 size-4" />}
        <div className="flex flex-col">
          <span className="flex items-center text-xs text-muted-foreground">
            Views {realtimeIndicator}
          </span>
          <span className="font-medium">{formattedViews}</span>
        </div>
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <span
        className={cn(
          "flex items-center text-sm text-muted-foreground",
          className,
        )}
      >
        {formattedViews} views {realtimeIndicator}
      </span>
    );
  }

  // Default variant
  return (
    <span
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className,
      )}
    >
      {showIcon && <Eye className="mr-1 size-4" />}
      {formattedViews} {views === 1 ? "view" : "views"} {realtimeIndicator}
    </span>
  );
}
