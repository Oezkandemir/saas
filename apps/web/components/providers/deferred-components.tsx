"use client";

import dynamic from "next/dynamic";

// ⚡ PERFORMANCE: Defer non-critical components with dynamic imports
// These components are loaded after initial render to improve FCP and LCP
const Toaster = dynamic(() => import("@/components/ui/sonner").then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});

const TailwindIndicator = dynamic(() => import("@/components/tailwind-indicator").then(mod => ({ default: mod.TailwindIndicator })), {
  ssr: false,
});

const PerformanceTracker = dynamic(() => import("@/components/performance-tracker").then(mod => ({ default: mod.PerformanceTracker })), {
  ssr: false,
});

const AutoRefreshSubscription = dynamic(() => import("@/components/pricing/auto-refresh-subscription").then(mod => ({ default: mod.AutoRefreshSubscription })), {
  ssr: false,
});

/**
 * DeferredComponents - Client Component
 * 
 * Renders non-critical components that don't need to be in the initial bundle.
 * These components are loaded after the initial render to improve performance metrics:
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Total Blocking Time (TBT)
 */
export function DeferredComponents() {
  return (
    <>
      <AutoRefreshSubscription />
      <Toaster richColors closeButton />
      <TailwindIndicator />
      <PerformanceTracker />
    </>
  );
}



