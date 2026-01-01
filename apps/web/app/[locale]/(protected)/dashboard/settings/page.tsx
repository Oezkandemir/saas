import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getAllPlanFeatures, type PlanFeaturesInfo } from "@/lib/plan-features";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { PlanFeaturesDisplay } from "@/components/dashboard/plan-features-display";
import { DataExport } from "@/components/gdpr/data-export";
import { AccountDeletion } from "@/components/gdpr/account-deletion";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, Settings, ArrowRight, Building2, Shield, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSubscriptionPlan } from "@/types";

export async function generateMetadata() {
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
      contentClassName="divide-y divide-border/50 space-y-3 sm:space-y-4 pb-10"
    >
        {/* Company Settings Section */}
        <div className="pt-3 sm:pt-4">
          <SectionColumns
            title="Company Settings"
            description="Manage your company information for invoices and documents"
          >
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                    <Building2 className="size-3.5 sm:size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">Company Profiles</CardTitle>
                    <CardDescription className="text-xs truncate">
                      Manage company information for all your documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Centralized company data for invoices, quotes, and more
                  </div>
                  <Link href="/dashboard/settings/company" className="group flex items-center gap-1 text-xs sm:text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
                    Manage Profiles
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SectionColumns>
        </div>

        {/* Subscription Plan Section */}
        {subscriptionPlan && (
          <div className="pt-3 sm:pt-4">
            <SectionColumns
              title="Subscription Plan"
              description="Your current subscription plan"
            >
              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    {subscriptionPlan.isPaid ? (
                      <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                        <Crown className="size-3.5 sm:size-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                        <Sparkles className="size-3.5 sm:size-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-base truncate">Current Plan</CardTitle>
                      <CardDescription className="text-xs truncate">
                        Manage your subscription and billing
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Badge
                        variant={subscriptionPlan.isPaid ? "default" : "outline"}
                        className="text-xs sm:text-sm"
                      >
                        {subscriptionPlan.title}
                      </Badge>
                      {subscriptionPlan.isPaid && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {subscriptionPlan.interval === "month" ? "Monthly" : subscriptionPlan.interval === "year" ? "Yearly" : ""}
                        </span>
                      )}
                    </div>
                    <Link href="/dashboard/billing" className="group flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
                      Manage Billing
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </SectionColumns>
          </div>
        )}

        {/* Plan Features & Limits Section */}
        {planFeatures && (
          <div className="pt-3 sm:pt-4">
            <SectionColumns
              title="Features & Limits"
              description="Detaillierte Übersicht über Ihre verfügbaren Features und aktuellen Limits"
            >
              <PlanFeaturesDisplay planInfo={planFeatures} />
            </SectionColumns>
          </div>
        )}

        <div className="pt-4 sm:pt-6">
          <UserAvatarForm
            user={{ id: user.id, avatar_url: user.user_metadata?.avatar_url }}
          />
        </div>
        <div className="pt-4 sm:pt-6">
          <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        </div>
        <div className="pt-4 sm:pt-6">
          <UserRoleForm user={{ id: user.id, role: user.role || "USER" }} />
        </div>

        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title={t("userInformation")}
            description={t("debugInformation")}
          >
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="rounded-md bg-muted/50 p-3 sm:p-4 border border-border">
                  <pre className="overflow-auto text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(
                      {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        metadata: user.user_metadata,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </SectionColumns>
        </div>

        {/* Preferences Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Preferences"
            description="Customize your application preferences"
          >
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                    <Settings className="size-3.5 sm:size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">Application Preferences</CardTitle>
                    <CardDescription className="text-xs truncate">
                      Theme, language, notifications, and format settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Customize theme, language, date/time formats, and notification preferences
                  </div>
                  <Link href="/dashboard/settings/preferences" className="group flex items-center gap-1 text-xs sm:text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
                    Manage Preferences
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SectionColumns>
        </div>

        {/* Security Settings Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Sicherheit"
            description="Verwalten Sie Ihre Sicherheitseinstellungen"
          >
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                    <Shield className="size-3.5 sm:size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">Sicherheitseinstellungen</CardTitle>
                    <CardDescription className="text-xs truncate">
                      2FA, Sessions und Login-Historie verwalten
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Zwei-Faktor-Authentifizierung, aktive Sessions und Login-Historie
                  </div>
                  <Link href="/dashboard/settings/security" className="group flex items-center gap-1 text-xs sm:text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
                    Sicherheit verwalten
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SectionColumns>
        </div>

        {/* GDPR Data Export Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Datenschutz & DSGVO"
            description="Verwalten Sie Ihre Daten gemäß DSGVO"
          >
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-muted/50 border border-border shrink-0">
                    <FileText className="size-3.5 sm:size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base truncate">Datenschutz-Einstellungen</CardTitle>
                    <CardDescription className="text-xs truncate">
                      Einwilligungen und Datenexport verwalten
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    Verwalten Sie Ihre Einwilligungen und exportieren Sie Ihre Daten
                  </div>
                  <Link href="/dashboard/settings/privacy" className="group flex items-center gap-1 text-xs sm:text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
                    Datenschutz verwalten
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SectionColumns>
        </div>

        {/* Account Deletion Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Gefahrenzone"
            description="Unwiderrufliche Aktionen"
          >
            <AccountDeletion />
          </SectionColumns>
        </div>
    </UnifiedPageLayout>
  );
}
