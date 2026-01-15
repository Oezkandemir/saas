"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { syncPolarSubscriptionFromCheckout } from "@/actions/sync-polar-subscription";

import { logger } from "@/lib/logger";

/**
 * Automatically syncs subscription when user returns from Polar.sh checkout
 */
export function AutoSyncSubscription() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkoutId = searchParams.get("checkout_id"); // Polar.sh

    // Only sync once and if we have a checkout_id
    if (!checkoutId || hasSynced || isSyncing) {
      return;
    }

    async function syncIfNeeded() {
      if (!checkoutId) {
        return;
      }

      setIsSyncing(true);
      try {
        // Sync immediately - no delay needed since server-side sync already happened
        // This is just a fallback in case server-side sync failed
        const result = await syncPolarSubscriptionFromCheckout(checkoutId);

        if (result.success) {
          toast.success("Subscription aktualisiert!", {
            description: "Ihr Abonnement wurde erfolgreich synchronisiert.",
          });
          setHasSynced(true);
          // Remove query params from URL and refresh page immediately
          router.replace("/dashboard/billing");
          // Force a hard refresh to reload subscription data
          window.location.reload();
        } else {
          // Only show error if server-side sync also failed
          // Check if we already have a paid plan (server-side sync might have worked)
          toast.error("Fehler beim Synchronisieren", {
            description:
              result.message || "Bitte verwenden Sie den Refresh-Button.",
          });
        }
      } catch (error) {
        logger.error("Error auto-syncing subscription:", {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error("Fehler beim Synchronisieren", {
          description: "Bitte verwenden Sie den Refresh-Button.",
        });
      } finally {
        setIsSyncing(false);
      }
    }

    syncIfNeeded();
  }, [searchParams, router, hasSynced, isSyncing]);

  return null;
}
