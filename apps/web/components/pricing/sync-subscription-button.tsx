"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { syncUserSubscriptionFromStripe } from "@/actions/sync-user-subscription";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/shared/icons";

export function SyncSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncUserSubscriptionFromStripe();

      if (result.success) {
        toast.success("Subscription synced successfully!");
        router.refresh(); // Refresh the page to show updated subscription details
      } else {
        toast.error(result.message || "Failed to sync subscription");
      }
    } catch (error) {
      console.error("Error syncing subscription:", error);
      toast.error("An error occurred while syncing subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className="mt-4 w-full"
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <Icons.settings className="mr-2 size-4" /> Fix Subscription
        </>
      )}
    </Button>
  );
}
