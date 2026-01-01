"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation Loading Spinner
 * Shows a loading spinner during page navigation
 * Tracks Link clicks for immediate feedback
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Ensure we're in the browser
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !isMountedRef.current) {
      return;
    }

    // Track Link clicks
    const handleLinkClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        
        if (
          link &&
          link.href &&
          !link.target &&
          link.href.startsWith(window.location.origin) &&
          link.href !== window.location.href
        ) {
          // Only track internal navigation to different pages
          setIsLoading(true);
        }
      } catch (error) {
        // Silently fail if there's an error
      }
    };

    document.addEventListener("click", handleLinkClick, { passive: true });

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !isMountedRef.current) {
      return;
    }

    // Check if pathname actually changed
    const currentPath = `${pathname}${searchParams.toString()}`;
    if (prevPathnameRef.current === currentPath) {
      return;
    }

    prevPathnameRef.current = currentPath;

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set loading state when route changes
    setIsLoading(true);

    // Hide loading spinner after navigation completes
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname, searchParams]);

  if (!isLoading) {
    return null;
  }

  return (
    <>
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center",
            "bg-background/60 backdrop-blur-sm",
            "transition-opacity duration-200",
            isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Loading"
          role="status"
        >
          <div className="flex flex-col items-center gap-3 rounded-lg bg-background/90 p-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Lädt...</p>
          </div>
        </div>
      )}
    </>
  );
}

