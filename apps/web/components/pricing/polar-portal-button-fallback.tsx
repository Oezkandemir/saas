"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { openPolarPortalFallback } from "@/actions/open-polar-portal";
import { toast } from "sonner";
import { Button } from '@/components/alignui/actions/button';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/shared/icons";
import { buttonVariants } from '@/components/alignui/actions/button';
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface PolarPortalButtonFallbackProps {
  variant?: "default" | "primary" | "secondary" | "neutral" | "ghost" | "destructive" | "outline";
  className?: string;
}

export function PolarPortalButtonFallback({
  variant = "outline",
  className,
}: PolarPortalButtonFallbackProps) {
  // Map old variants to new ones for backward compatibility
  const mappedVariant = variant === "default" ? "primary" : variant;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("Billing");

  const handleOpenPortal = () => {
    startTransition(async () => {
      try {
        const result = await openPolarPortalFallback();
        
        if (result.status === "error") {
          // Show error with option to sync
          toast.error("Failed to open customer portal", {
            description: result.message || "Please try syncing your subscription first.",
            action: {
              label: "Sync Subscription",
              onClick: () => {
                // Trigger sync and retry
                window.location.reload();
              },
            },
          });
        }
        // If successful, openPolarPortalFallback will redirect, so this won't execute
      } catch (error: any) {
        // Next.js redirect() throws a special exception that we should ignore
        const isRedirectError = 
          error?.digest?.startsWith('NEXT_REDIRECT') || 
          error?.message?.includes('NEXT_REDIRECT') ||
          error?.name === 'RedirectError' ||
          (typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.length > 0) ||
          (!error?.message || error?.message === 'NEXT_REDIRECT');
        
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
    <Button variant={mappedVariant} disabled={isPending} onClick={handleOpenPortal} className={className}>
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

