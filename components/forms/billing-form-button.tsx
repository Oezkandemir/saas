"use client";

import { useTransition } from "react";
import { generateUserStripe } from "@/actions/generate-user-stripe";
import { SubscriptionPlan, UserSubscriptionPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { toast } from "sonner";

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

  const userCurrentPriceId = subscriptionPlan.stripePriceId;
  const selectedPriceId = offer.stripeIds[year ? "yearly" : "monthly"];
  
  // Check if this is the user's current plan
  const isCurrentPlan = userCurrentPriceId === selectedPriceId;

  const handleStripeAction = () => {
    if (!selectedPriceId) {
      toast.error("Invalid pricing configuration. Please contact support.");
      return;
    }
    
    startTransition(async () => {
      try {
        // If the user already has this subscription, we show manage subscription UI
        if (isCurrentPlan && subscriptionPlan.stripeCustomerId) {
          toast.info("Redirecting to manage your current subscription...");
        } else {
          // Otherwise, we're upgrading or changing plans
          toast.info("Redirecting to payment page...");
        }
        
        await generateUserStripe(selectedPriceId);
      } catch (error) {
        console.error("Error with subscription action:", error);
        toast.error("Failed to process subscription request. Please try again.");
      }
    });
  };

  return (
    <Button
      variant={isCurrentPlan ? "default" : "outline"}
      rounded="full"
      className="w-full"
      disabled={isPending || !selectedPriceId}
      onClick={handleStripeAction}
    >
      {isPending ? (
        <>
          <Icons.spinner className="mr-2 size-4 animate-spin" /> Loading...
        </>
      ) : !selectedPriceId ? (
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
