"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

import { AnalyticsTracker } from "./analytics/tracker";

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      <AnalyticsTracker />
    </>
  );
}
