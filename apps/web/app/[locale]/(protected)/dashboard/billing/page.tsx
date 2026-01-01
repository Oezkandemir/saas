import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BillingInfo } from "@/components/pricing/billing-info";
import { RefreshSubscriptionButton } from "@/components/pricing/refresh-subscription-button";
import { AutoSyncSubscription } from "@/components/pricing/auto-sync-subscription";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Icons } from "@/components/shared/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("Billing");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function BillingPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Billing");

  let userSubscriptionPlan;
  if (user && user.id && user.role === "USER") {
    userSubscriptionPlan = await getUserSubscriptionPlan(user.id);
  } else {
    redirect("/login");
  }

  return (
    <div className="relative flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-orange-500/10 to-yellow-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <Suspense fallback={null}>
        <AutoSyncSubscription />
      </Suspense>

      {/* Header */}
      <ModernPageHeader
        title={t("heading")}
        description={t("text")}
        icon={<CreditCard className="h-5 w-5 text-primary" />}
      />

      <div className="grid gap-6">
        {/* Demo Alert */}
        <Alert className="relative overflow-hidden border border-yellow-500/20 bg-yellow-500/10 backdrop-blur-sm !pl-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />
          <Icons.warning className="text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100">{t("demoAlert")}</AlertTitle>
          <AlertDescription className="text-balance text-yellow-800 dark:text-yellow-200">
            {t("demoDescription")}{" "}
            <a
              href="https://stripe.com/docs/testing#cards"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-8 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors"
            >
              {t("stripeDocs")}
            </a>
            .
          </AlertDescription>
        </Alert>

        {/* Subscription Details */}
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5" />

          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 shadow-lg">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Subscription Details</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihr Abonnement und Rechnungsdetails
                  </CardDescription>
                </div>
              </div>
              <RefreshSubscriptionButton />
            </div>
          </CardHeader>
          <CardContent>
            <BillingInfo userSubscriptionPlan={userSubscriptionPlan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
