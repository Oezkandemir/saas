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

    // Track page load time
    if (typeof window !== "undefined" && window.performance) {
      window.addEventListener("load", () => {
        const loadTime =
          window.performance.timing.loadEventEnd -
          window.performance.timing.navigationStart;

        performanceMonitor.recordMetric("PageLoad", loadTime, "ms", {
          url: window.location.pathname,
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}











