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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import {
  Settings,
  ArrowRight,
  User,
  Building2,
  Shield,
  Bell,
  Palette,
  Lock,
  CreditCard,
  Key,
  Webhook,
  Globe,
  Mail,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { UserSubscriptionPlan } from "@/types";
import { createClient } from "@/lib/supabase/server";

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
        <Badge variant="default" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="size-3 mr-1" />
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
      icon={<Settings className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Quick Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                  <User className="size-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium">Profil</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground break-words">{user.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant={emailVerified ? "default" : "destructive"} className="text-xs">
                  {emailVerified ? (
                    <>
                      <CheckCircle2 className="size-3 mr-1" />
                      Verifiziert
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3 mr-1" />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                    <CreditCard className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium">{t("subscription.title")}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
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
                </div>
                <Link href="/dashboard/billing" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {t("subscription.manageBilling")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {planFeatures && planFeatures.features && planFeatures.features.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium">{t("features.title")}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                {planFeatures.features
                  .filter((feature) => {
                    return feature && 
                           feature.limit && 
                           typeof feature.limit.current === 'number' &&
                           feature.limit.max !== undefined;
                  })
                  .slice(0, 3)
                  .map((feature) => {
                    const limit = feature.limit!;
                    return (
                      <div key={feature.name || Math.random()} className="flex items-center justify-between">
                        <span className="truncate">{feature.name || 'Unknown'}</span>
                        <span className="font-medium shrink-0 ml-2">
                          {limit.current} / {limit.max === "unlimited" ? "∞" : String(limit.max)}
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
          <div className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <CardTitle>Profil</CardTitle>
          </div>
          <CardDescription>Verwalten Sie Ihre Profilinformationen</CardDescription>
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
              <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center size-10 rounded-lg ${section.bgColor} shrink-0`}>
                      <Icon className={`size-5 ${section.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1 break-words">{section.title}</h3>
                          <p className="text-xs text-muted-foreground break-words">{section.description}</p>
                        </div>
                        {section.badge}
                      </div>
                      <div className="mt-3 flex items-center text-xs text-primary group-hover:underline">
                        Verwalten
                        <ArrowRight className="size-3 ml-1 group-hover:translate-x-1 transition-transform" />
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
            <div className="flex items-center gap-2">
              <Key className="size-5 text-primary" />
              <CardTitle>API & Integrationen</CardTitle>
            </div>
            <CardDescription>API-Schlüssel und Webhooks verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-muted-foreground" />
                  <span className="text-sm">API-Schlüssel</span>
                </div>
                <Badge variant="outline" className="text-xs">Bald verfügbar</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Webhook className="size-4 text-muted-foreground" />
                  <span className="text-sm">Webhooks</span>
                </div>
                <Badge variant="outline" className="text-xs">Bald verfügbar</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <CardTitle>Dokumente & Export</CardTitle>
            </div>
            <CardDescription>Export-Einstellungen und Dokumentvorlagen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm">Export-Formate</span>
                </div>
                <Badge variant="outline" className="text-xs">Bald verfügbar</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm">Sprache & Region</span>
                </div>
                <Link href="/dashboard/settings/preferences" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Verwalten
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            <CardTitle className="text-destructive">{t("dangerZone.title")}</CardTitle>
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
