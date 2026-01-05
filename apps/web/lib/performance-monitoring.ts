/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and performance metrics
 */

import { recordMetric } from "./system-monitoring";

export interface WebVitals {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

/**
 * Report Web Vitals to monitoring system
 */
export function reportWebVital(metric: WebVitals) {
  // Only report in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Map Web Vitals names to component names
  const componentMap: Record<string, "api" | "database" | "auth" | "email" | "storage" | "payment"> = {
    CLS: "api",
    FID: "api",
    FCP: "api",
    LCP: "api",
    TTFB: "api",
    INP: "api",
  };

  const component = componentMap[metric.name] || "api";

  // Report to system monitoring (server-side)
  recordMetric(
    component,
    `web_vital_${metric.name.toLowerCase()}`,
    metric.value,
    "ms",
    {
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    }
  ).catch((error) => {
    // Silently fail to avoid breaking the app
    console.error("Failed to report Web Vital:", error);
  });
}

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === "production") {
      recordMetric("api", `performance_${name}`, duration, "ms").catch(() => {
        // Silently fail
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    if (process.env.NODE_ENV === "production") {
      recordMetric("api", `performance_${name}_error`, duration, "ms").catch(() => {
        // Silently fail
      });
    }
    throw error;
  }
}

/**
 * Track database query performance
 */
export async function trackQueryPerformance<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  return measurePerformance(`db_query_${queryName}`, fn);
}

/**
 * Track API route performance
 */
export async function trackAPIPerformance<T>(
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  return measurePerformance(`api_route_${route.replace(/\//g, "_")}`, fn);
}

/**
 * Client-side performance monitor
 * Provides a simple interface for tracking performance metrics in the browser
 */
export const performanceMonitor = {
  /**
   * Initialize performance monitoring
   */
  init: () => {
    // Initialize Web Vitals tracking if available
    if (typeof window !== "undefined" && typeof window.performance !== "undefined") {
      // Web Vitals tracking can be added here if needed
      // For now, we'll just ensure the performance API is available
    }
  },

  /**
   * Record a performance metric
   */
  recordMetric: async (
    name: string,
    value: number,
    unit: string = "ms",
    metadata?: Record<string, unknown>
  ) => {
    // Only report in production
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    try {
      // Report to server-side monitoring via API
      await fetch("/api/performance/metric", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          value,
          unit,
          metadata: metadata || {},
        }),
      }).catch(() => {
        // Silently fail to avoid breaking the app
      });
    } catch (error) {
      // Silently fail to avoid breaking the app
    }
  },
};
