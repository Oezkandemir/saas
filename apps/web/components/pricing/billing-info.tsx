import * as React from "react";
import Link from "next/link";

import { UserSubscriptionPlan } from "types";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { CustomerPortalButton } from "@/components/forms/customer-portal-button";
import { Icons } from "@/components/shared/icons";

import { SyncSubscriptionButton } from "./sync-subscription-button";

// Direct link to test portal
const STRIPE_TEST_PORTAL_URL =
  "https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288";
const IS_TEST_MODE = process.env.NODE_ENV !== "production";

interface BillingInfoProps extends React.HTMLAttributes<HTMLFormElement> {
  userSubscriptionPlan: UserSubscriptionPlan;
}

export function BillingInfo({ userSubscriptionPlan }: BillingInfoProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plan</CardTitle>
        <CardDescription>
          You are currently on the <strong>{title}</strong> plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>{description}</p>
          {isPaid && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icons.check className="size-4 text-green-500" />
                <span>Active subscription</span>
              </div>

              <div className="mt-2">
                <p>
                  <strong>Plan Type:</strong> {title}
                </p>
                <p>
                  <strong>Billing Cycle:</strong>{" "}
                  {interval === "month" ? "Monthly" : "Yearly"}
                </p>
                <p>
                  <strong>Price ID:</strong> {stripePriceId}
                </p>
              </div>
            </div>
          )}

          {!isPaid && (
            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Icons.warning className="mt-0.5 size-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">
                      Subscription Issue Detected
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      If you&apos;ve recently upgraded but don&apos;t see your
                      subscription, click the button below to sync your account.
                    </p>
                    <SyncSubscriptionButton />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Portal Direct Link - only shown in development */}
          {IS_TEST_MODE && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="mb-2 text-sm font-medium text-blue-800">
                Test Environment Quick Access
              </p>
              <p className="mb-3 text-xs text-blue-700">
                This link appears only in development/test environments.
              </p>
              <a
                href={STRIPE_TEST_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "bg-white",
                )}
              >
                <Icons.arrowUpRight className="mr-2 size-4" />
                Open Test Customer Portal
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 border-t bg-accent py-2 md:flex-row md:justify-between md:space-y-0">
        {isPaid ? (
          <p className="text-sm font-medium text-muted-foreground">
            {isCanceled
              ? "Your plan will be canceled on "
              : "Your plan renews on "}
            {formatDate(stripeCurrentPeriodEnd)}.
          </p>
        ) : null}

        {isPaid && stripeCustomerId ? (
          <CustomerPortalButton userStripeId={stripeCustomerId} />
        ) : (
          <Link href="/pricing" className={cn(buttonVariants())}>
            Choose a plan
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
