import Link from "next/link";
import { redirect } from "next/navigation";
import { UserSubscriptionPlan } from "@/types";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Key,
  Lock,
  Palette,
  Settings,
  Shield,
  Trash2,
  User,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { logger } from "@/lib/logger";
import { getAllPlanFeatures, type PlanFeaturesInfo } from "@/lib/plan-features";
import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { AccountDeletion } from "@/components/gdpr/account-deletion";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

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

  const settingsSections = [
    {
      title: t("companySettings.title"),
      description: t("companySettings.description"),
      icon: Building2,
      href: "/dashboard/settings/company",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("preferences.title"),
      description: t("preferences.description"),
      icon: Palette,
      href: "/dashboard/settings/preferences",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: t("security.title"),
      description: t("security.description"),
      icon: Shield,
      href: "/dashboard/settings/security",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      badge: twoFactorEnabled ? (
        <Badge
          variant="default"
          className="text-xs text-green-600 bg-green-500/10 border-green-500/20"
        >
          <CheckCircle2 className="mr-1 size-3" />
          2FA Aktiv
        </Badge>
      ) : null,
    },
    {
      title: "Benachrichtigungen",
      description: "E-Mail, Push und In-App Benachrichtigungen verwalten",
      icon: Bell,
      href: "/dashboard/settings/preferences#notifications",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: t("privacy.title"),
      description: t("privacy.gdprDescription"),
      icon: Lock,
      href: "/dashboard/settings/privacy",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("text")}
      icon={<Settings className="w-4 h-4 text-primary" />}
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
                <CardTitle className="text-sm font-medium">Profil</CardTitle>
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
                      Verifiziert
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 size-3" />
                      Nicht verifiziert
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
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {planFeatures &&
          planFeatures.features &&
          planFeatures.features.length > 0 && (
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
                        feature &&
                        feature.limit &&
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
                            {limit.max === "unlimited"
                              ? "∞"
                              : String(limit.max)}
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

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 items-center">
            <User className="size-5 text-primary" />
            <CardTitle>Profil</CardTitle>
          </div>
          <CardDescription>
            Verwalten Sie Ihre Profilinformationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserAvatarForm
            user={{ id: user.id, avatar_url: user.user_metadata?.avatar_url }}
          />
          <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-all cursor-pointer hover:border-primary/50 group">
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <div
                      className={`flex items-center justify-center size-10 rounded-lg ${section.bgColor} shrink-0`}
                    >
                      <Icon className={`size-5 ${section.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 text-sm font-semibold break-words">
                            {section.title}
                          </h3>
                          <p className="text-xs break-words text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                        {section.badge}
                      </div>
                      <div className="flex items-center mt-3 text-xs text-primary group-hover:underline">
                        Verwalten
                        <ArrowRight className="ml-1 transition-transform size-3 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex gap-2 items-center">
              <Key className="size-5 text-primary" />
              <CardTitle>API & Integrationen</CardTitle>
            </div>
            <CardDescription>
              API-Schlüssel und Webhooks verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                <div className="flex gap-2 items-center">
                  <Key className="size-4 text-muted-foreground" />
                  <span className="text-sm">API-Schlüssel</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Bald verfügbar
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                <div className="flex gap-2 items-center">
                  <Webhook className="size-4 text-muted-foreground" />
                  <span className="text-sm">Webhooks</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Bald verfügbar
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex gap-2 items-center">
              <FileText className="size-5 text-primary" />
              <CardTitle>Dokumente & Export</CardTitle>
            </div>
            <CardDescription>
              Export-Einstellungen und Dokumentvorlagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                <div className="flex gap-2 items-center">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm">Export-Formate</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Bald verfügbar
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                <div className="flex gap-2 items-center">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm">Sprache & Region</span>
                </div>
                <Link
                  href="/dashboard/settings/preferences"
                  className="flex gap-1 items-center text-xs text-primary hover:underline"
                >
                  Verwalten
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex gap-2 items-center">
            <Trash2 className="size-5 text-destructive" />
            <CardTitle className="text-destructive">
              {t("dangerZone.title")}
            </CardTitle>
          </div>
          <CardDescription>{t("dangerZone.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountDeletion />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}
