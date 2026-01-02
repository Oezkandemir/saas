"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Global Navigation Loading Indicator
 * Shows a loading spinner when navigating between pages
 */
export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set loading state when pathname or search params change
    setIsLoading(true);

    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }

    // Set a minimum display time for the loading indicator (200ms)
    // This prevents flickering on fast navigations
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 200);

    setLoadingTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [pathname, searchParams]);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "transition-opacity duration-200",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-label="Loading"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Lädt...</p>
      </div>
    </div>
  );
}



