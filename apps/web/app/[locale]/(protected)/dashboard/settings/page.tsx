import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getAllPlanFeatures, type PlanFeaturesInfo } from "@/lib/plan-features";
import { constructMetadata } from "@/lib/utils";
import { AccountDeletion } from "@/components/gdpr/account-deletion";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Settings, ArrowRight } from "lucide-react";
import { UserSubscriptionPlan } from "@/types";

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
    console.error("Error fetching subscription plan:", error);
  }

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("text")}
      icon={<Settings className="h-4 w-4 text-primary" />}
      contentClassName=""
    >
      {/* SETTINGS LIST - Clean vertical list, Linear/Stripe pattern */}
      <div className="divide-y divide-border">
        {/* Profile Section */}
        <div className="py-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-0.5">Profile</h2>
            <p className="text-xs text-muted-foreground">Manage your account information</p>
          </div>
          <div className="space-y-4">
            <UserAvatarForm
              user={{ id: user.id, avatar_url: user.user_metadata?.avatar_url }}
            />
            <UserNameForm user={{ id: user.id, name: user.name || "" }} />
          </div>
        </div>

        {/* Subscription Section */}
        {subscriptionPlan && (
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">{t("subscription.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("subscription.description")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={subscriptionPlan.isPaid ? "default" : "outline"}
                  className="text-xs"
                >
                  {subscriptionPlan.title}
                </Badge>
                {subscriptionPlan.isPaid && (
                  <span className="text-xs text-muted-foreground">
                    {subscriptionPlan.interval === "month" ? t("subscription.monthly") : subscriptionPlan.interval === "year" ? t("subscription.yearly") : ""}
                  </span>
                )}
                <Link href="/dashboard/billing" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {t("subscription.manageBilling")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Plan Features Section */}
        {planFeatures && planFeatures.features && planFeatures.features.length > 0 && (
          <div className="py-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold mb-0.5">{t("features.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("features.description")}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {planFeatures.features
                .filter((feature) => {
                  return feature && 
                         feature.limit && 
                         typeof feature.limit.current === 'number' &&
                         feature.limit.max !== undefined;
                })
                .map((feature) => {
                  const limit = feature.limit!;
                  return (
                    <div key={feature.name || Math.random()} className="flex items-center justify-between">
                      <span>{feature.name || 'Unknown'}</span>
                      <span className="font-medium">
                        {limit.current} / {limit.max === "unlimited" ? "∞" : String(limit.max)}
                      </span>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        )}

        {/* Settings Links - Simple rows */}
        <div className="py-4 space-y-0">
          <Link href="/dashboard/settings/company" className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-4 px-4 rounded transition-colors">
            <div>
              <h3 className="text-sm font-medium">{t("companySettings.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("companySettings.description")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link href="/dashboard/settings/preferences" className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-4 px-4 rounded transition-colors">
            <div>
              <h3 className="text-sm font-medium">{t("preferences.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("preferences.description")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link href="/dashboard/settings/security" className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-4 px-4 rounded transition-colors">
            <div>
              <h3 className="text-sm font-medium">{t("security.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("security.description")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link href="/dashboard/settings/privacy" className="flex items-center justify-between py-3 group hover:bg-muted/30 -mx-4 px-4 rounded transition-colors">
            <div>
              <h3 className="text-sm font-medium">{t("privacy.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("privacy.gdprDescription")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="py-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold mb-0.5">{t("dangerZone.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("dangerZone.description")}</p>
          </div>
          <AccountDeletion />
        </div>
      </div>
    </UnifiedPageLayout>
  );
}
