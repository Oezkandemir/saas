import { CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import type { UserSubscriptionPlan } from "types";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { AutoSyncSubscription } from "@/components/pricing/auto-sync-subscription";
import { AutoSyncSubscriptionDirect } from "@/components/pricing/auto-sync-subscription-direct";
import { BillingInfo } from "@/components/pricing/billing-info";
import { RefreshSubscriptionButton } from "@/components/pricing/refresh-subscription-button";
import { pricingData } from "@/config/subscriptions";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";

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

  // Note: Subscription syncing is now handled by client components after render:
  // - AutoSyncSubscriptionDirect: Syncs directly from Polar API after page load
  // - AutoSyncSubscription: Syncs from checkout_id when returning from checkout
  // This avoids calling revalidateTag during render, which Next.js doesn't allow

  // Default free plan for admins or when subscription fetch fails
  const defaultFreePlan: UserSubscriptionPlan = {
    ...pricingData[0]!,
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
      const plan = await getUserSubscriptionPlan(user.id, user.email);
      userSubscriptionPlan = plan || defaultFreePlan;
    } else if (user.role === "ADMIN") {
      // For admins, try to fetch subscription if they have one
      // Otherwise use the default free plan
      try {
        const plan = await getUserSubscriptionPlan(user.id, user.email);
        userSubscriptionPlan = plan || defaultFreePlan;
      } catch (_error) {
        // If admin has no subscription, use default free plan
        userSubscriptionPlan = defaultFreePlan;
      }
    } else {
      // For any other role, use default free plan
      userSubscriptionPlan = defaultFreePlan;
    }
  } catch (error) {
    // If there's an error fetching subscription, use default plan
    // This allows admins to view the page even without a subscription
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
      icon={<CreditCard className="size-4 text-primary" />}
      actions={<RefreshSubscriptionButton />}
      contentClassName="space-y-6"
    >
      <Suspense fallback={null}>
        <AutoSyncSubscription />
        <AutoSyncSubscriptionDirect />
      </Suspense>

      {/* Subscription Details - Visual Center */}
      <BillingInfo userSubscriptionPlan={userSubscriptionPlan} />
    </UnifiedPageLayout>
  );
}
