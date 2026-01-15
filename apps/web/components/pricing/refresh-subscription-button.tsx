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
        toast.success("Subscription data refreshed successfully");
        router.refresh(); // Refresh the page to show updated subscription details
      } else {
        toast.error(result.message || "Failed to refresh subscription data");
      }
    } catch (error) {
      logger.error("Error refreshing subscription:", error);
      toast.error("An error occurred while refreshing subscription data");
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
