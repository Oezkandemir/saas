import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Settings,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SettingsPageDrawer } from "@/components/settings/settings-page-drawer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { getAllPlanFeatures, type PlanFeaturesInfo } from "@/lib/plan-features";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import type { UserSubscriptionPlan } from "@/types";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings");

  if (!user?.id) redirect("/login");

  // Get user subscription plan
  let subscriptionPlan: UserSubscriptionPlan | null = null;
  let planFeatures: PlanFeaturesInfo | null = null;
  try {
    subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);
    planFeatures = await getAllPlanFeatures(user.id);
  } catch (error) {
    logger.error("Error fetching subscription plan:", error);
  }

  // Get email verification status
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const emailVerified = userData?.user?.email_confirmed_at != null;

  // Get 2FA status
  const { data: twoFactorData } = await supabase
    .from("two_factor_auth")
    .select("enabled")
    .eq("user_id", user.id)
    .single();
  const twoFactorEnabled = twoFactorData?.enabled || false;

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("text")}
      icon={<Settings className="size-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Quick Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className="flex justify-center items-center rounded-lg size-8 bg-primary/10">
                  <User className="size-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium">
                  {t("profile.title")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm break-words text-muted-foreground">
                {user.email}
              </p>
              <div className="flex gap-2 items-center">
                <Badge
                  variant={emailVerified ? "default" : "destructive"}
                  className="text-xs"
                >
                  {emailVerified ? (
                    <>
                      <CheckCircle2 className="mr-1 size-3" />
                      {t("profile.verified")}
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 size-3" />
                      {t("profile.notVerified")}
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {subscriptionPlan && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="flex justify-center items-center rounded-lg size-8 bg-primary/10">
                    <CreditCard className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {t("subscription.title")}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Badge
                    variant={subscriptionPlan.isPaid ? "default" : "outline"}
                    className="text-xs"
                  >
                    {subscriptionPlan.title}
                  </Badge>
                  {subscriptionPlan.isPaid && (
                    <span className="text-xs text-muted-foreground">
                      {subscriptionPlan.interval === "month"
                        ? t("subscription.monthly")
                        : subscriptionPlan.interval === "year"
                          ? t("subscription.yearly")
                          : ""}
                    </span>
                  )}
                </div>
                <Link
                  href="/dashboard/billing"
                  className="flex gap-1 items-center text-xs text-primary hover:underline"
                >
                  {t("subscription.manageBilling")}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {planFeatures?.features && planFeatures.features.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="flex justify-center items-center rounded-lg size-8 bg-primary/10">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {t("features.title")}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                {planFeatures.features
                  .filter((feature) => {
                    return (
                      feature?.limit &&
                      typeof feature.limit.current === "number" &&
                      feature.limit.max !== undefined
                    );
                  })
                  .slice(0, 3)
                  .map((feature) => {
                    const limit = feature.limit!;
                    return (
                      <div
                        key={feature.name || Math.random()}
                        className="flex justify-between items-center"
                      >
                        <span className="truncate">
                          {feature.name || "Unknown"}
                        </span>
                        <span className="ml-2 font-medium shrink-0">
                          {limit.current} /{" "}
                          {limit.max === "unlimited" ? "∞" : String(limit.max)}
                        </span>
                      </div>
                    );
                  })
                  .filter(Boolean)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settings Grid with Drawers */}
      <SettingsPageDrawer
        user={user}
        emailVerified={emailVerified}
        twoFactorEnabled={twoFactorEnabled}
        subscriptionPlan={subscriptionPlan}
        planFeatures={planFeatures}
      />
    </UnifiedPageLayout>
  );
}
