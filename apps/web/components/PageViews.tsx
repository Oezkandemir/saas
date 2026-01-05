import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePageViews } from "@/hooks/use-page-views";

interface PageViewsProps {
  slug: string;
  trackView?: boolean;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "simple" | "block";
}

/**
 * A component to display page view counts
 *
 * @param slug - The URL slug for the page
 * @param trackView - Whether to track the page view
 * @param className - Additional CSS classes
 * @param showIcon - Whether to show the eye icon
 * @param variant - The visual style of the component
 */
export function PageViews({
  slug,
  trackView = true,
  className,
  showIcon = true,
  variant = "default",
}: PageViewsProps) {
  const { views, isLoading } = usePageViews({ slug, trackView });

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
          <span className="text-xs text-muted-foreground">Views</span>
          <span className="font-medium">{formattedViews}</span>
        </div>
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        {formattedViews} views
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
      {formattedViews} {views === 1 ? "view" : "views"}
    </span>
  );
}
