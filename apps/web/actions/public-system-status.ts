"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get public system status (no auth required)
 * Returns only if there are critical unresolved errors
 */
export async function getPublicSystemStatus(): Promise<{
  hasErrors: boolean;
  overallStatus: "operational" | "degraded" | "down";
}> {
  try {
    const supabase = await createClient();

    // Check for unresolved critical errors (public read)
    const { data: criticalErrors } = await supabase
      .from("system_errors")
      .select("id")
      .eq("error_type", "critical")
      .eq("resolved", false)
      .limit(1);

    // Check system status (public read)
    const { data: statuses } = await supabase
      .from("system_status")
      .select("status")
      .limit(10);

    const hasErrors = (criticalErrors?.length ?? 0) > 0;

    // Check if any component is down or degraded
    const isDown = statuses?.some((s) => s.status === "down") ?? false;
    const isDegraded = statuses?.some((s) => s.status === "degraded") ?? false;

    let overallStatus: "operational" | "degraded" | "down" = "operational";
    if (isDown) {
      overallStatus = "down";
    } else if (isDegraded || hasErrors) {
      overallStatus = "degraded";
    }

    return {
      hasErrors,
      overallStatus,
    };
  } catch (_error) {
    // On error, assume operational to not cause panic
    return {
      hasErrors: false,
      overallStatus: "operational",
    };
  }
}
