/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and custom performance metrics
 */

// Web API type definitions for Performance Observer entries
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
}

interface PerformanceNavigationTiming extends PerformanceEntry {
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  loadEventStart: number;
  loadEventEnd: number;
}

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private isClient = typeof window !== "undefined";
  private metrics: PerformanceMetric[] = [];

  /**
   * Initialize performance monitoring
   */
  init() {
    if (!this.isClient) return;

    // Track Core Web Vitals
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackFCP();
    this.trackTTFB();
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  private trackLCP() {
    if (!this.isClient || typeof window.PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.recordMetric("LCP", lcp, "ms", {
          element: lastEntry.name,
        });

        // Send to analytics if available
        if (window.va?.track) {
          window.va.track("LCP", { value: lcp });
        }
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }

  /**
   * Track First Input Delay (FID)
   */
  private trackFID() {
    if (!this.isClient || typeof window.PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          const fid = fidEntry.processingStart - fidEntry.startTime;

          this.recordMetric("FID", fid, "ms", {
            eventType: fidEntry.name,
          });

          // Send to analytics if available
          if (window.va?.track) {
            window.va.track("FID", { value: fid });
          }
        });
      });

      observer.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  private trackCLS() {
    if (!this.isClient || typeof window.PerformanceObserver === "undefined") return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });

        this.recordMetric("CLS", clsValue, "score", {});

        // Send to analytics if available
        if (window.va?.track) {
          window.va.track("CLS", { value: clsValue });
        }
      });

      observer.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }

  /**
   * Track First Contentful Paint (FCP)
   */
  private trackFCP() {
    if (!this.isClient || typeof window.PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fcp = entry.startTime;
          this.recordMetric("FCP", fcp, "ms", {});

          // Send to analytics if available
          if (window.va?.track) {
            window.va.track("FCP", { value: fcp });
          }
        });
      });

      observer.observe({ entryTypes: ["paint"] });
    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }

  /**
   * Track Time to First Byte (TTFB)
   */
  private trackTTFB() {
    if (!this.isClient) return;

    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric("TTFB", ttfb, "ms", {});

        // Send to analytics if available
        if (window.va?.track) {
          window.va.track("TTFB", { value: ttfb });
        }
      }
    } catch (error) {
      // Silently fail if performance API is not available
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata?: Record<string, unknown>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    const vitals: CoreWebVitals = {};

    this.metrics.forEach((metric) => {
      switch (metric.name) {
        case "LCP":
          vitals.lcp = metric.value;
          break;
        case "FID":
          vitals.fid = metric.value;
          break;
        case "CLS":
          vitals.cls = metric.value;
          break;
        case "FCP":
          vitals.fcp = metric.value;
          break;
        case "TTFB":
          vitals.ttfb = metric.value;
          break;
      }
    });

    return vitals;
  }
}

// Extend Window interface for Vercel Analytics
declare global {
  interface Window {
    va?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize on client side
if (typeof window !== "undefined") {
  // Wait for page load to ensure accurate metrics
  if (document.readyState === "complete") {
    performanceMonitor.init();
  } else {
    window.addEventListener("load", () => {
      performanceMonitor.init();
    });
  }
}

