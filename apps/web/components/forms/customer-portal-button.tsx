"use client";

import { useTransition } from "react";
import { openCustomerPortal } from "@/actions/open-customer-portal";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/shared/icons";

// Direct link to the test customer portal - keeping it in component for easy testing
const STRIPE_TEST_PORTAL_URL =
  "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";
const IS_TEST_MODE = process.env.NODE_ENV !== "production";

interface CustomerPortalButtonProps {
  userStripeId: string;
}

export function CustomerPortalButton({
  userStripeId,
}: CustomerPortalButtonProps) {
  let [isPending, startTransition] = useTransition();

  const handleOpenPortal = () => {
    if (!userStripeId) {
      toast.error("No Stripe customer ID found. Please contact support.");
      return;
    }

    // In test mode, let's provide the option to go directly to the test portal
    if (IS_TEST_MODE) {
      window.open(STRIPE_TEST_PORTAL_URL, "_blank");
      return;
    }

    startTransition(async () => {
      try {
        await openCustomerPortal(userStripeId);
        // Note: The above action will redirect, so the code below will never execute
        // unless there's an error and the action returns instead of redirecting
      } catch (error) {
        console.error("Error opening customer portal:", error);
        toast.error(
          "Failed to open customer portal. Please try again or contact support.",
        );
      }
    });
  };

  return (
    <Button variant="default" disabled={isPending} onClick={handleOpenPortal}>
      {isPending ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>Opening Portal...</span>
        </>
      ) : (
        <>
          <Icons.billing className="mr-2 size-4" />
          Manage Subscription
        </>
      )}
    </Button>
  );
}
