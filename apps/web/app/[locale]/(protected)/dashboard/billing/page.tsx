import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { BillingInfo } from "@/components/pricing/billing-info";
import { RefreshSubscriptionButton } from "@/components/pricing/refresh-subscription-button";
import { AutoSyncSubscription } from "@/components/pricing/auto-sync-subscription";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { CreditCard } from "lucide-react";
import { pricingData } from "@/config/subscriptions";
import { UserSubscriptionPlan } from "types";
import { logger } from "@/lib/logger";

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

export default async function BillingPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Billing");

  if (!user || !user.id) {
    redirect("/login");
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
  try {
    if (user.role === "USER") {
      const plan = await getUserSubscriptionPlan(user.id);
      userSubscriptionPlan = plan || defaultFreePlan;
    } else if (user.role === "ADMIN") {
      // For admins, try to fetch subscription if they have one
      // Otherwise use the default free plan
      try {
        const plan = await getUserSubscriptionPlan(user.id);
        userSubscriptionPlan = plan || defaultFreePlan;
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
      description={userSubscriptionPlan.isPaid 
        ? `${userSubscriptionPlan.title} • ${userSubscriptionPlan.interval === "month" ? t("monthly") : t("yearly")}`
        : t("text")}
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
