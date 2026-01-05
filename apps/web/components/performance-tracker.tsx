"use client";

import { useEffect } from "react";

import { performanceMonitor } from "@/lib/performance-monitoring";

/**
 * Performance Tracker Component
 * Initializes performance monitoring and tracks Core Web Vitals
 */
export function PerformanceTracker() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.init();

    // Track page load time using modern Performance API
    if (typeof window !== "undefined" && window.performance) {
      const handleLoad = () => {
        // Use PerformanceNavigationTiming if available (modern API)
        const perfData = window.performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;

        if (perfData) {
          const loadTime = perfData.loadEventEnd - perfData.fetchStart;
          performanceMonitor.recordMetric("PageLoad", loadTime, "ms", {
            url: window.location.pathname,
            domContentLoaded:
              perfData.domContentLoadedEventEnd - perfData.fetchStart,
            firstPaint: perfData.domInteractive - perfData.fetchStart,
          });
        } else {
          // Fallback to legacy timing API
          const timing = window.performance.timing;
          if (timing) {
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            performanceMonitor.recordMetric("PageLoad", loadTime, "ms", {
              url: window.location.pathname,
            });
          }
        }
      };

      // Check if page is already loaded
      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
      }

      // Cleanup
      return () => {
        window.removeEventListener("load", handleLoad);
      };
    }

    // Return undefined if performance API is not available
    return undefined;
  }, []);

  return null; // This component doesn't render anything
}
