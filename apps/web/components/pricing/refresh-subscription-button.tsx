"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { refreshSubscription } from "@/actions/refresh-subscription";
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { logger } from "@/lib/logger";

export function RefreshSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await refreshSubscription();

      if (result.success) {
        const planInfo = result.subscription
          ? `Plan: ${result.subscription.plan}${result.subscription.productId ? ` (ID: ${result.subscription.productId})` : ""}`
          : "";
        toast.success("Abonnement erfolgreich aktualisiert", {
          description: planInfo || result.message,
        });
        // Small delay to ensure cache is cleared before refresh
        setTimeout(() => {
          router.refresh(); // Refresh the page to show updated subscription details
        }, 500);
      } else {
        toast.error("Fehler beim Aktualisieren", {
          description: result.message || "Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
        });
      }
    } catch (error) {
      logger.error("Error refreshing subscription:", error);
      toast.error("Fehler beim Aktualisieren", {
        description: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <Icons.lineChart className="mr-2 size-4" /> Refresh
        </>
      )}
    </Button>
  );
}
