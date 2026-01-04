import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Calendar, CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";

import { UserSubscriptionPlan } from "types";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from '@/components/alignui/actions/button';
import { Icons } from "@/components/shared/icons";
import { getPolarCustomerPortalUrl } from "@/lib/polar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/alignui/data-display/card';
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';

import { SyncSubscriptionButton } from "./sync-subscription-button";
import { PolarPortalButton } from "./polar-portal-button";
import { PolarPortalButtonWithSubscription } from "./polar-portal-button-subscription";
import { PolarPortalButtonFallback } from "./polar-portal-button-fallback";
import { pricingData } from "@/config/subscriptions";

// Default free plan as fallback
const DEFAULT_FREE_PLAN: UserSubscriptionPlan = {
  ...pricingData[0],
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: 0,
  polarCustomerId: null,
  polarSubscriptionId: null,
  polarProductId: null,
  polarCurrentPeriodEnd: 0,
  polarCurrentPeriodStart: 0,
  polarSubscriptionStart: 0,
  isPaid: false,
  interval: null,
  isCanceled: false,
};

interface BillingInfoProps extends React.HTMLAttributes<HTMLFormElement> {
  userSubscriptionPlan?: UserSubscriptionPlan;
  userEmail?: string | null;
}

export function BillingInfo({ userSubscriptionPlan = DEFAULT_FREE_PLAN, userEmail }: BillingInfoProps) {
  const t = useTranslations("Billing");
  const {
    title,
    description,
    polarProductId,
    polarSubscriptionId,
    polarCustomerId,
    isPaid,
    isCanceled,
    polarCurrentPeriodEnd,
    polarCurrentPeriodStart,
    polarSubscriptionStart,
    interval,
  } = userSubscriptionPlan;

  // Use Polar period end and start
  const currentPeriodEnd = polarCurrentPeriodEnd || 0;
  const currentPeriodStart = polarCurrentPeriodStart || null;
  const subscriptionStart = polarSubscriptionStart || null;
  
  // Get Polar customer portal URL
  const customerPortalUrl = polarCustomerId 
    ? getPolarCustomerPortalUrl(polarCustomerId)
    : "https://polar.sh";

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{title} Plan</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge 
              variant={isPaid ? "default" : "outline"} 
              className={cn(
                "text-sm px-3 py-1",
                isPaid && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              )}
            >
              {isPaid ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Free</span>
                </div>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPaid ? (
            <>
              {/* Subscription Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CreditCard className="size-4" />
                    <span>Billing Cycle</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {interval === "month" ? "Monthly" : "Yearly"}
                  </p>
                </div>

                {currentPeriodStart && (
                  <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="size-4" />
                      <span>Current Period</span>
                    </div>
                    <p className="text-sm font-medium">
                      {currentPeriodStart ? formatDate(currentPeriodStart) : 'N/A'} - {formatDate(currentPeriodEnd)}
                    </p>
                  </div>
                )}

                {subscriptionStart && (
                  <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="size-4" />
                      <span>Subscribed Since</span>
                    </div>
                    <p className="text-sm font-medium">
                      {subscriptionStart ? formatDate(subscriptionStart) : 'N/A'}
                    </p>
                  </div>
                )}

                {currentPeriodEnd > 0 && (
                  <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="size-4" />
                      <span>{isCanceled ? "Cancels On" : "Renews On"}</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatDate(currentPeriodEnd)}
                    </p>
                    {isCanceled && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                        <XCircle className="size-3" />
                        Subscription will end
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Manage Subscription Section */}
              {isPaid && (
                <div className="p-4 rounded-lg border bg-primary/5 dark:bg-primary/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">
                        {t("manageSubscription") || "Manage Subscription"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("manageSubscriptionDescription") || "Update or cancel your subscription"}
                      </p>
                    </div>
                    {polarCustomerId ? (
                      <PolarPortalButton 
                        customerId={polarCustomerId}
                        variant="default"
                        className="w-full sm:w-auto"
                      />
                    ) : polarSubscriptionId ? (
                      <PolarPortalButtonWithSubscription 
                        subscriptionId={polarSubscriptionId}
                        variant="default"
                        className="w-full sm:w-auto"
                      />
                    ) : (
                      <PolarPortalButtonFallback 
                        variant="default"
                        className="w-full sm:w-auto"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {isCanceled ? (
                    <p className="flex items-center gap-2">
                      <XCircle className="size-4 text-amber-600 dark:text-amber-400" />
                      Your subscription will be canceled on {formatDate(currentPeriodEnd)}
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                      Your subscription is active and will renew automatically
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Free Plan Info */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">
                    You&apos;re currently on the free plan with limited features.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to unlock all features and get unlimited access.
                  </p>
                </div>

                {/* Upgrade CTA */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium mb-1">Ready to upgrade?</p>
                    <p className="text-xs text-muted-foreground">
                      Choose a plan that fits your needs
                    </p>
                  </div>
                  <Link href="/pricing" className={cn(buttonVariants())}>
                    View Plans
                  </Link>
                </div>
              </div>

              {/* Sync Option */}
              <div className="pt-4 border-t">
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-3">
                    <Icons.warning className="mt-0.5 size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Subscription Not Detected
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        If you&apos;ve recently upgraded but don&apos;t see your subscription, 
                        click the button below to sync your account with Polar.
                      </p>
                      <SyncSubscriptionButton />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
