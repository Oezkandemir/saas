"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

import { AnalyticsTracker } from "./analytics/tracker";

/**
 * Analytics Component
 * 
 * Conditionally loads Vercel Analytics only when:
 * - Running on Vercel (has VERCEL env var)
 * - In production environment
 * 
 * This prevents 404 errors for insights scripts when not on Vercel.
 */
export function Analytics() {
  // Only load Vercel Analytics on Vercel in production
  // This prevents 404 errors for /_vercel/insights/script.js
  const shouldLoadVercelAnalytics =
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL);

  return (
    <>
      {shouldLoadVercelAnalytics && <VercelAnalytics />}
      <AnalyticsTracker />
    </>
  );
}
