"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Enhanced Navigation Progress Bar
 * Shows a progress bar at the top of the page during navigation
 * Also tracks Link clicks for immediate feedback
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathnameRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
          setProgress(0);
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

    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset loading state when route changes
    setIsLoading(true);
    setProgress(0);

    // Simulate progress bar animation
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        // Accelerate progress bar
        const increment = prev < 50 ? 15 : 8;
        return Math.min(prev + increment, 90);
      });
    }, 50);

    // Complete progress when navigation is done
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
      {/* Progress Bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20",
          "transition-opacity duration-200",
          isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Spinner Overlay - only show if loading takes longer than 300ms */}
      {progress < 100 && progress > 20 && (
        <div
          className={cn(
            "fixed inset-0 z-[9998] flex items-center justify-center",
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

