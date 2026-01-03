"use client";

import { useTransition } from "react";
import { generateUserStripe } from "@/actions/generate-user-stripe";
import { SubscriptionPlan, UserSubscriptionPlan } from "@/types";
import { toast } from "sonner";

import { Button } from '@/components/alignui/actions/button';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

  const userCurrentPriceId = subscriptionPlan.stripePriceId;
  const selectedPriceId = offer.stripeIds[year ? "yearly" : "monthly"];

  // Check if this is the user's current plan
  const isCurrentPlan = userCurrentPriceId === selectedPriceId;

  const handleStripeAction = () => {
    if (!selectedPriceId) {
      toast.error(
        "Dieser Plan ist noch nicht verfügbar. Bitte konfigurieren Sie die Stripe Price IDs in den Environment-Variablen. Siehe STRIPE-PRICE-IDS-SETUP.md für Anweisungen.",
        { duration: 8000 }
      );
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
      } catch (error: any) {
        // Next.js redirect() throws a special exception that we should ignore
        // Redirect exceptions have a digest property (numeric string) or specific error type
        // The digest is a hash of the redirect URL, so it's always present for redirects
        const isRedirectError = 
          // Check for NEXT_REDIRECT in digest or message
          error?.digest?.startsWith('NEXT_REDIRECT') || 
          error?.message?.includes('NEXT_REDIRECT') ||
          // Check for RedirectError type
          error?.name === 'RedirectError' ||
          // Check if digest exists (redirects always have a digest property)
          (typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.length > 0) ||
          // Sometimes redirects have no message or a very specific structure
          (!error?.message || error?.message === 'NEXT_REDIRECT');
        
        if (isRedirectError) {
          // This is a successful redirect, don't show an error toast
          // The redirect will happen automatically
          return;
        }
        
        console.error("Error with subscription action:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process subscription request";
        
        // Show more helpful error message if it's about price IDs
        if (errorMessage.includes("price_") || errorMessage.includes("Product ID")) {
          toast.error(errorMessage, { duration: 10000 });
        } else {
          toast.error(
            "Fehler beim Verarbeiten der Abonnement-Anfrage. Bitte versuchen Sie es erneut.",
          );
        }
      }
    });
  };

  return (
    <Button
      variant={isCurrentPlan ? "primary" : "outline"}
      className="w-full"
      disabled={isPending || !selectedPriceId}
      onClick={handleStripeAction}
    >
      {isPending ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>Loading...</span>
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
