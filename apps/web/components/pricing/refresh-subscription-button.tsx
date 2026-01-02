"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { refreshSubscription } from "@/actions/refresh-subscription";
import { toast } from "sonner";

import { Button } from '@/components/alignui/actions/button';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/shared/icons";

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
      console.error("Error refreshing subscription:", error);
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
