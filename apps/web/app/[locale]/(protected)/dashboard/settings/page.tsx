import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DataExport } from "@/components/gdpr/data-export";
import { AccountDeletion } from "@/components/gdpr/account-deletion";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, Settings, ArrowRight, Building2 } from "lucide-react";
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
  try {
    subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
  }

  return (
    <div className="relative flex flex-col gap-4 sm:gap-6 px-2 sm:px-0">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <div className="px-2 sm:px-0">
        <ModernPageHeader
          title={t("heading")}
          description={t("text")}
          icon={<Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        />
      </div>

      <div className="divide-y divide-border/50 space-y-4 sm:space-y-6 pb-10">
        {/* Company Settings Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Company Settings"
            description="Manage your company information for invoices and documents"
          >
            <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
              {/* Gradient background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />

              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 shadow-lg shrink-0">
                    <Building2 className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg">Company Profiles</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Manage company information for all your documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Centralized company data for invoices, quotes, and more
                  </div>
                  <Link href="/dashboard/settings/company" className="group flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all touch-manipulation shrink-0">
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
          <div className="pt-4 sm:pt-6">
            <SectionColumns
              title="Subscription Plan"
              description="Your current subscription plan"
            >
              <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
                {/* Gradient background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5" />

                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {subscriptionPlan.isPaid ? (
                      <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 shadow-lg shrink-0">
                        <Crown className="size-4 sm:size-5" />
                      </div>
                    ) : (
                      <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 text-muted-foreground shadow-lg shrink-0">
                        <Sparkles className="size-4 sm:size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg">Current Plan</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
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
                        className={cn(
                          "text-xs sm:text-sm",
                          subscriptionPlan.isPaid 
                            ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-900 dark:text-yellow-100"
                            : ""
                        )}
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
            <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
              {/* Gradient background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />

              <CardContent className="p-3 sm:p-4">
                <div className="rounded-md bg-muted/50 p-3 sm:p-4 backdrop-blur-sm border border-border/50">
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

        {/* GDPR Data Export Section */}
        <div className="pt-4 sm:pt-6">
          <SectionColumns
            title="Datenschutz & DSGVO"
            description="Verwalten Sie Ihre Daten gemäß DSGVO"
          >
            <DataExport />
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
      </div>
    </div>
  );
}
