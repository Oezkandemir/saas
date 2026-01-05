"use client";

import { useTransition } from "react";
import { openPolarPortal } from "@/actions/open-polar-portal";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button, buttonVariants } from "@/components/alignui/actions/button";
import { Icons } from "@/components/shared/icons";

interface PolarPortalButtonProps {
  customerId: string;
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

export function PolarPortalButton({
  customerId,
  variant = "outline",
  className,
}: PolarPortalButtonProps) {
  // Map old variants to new ones for backward compatibility
  const mappedVariant = variant === "default" ? "primary" : variant;
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Billing");

  const handleOpenPortal = () => {
    if (!customerId) {
      toast.error("No customer ID found. Please contact support.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await openPolarPortal(customerId);

        if (result.status === "error") {
          toast.error("Failed to open customer portal", {
            description:
              result.message || "Please try again or contact support.",
          });
        }
        // If successful, openPolarPortal will redirect, so this won't execute
      } catch (error: any) {
        // Next.js redirect() throws a special exception that we should ignore
        // Redirect exceptions have a digest property (numeric string) or specific error type
        // The digest is a hash of the redirect URL, so it's always present for redirects
        const isRedirectError =
          // Check for NEXT_REDIRECT in digest or message
          error?.digest?.startsWith("NEXT_REDIRECT") ||
          error?.message?.includes("NEXT_REDIRECT") ||
          // Check for RedirectError type
          error?.name === "RedirectError" ||
          // Check if digest exists (redirects always have a digest property)
          (typeof error === "object" &&
            "digest" in error &&
            typeof error.digest === "string" &&
            error.digest.length > 0) ||
          // Sometimes redirects have no message or a very specific structure
          !error?.message ||
          error?.message === "NEXT_REDIRECT";

        if (isRedirectError) {
          // This is a successful redirect, don't show an error toast
          // The redirect will happen automatically
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
