"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncSubscriptionFromSession } from "@/actions/sync-subscription-from-session";
import { syncPolarSubscriptionFromCheckout } from "@/actions/sync-polar-subscription";
import { toast } from "sonner";

/**
 * Automatically syncs subscription when user returns from checkout
 * Supports both Stripe (session_id) and Polar.sh (checkout_id)
 */
export function AutoSyncSubscription() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id"); // Stripe
    const checkoutId = searchParams.get("checkout_id"); // Polar.sh
    
    // Only sync once and if we have a session_id or checkout_id
    if ((!sessionId && !checkoutId) || hasSynced || isSyncing) {
      return;
    }

    async function syncIfNeeded() {
      setIsSyncing(true);
      try {
        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        let result;
        
        // Sync based on which provider was used
        if (checkoutId) {
          // Polar.sh checkout
          result = await syncPolarSubscriptionFromCheckout(checkoutId);
        } else if (sessionId) {
          // Stripe checkout
          result = await syncSubscriptionFromSession(sessionId);
        } else {
          return;
        }
        
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
        console.error("Error auto-syncing subscription:", error);
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

