"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { syncPolarSubscriptionDirect } from "@/actions/sync-polar-subscription-direct";

import { logger } from "@/lib/logger";

/**
 * Automatically syncs subscription directly from Polar API after page load
 * This ensures we have the latest subscription data when viewing the billing page
 * Runs once after component mounts to avoid calling revalidateTag during render
 */
export function AutoSyncSubscriptionDirect() {
  const router = useRouter();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Only sync once after mount
    if (hasSynced || isSyncing) {
      return;
    }

    async function syncIfNeeded() {
      setIsSyncing(true);
      try {
        // Sync subscription directly from Polar API
        // This happens after render, so revalidateTag is safe to call
        const result = await syncPolarSubscriptionDirect();

        if (result.success) {
          // Refresh the page to show updated subscription data
          router.refresh();
          setHasSynced(true);
        } else {
          // Silently fail - don't show errors for background sync
          // The page will still show cached data
          logger.debug("Auto-sync subscription direct failed:", result.message);
        }
      } catch (error) {
        // Silently fail - don't show errors for background sync
        logger.debug("Error auto-syncing subscription directly:", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsSyncing(false);
      }
    }

    // Small delay to ensure page has fully rendered
    const timeoutId = setTimeout(() => {
      syncIfNeeded();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, hasSynced, isSyncing]);

  return null;
}
