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
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Icons } from "@/components/shared/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Sparkles } from "lucide-react";

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
    <UnifiedPageLayout
      title={t("heading")}
      description={t("text")}
      icon={<CreditCard className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      <Suspense fallback={null}>
        <AutoSyncSubscription />
      </Suspense>

      {/* Demo Alert */}
      <Alert className="border border-border bg-yellow-500/10 !pl-14">
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                <Sparkles className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Subscription Details</CardTitle>
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
    </UnifiedPageLayout>
  );
}
