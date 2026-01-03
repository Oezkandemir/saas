import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserSubscriptionPlan } from "types";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from '@/components/alignui/actions/button';
import { CustomerPortalButton } from "@/components/forms/customer-portal-button";
import { Icons } from "@/components/shared/icons";

import { SyncSubscriptionButton } from "./sync-subscription-button";
import { pricingData } from "@/config/subscriptions";

// Direct link to test portal
const STRIPE_TEST_PORTAL_URL =
  "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";
const IS_TEST_MODE = process.env.NODE_ENV !== "production";

// Default free plan as fallback
const DEFAULT_FREE_PLAN: UserSubscriptionPlan = {
  ...pricingData[0],
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: 0,
  isPaid: false,
  interval: null,
  isCanceled: false,
};

interface BillingInfoProps extends React.HTMLAttributes<HTMLFormElement> {
  userSubscriptionPlan?: UserSubscriptionPlan;
}

export function BillingInfo({ userSubscriptionPlan = DEFAULT_FREE_PLAN }: BillingInfoProps) {
  const t = useTranslations("Billing");
  const {
    title,
    description,
    stripeCustomerId,
    stripePriceId,
    isPaid,
    isCanceled,
    stripeCurrentPeriodEnd,
    interval,
  } = userSubscriptionPlan;

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {isPaid && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Icons.check className="size-4 text-green-500" />
              <span className="font-medium">Active subscription</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">{t("billingCycle")}:</span>{" "}
                {interval === "month" ? t("monthly") : t("yearly")}
              </p>
              {stripeCurrentPeriodEnd > 0 && (
                <p>
                  <span className="font-medium">
                    {isCanceled ? "Cancels on" : "Renews on"}:
                  </span>{" "}
                  {formatDate(stripeCurrentPeriodEnd)}
                </p>
              )}
            </div>
          </div>
        )}

        {!isPaid && (
          <div className="pt-2 border-t">
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <Icons.warning className="mt-0.5 size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Subscription Issue Detected
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    If you&apos;ve recently upgraded but don&apos;t see your
                    subscription, click the button below to sync your account.
                  </p>
                  <SyncSubscriptionButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        {isPaid && stripeCurrentPeriodEnd > 0 && (
          <p className="text-sm text-muted-foreground">
            {isCanceled
              ? "Your plan will be canceled on "
              : "Your plan renews on "}
            {formatDate(stripeCurrentPeriodEnd)}
          </p>
        )}
        <div className="ml-auto">
          {isPaid && stripeCustomerId ? (
            <CustomerPortalButton userStripeId={stripeCustomerId} />
          ) : (
            <Link href="/pricing" className={cn(buttonVariants())}>
              Choose a plan
            </Link>
          )}
        </div>
      </div>

      {/* Test Portal Direct Link - only shown in development */}
      {IS_TEST_MODE && (
        <div className="pt-4 border-t">
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
            <p className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
              Test Environment Quick Access
            </p>
            <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
              This link appears only in development/test environments.
            </p>
            <a
              href={STRIPE_TEST_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "bg-white dark:bg-background",
              )}
            >
              <Icons.arrowUpRight className="mr-2 size-4" />
              Open Test Customer Portal
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
