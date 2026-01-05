"use client";

import { useTransition } from "react";
import { openPolarPortalFromSubscription } from "@/actions/open-polar-portal";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button, buttonVariants } from "@/components/alignui/actions/button";
import { Icons } from "@/components/shared/icons";

interface PolarPortalButtonWithSubscriptionProps {
  subscriptionId: string;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "neutral"
    | "ghost"
    | "destructive"
    | "outline";
  className?: string;
}

export function PolarPortalButtonWithSubscription({
  subscriptionId,
  variant = "outline",
  className,
}: PolarPortalButtonWithSubscriptionProps) {
  // Map old variants to new ones for backward compatibility
  const mappedVariant = variant === "default" ? "primary" : variant;
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Billing");

  const handleOpenPortal = () => {
    if (!subscriptionId) {
      toast.error("No subscription ID found. Please contact support.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await openPolarPortalFromSubscription(subscriptionId);

        if (result.status === "error") {
          toast.error("Failed to open customer portal", {
            description:
              result.message || "Please try again or contact support.",
          });
        }
        // If successful, openPolarPortalFromSubscription will redirect, so this won't execute
      } catch (error: any) {
        // Next.js redirect() throws a special exception that we should ignore
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

        logger.error("Error opening customer portal:", error);
        toast.error(
          "Failed to open customer portal. Please try again or contact support.",
        );
      }
    });
  };

  if (variant === "outline") {
    return (
      <button
        onClick={handleOpenPortal}
        disabled={isPending}
        className={cn(buttonVariants({ variant: "outline" }), className)}
      >
        {isPending ? (
          <>
            <LoadingSpinner size="sm" variant="primary" />
            <span>{t("openingPortal") || "Opening Portal..."}</span>
          </>
        ) : (
          <>
            <Icons.settings className="mr-2 size-4" />
            {t("manageSubscription") || "Manage Subscription"}
          </>
        )}
      </button>
    );
  }

  return (
    <Button
      variant={mappedVariant}
      disabled={isPending}
      onClick={handleOpenPortal}
      className={className}
    >
      {isPending ? (
        <>
          <LoadingSpinner size="sm" variant="primary" />
          <span>{t("openingPortal") || "Opening Portal..."}</span>
        </>
      ) : (
        <>
          <Icons.billing className="mr-2 size-4" />
          {t("manageSubscription") || "Manage Subscription"}
        </>
      )}
    </Button>
  );
}
