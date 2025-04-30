"use client";

import React, { useState } from "react";
import { syncUserSubscriptionFromStripe } from "@/actions/sync-user-subscription";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
          <Icons.spinner className="mr-2 size-4 animate-spin" /> Syncing...
        </>
      ) : (
        <>
          <Icons.settings className="mr-2 size-4" /> Fix Subscription
        </>
      )}
    </Button>
  );
} 