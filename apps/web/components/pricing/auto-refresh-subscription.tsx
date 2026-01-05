"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserPlan } from "@/actions/get-user-plan";
import { refreshSubscription } from "@/actions/refresh-subscription";
import { toast } from "sonner";

import { logger } from "@/lib/logger";

/**
 * Automatically refreshes subscription data periodically when user is authenticated
 * This ensures that changes made in Polar Customer Portal are reflected automatically
 * Works globally across all pages, not just billing page
 */
export function AutoRefreshSubscription() {
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProductIdRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only run on protected routes (dashboard pages)
    if (!pathname?.includes("/dashboard")) {
      return;
    }

    // Initial check after 5 seconds (give webhook time to process)
    const initialTimeout = setTimeout(async () => {
      await checkAndRefresh();
      hasCheckedRef.current = true;
    }, 5000);

    // Then check every 30 seconds
    intervalRef.current = setInterval(async () => {
      await checkAndRefresh();
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, pathname]);

  async function checkAndRefresh() {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;

      // First, get current plan to check if user has a paid subscription
      const currentPlan = await getUserPlan();

      // Only refresh if user has a paid subscription
      if (
        !currentPlan?.isPaid ||
        (!currentPlan.polarCustomerId && !currentPlan.polarSubscriptionId)
      ) {
        return;
      }

      const result = await refreshSubscription();

      if (result.success && result.subscription) {
        const currentProductId = result.subscription.productId;

        // If product ID changed, refresh the page
        if (
          lastProductIdRef.current &&
          lastProductIdRef.current !== currentProductId
        ) {
          toast.success("Abonnement aktualisiert", {
            description: `Ihr Plan wurde auf ${result.subscription.plan} geändert.`,
          });
          router.refresh();
        }

        lastProductIdRef.current = currentProductId;
      }
    } catch (error) {
      // Silently fail - don't show errors for background refresh
      logger.debug("Auto-refresh subscription check failed:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  }

  return null;
}
