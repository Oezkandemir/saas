"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncSubscriptionFromSession } from "@/actions/sync-subscription-from-session";
import { toast } from "sonner";

/**
 * Automatically syncs subscription when user returns from Stripe checkout
 * Checks for session_id or other indicators that checkout was successful
 */
export function AutoSyncSubscription() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    // Only sync once and if we have a session_id
    if (!sessionId || hasSynced || isSyncing) {
      return;
    }

    async function syncIfNeeded() {
      setIsSyncing(true);
      try {
        // Wait a bit for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const result = await syncSubscriptionFromSession(sessionId);
        
        if (result.success) {
          toast.success("Subscription aktualisiert!", {
            description: "Ihr Abonnement wurde erfolgreich synchronisiert.",
          });
          setHasSynced(true);
          // Remove session_id from URL and refresh page
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

