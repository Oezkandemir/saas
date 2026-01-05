"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncPolarSubscriptionFromCheckout } from "@/actions/sync-polar-subscription";
import { toast } from "sonner";
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
        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Sync Polar.sh checkout
        const result = await syncPolarSubscriptionFromCheckout(checkoutId);
        
        if (result.success) {
          toast.success("Subscription aktualisiert!", {
            description: "Ihr Abonnement wurde erfolgreich synchronisiert.",
          });
          setHasSynced(true);
          // Remove query params from URL and refresh page
          router.replace("/dashboard/billing");
          // Force a hard refresh to reload subscription data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error("Fehler beim Synchronisieren", {
            description: result.message || "Bitte verwenden Sie den Refresh-Button.",
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

