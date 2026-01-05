"use client";

import { useTransition } from "react";
import { generateUserPolar } from "@/actions/generate-user-polar";
import { SubscriptionPlan, UserSubscriptionPlan } from "@/types";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/alignui/actions/button";
import { Icons } from "@/components/shared/icons";

interface BillingFormButtonProps {
  offer: SubscriptionPlan;
  subscriptionPlan: UserSubscriptionPlan;
  year: boolean;
}

export function BillingFormButton({
  year,
  offer,
  subscriptionPlan,
}: BillingFormButtonProps) {
  let [isPending, startTransition] = useTransition();

  const userCurrentProductId = subscriptionPlan.polarProductId;
  const selectedPolarId = offer.polarIds?.[year ? "yearly" : "monthly"];

  // Check if this is the user's current plan
  const isCurrentPlan = userCurrentProductId === selectedPolarId;

  const handlePaymentAction = () => {
    // Handle Polar checkout only
    if (!selectedPolarId) {
      toast.error(
        "Dieser Plan ist noch nicht verfügbar. Bitte konfigurieren Sie die Polar Product IDs.",
        { duration: 8000 },
      );
      return;
    }

    startTransition(async () => {
      try {
        toast.info("Redirecting to payment page...");
        await generateUserPolar(selectedPolarId);
      } catch (error: any) {
        const isRedirectError =
          error?.digest?.startsWith("NEXT_REDIRECT") ||
          error?.message?.includes("NEXT_REDIRECT") ||
          error?.name === "RedirectError" ||
          (typeof error === "object" &&
            "digest" in error &&
            typeof error.digest === "string" &&
            error.digest.length > 0) ||
          !error?.message ||
          error?.message === "NEXT_REDIRECT";

        if (isRedirectError) {
          return;
        }

        logger.error("Error with Polar checkout:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to process Polar checkout";
        toast.error(errorMessage, { duration: 10000 });
      }
    });
  };

  // Determine if button should be disabled
  const isDisabled = isPending || !selectedPolarId;

  return (
    <Button
      variant={isCurrentPlan ? "primary" : "outline"}
      className="w-full"
      disabled={isDisabled}
      onClick={handlePaymentAction}
    >
      {isPending ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>Loading...</span>
        </>
      ) : isDisabled ? (
        <>Not Available</>
      ) : (
        <>
          {isCurrentPlan ? (
            <>
              <Icons.check className="mr-2 size-4" /> Current Plan
            </>
          ) : subscriptionPlan.isPaid ? (
            <>
              <Icons.billing className="mr-2 size-4" /> Change Plan
            </>
          ) : (
            <>
              <Icons.arrowRight className="mr-2 size-4" /> Upgrade
            </>
          )}
        </>
      )}
    </Button>
  );
}
