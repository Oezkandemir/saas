import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { UserSubscriptionPlan } from "types";
import { pricingData } from "@/config/subscriptions";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { AutoSyncSubscription } from "@/components/pricing/auto-sync-subscription";
import { BillingInfo } from "@/components/pricing/billing-info";
import { RefreshSubscriptionButton } from "@/components/pricing/refresh-subscription-button";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Billing");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const user = await getCurrentUser();
  const t = await getTranslations("Billing");

  if (!user || !user.id) {
    redirect("/login");
  }

  // Resolve searchParams (Next.js 15 requires awaiting)
  const resolvedSearchParams = await searchParams;

  // Always sync subscription directly from Polar API to ensure latest data
  // This is critical for showing the correct plan after plan changes
  let syncSuccess = false;
  try {
    const { syncPolarSubscriptionDirect } = await import(
      "@/actions/sync-polar-subscription-direct"
    );
    logger.info("Syncing subscription directly from Polar API");
    const syncResult = await syncPolarSubscriptionDirect();
    syncSuccess = syncResult.success;
    logger.info("Subscription synced successfully from Polar API", {
      success: syncResult.success,
      message: syncResult.message,
    });
  } catch (error) {
    logger.error("Error syncing subscription from Polar API:", error);
    // Continue loading page even if sync fails - will show cached data
  }

  // If checkout_id is present, also sync from checkout
  if (resolvedSearchParams?.checkout_id) {
    try {
      const { syncPolarSubscriptionFromCheckout } = await import(
        "@/actions/sync-polar-subscription"
      );
      logger.info(
        `Syncing subscription for checkout_id: ${resolvedSearchParams.checkout_id}`,
      );
      const checkoutSyncResult = await syncPolarSubscriptionFromCheckout(
        resolvedSearchParams.checkout_id,
      );
      syncSuccess = checkoutSyncResult.success || syncSuccess;
      logger.info("Subscription synced successfully from checkout", {
        success: checkoutSyncResult.success,
      });
    } catch (error) {
      logger.error("Error syncing subscription from checkout:", error);
      // Continue loading page even if sync fails
    }
  }

  // After sync, ensure we get fresh data (cache invalidation happens in server action)
  if (syncSuccess) {
    const { unstable_noStore } = await import("next/cache");
    
    // Small delay to ensure database write is committed
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    // Force no cache for this request to get fresh data
    unstable_noStore();
    
    logger.info("Sync successful, forcing fresh data load");
  }

  // Default free plan for admins or when subscription fetch fails
  const defaultFreePlan: UserSubscriptionPlan = {
    ...pricingData[0],
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    stripeCurrentPeriodEnd: 0,
    polarCustomerId: null,
    polarSubscriptionId: null,
    polarProductId: null,
    polarCurrentPeriodEnd: 0,
    isPaid: false,
    interval: null,
    isCanceled: false,
  };

  let userSubscriptionPlan: UserSubscriptionPlan | undefined;

  // Try to get subscription plan for both USER and ADMIN roles
  // Admins might not have a subscription, but should still be able to view the page
  // Skip cache if we just synced to ensure we get fresh data
  try {
    if (user.role === "USER") {
      // After sync, bypass cache to get fresh data
      const plan = await getUserSubscriptionPlan(user.id, user.email);
      userSubscriptionPlan = plan || defaultFreePlan;
      
      // Log the plan details for debugging
      logger.info("Loaded subscription plan for USER", {
        planTitle: plan?.title,
        productId: plan?.polarProductId,
        isPaid: plan?.isPaid,
        interval: plan?.interval,
      });
    } else if (user.role === "ADMIN") {
      // For admins, try to fetch subscription if they have one
      // Otherwise use the default free plan
      try {
        const plan = await getUserSubscriptionPlan(user.id, user.email);
        userSubscriptionPlan = plan || defaultFreePlan;
        
        logger.info("Loaded subscription plan for ADMIN", {
          planTitle: plan?.title,
          productId: plan?.polarProductId,
          isPaid: plan?.isPaid,
        });
      } catch (error) {
        // If admin has no subscription, use default free plan
        logger.debug("Admin has no subscription, using default free plan");
        userSubscriptionPlan = defaultFreePlan;
      }
    } else {
      // For any other role, use default free plan
      userSubscriptionPlan = defaultFreePlan;
    }
  } catch (error) {
    // If there's an error fetching subscription, use default plan
    // This allows admins to view the page even without a subscription
    logger.error("Error fetching subscription plan:", error);
    userSubscriptionPlan = defaultFreePlan;
  }

  // Final safety check - ensure userSubscriptionPlan is always defined
  if (!userSubscriptionPlan) {
    userSubscriptionPlan = defaultFreePlan;
  }

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={
        userSubscriptionPlan.isPaid
          ? `${userSubscriptionPlan.title} • ${userSubscriptionPlan.interval === "month" ? t("monthly") : t("yearly")}`
          : t("text")
      }
      icon={<CreditCard className="h-4 w-4 text-primary" />}
      actions={<RefreshSubscriptionButton />}
      contentClassName="space-y-6"
    >
      <Suspense fallback={null}>
        <AutoSyncSubscription />
      </Suspense>

      {/* Subscription Details - Visual Center */}
      <BillingInfo userSubscriptionPlan={userSubscriptionPlan} />
    </UnifiedPageLayout>
  );
}
