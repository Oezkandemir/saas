import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import {
  BadgeCheck,
  Bell,
  Building2,
  CreditCard,
  HelpCircle,
  Settings,
  Shield,
  User,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { constructMetadata, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/alignui/data-display/avatar';
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";
import { getDefaultCompanyProfile } from "@/actions/company-profiles-actions";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { BillingInfo } from "@/components/pricing/billing-info";
import { PolarPortalButton } from "@/components/pricing/polar-portal-button";
import { PolarPortalButtonWithSubscription } from "@/components/pricing/polar-portal-button-subscription";
import { PolarPortalButtonFallback } from "@/components/pricing/polar-portal-button-fallback";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { getUserPreferences } from "@/actions/preferences-actions";
import { pricingData } from "@/config/subscriptions";
import { UserSubscriptionPlan } from "types";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Profile");

  return constructMetadata({
    title: t("title") || "User Profile",
    description: t("description") || "Manage your profile and settings",
  });
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Profile");

  if (!user?.email) {
    redirect("/login");
  }

  // Fetch user tickets
  const ticketsResult = await getUserTickets();
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  // Fetch user subscription and other details
  const supabase = await createClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    logger.error("Error fetching user data:", error);
  }

  // Get company profile - only default profile
  const companyProfile = await getDefaultCompanyProfile().catch(() => null);

  // Get user subscription plan
  const defaultFreePlan: UserSubscriptionPlan = {
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

  let userSubscriptionPlan: UserSubscriptionPlan;
  try {
    const plan = await getUserSubscriptionPlan(user.id, user.email);
    userSubscriptionPlan = plan || defaultFreePlan;
  } catch (error) {
    logger.error("Error fetching subscription plan:", error);
    userSubscriptionPlan = defaultFreePlan;
  }

  // Get user preferences
  const preferencesResult = await getUserPreferences();
  const preferences = preferencesResult.success ? preferencesResult.data : null;

  // Check subscription status - Polar only (Stripe is deprecated)
  const paymentProvider = userData?.payment_provider || "polar";
  const hasSubscription = userSubscriptionPlan?.isPaid || false;
  const subscriptionStatus = hasSubscription ? "active" : null;
  const subscriptionEndsAt = hasSubscription && userSubscriptionPlan?.polarCurrentPeriodEnd
    ? new Date(userSubscriptionPlan.polarCurrentPeriodEnd)
    : null;

  // Get email verification status from Supabase user metadata
  const emailVerified = user.email_confirmed_at != null;

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("updateProfile")}
      icon={<User className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Hero Profile Section - Modern Big Tech Style */}
      <Card className="border-2 bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar - Perfect Circle, Not Stretched */}
              <div className="relative flex-shrink-0">
                <Avatar className="size-24 sm:size-32 border-4 border-background shadow-lg ring-2 ring-primary/20">
                  <AvatarImage
                    src={user.avatar_url || ""}
                    alt={user.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl sm:text-3xl font-semibold">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {user.role === "ADMIN" && (
                  <div className="absolute -bottom-1 -right-1 flex items-center justify-center size-8 sm:size-10 rounded-full bg-blue-500 border-4 border-background shadow-lg">
                    <Shield className="size-4 sm:size-5 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 truncate">
                      {user.name || t("personalInfo.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base break-all">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/50 border border-border">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("memberSince")}</p>
                      <p className="text-sm font-medium">
                        {user.created_at
                          ? formatDistance(new Date(user.created_at), new Date(), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {subscriptionStatus && userSubscriptionPlan && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-green-500/10 border border-green-500/20">
                        <BadgeCheck className="size-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("subscription")}</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {userSubscriptionPlan.title}
                        </p>
                      </div>
                    </div>
                  )}

                  {companyProfile && (
                    <Link href={`/dashboard/settings/company/${companyProfile.id}`} className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 border border-primary/20">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-muted-foreground">Firma</p>
                          {companyProfile.is_default && (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 h-4">
                              Standard
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate max-w-[150px] group-hover:text-primary transition-colors">
                          {companyProfile.company_name}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Main content with tabs */}
      <div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">
                <User className="mr-2 size-4 md:hidden" />
                <span className="hidden md:inline">{t("overview")}</span>
                <span className="md:hidden">{t("info")}</span>
              </TabsTrigger>
              <TabsTrigger value="support">
                <HelpCircle className="mr-2 size-4 md:hidden" />
                <span className="hidden md:inline">{t("support")}</span>
                <span className="md:hidden">{t("help")}</span>
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="mr-2 size-4 md:hidden" />
                <span className="hidden md:inline">{t("billing")}</span>
                <span className="md:hidden">{t("pay")}</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 size-4 md:hidden" />
                <span className="hidden md:inline">{t("settings")}</span>
                <span className="md:hidden">{t("edit")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("overview")}</CardTitle>
                  <CardDescription>{t("updateProfile")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {t("personalInfo.title")}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("personalInfo.name")}
                        </p>
                        <p>{user.name || t("personalInfo.notProvided")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("personalInfo.email")}
                        </p>
                        <p>{user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("accountStatus")}
                        </p>
                        <p>{t("active")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("emailVerified")}
                        </p>
                        <p>{emailVerified ? t("yes") : t("no")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {t("subscription")}
                    </h3>
                    {hasSubscription && userSubscriptionPlan ? (
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{t("currentPlan")}</p>
                            <p className="text-sm text-muted-foreground">
                              {userSubscriptionPlan.title}
                              {userSubscriptionPlan.interval && (
                                <span className="ml-2 text-xs">
                                  ({userSubscriptionPlan.interval === "month" ? t("monthly") : t("yearly")})
                                </span>
                              )}
                            </p>
                          </div>
                          <Link href="/dashboard/billing">
                            <Button variant="outline" size="sm">
                              {t("manage")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{t("freePlan")}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("upgradeText")}
                            </p>
                          </div>
                          <Link href="/dashboard/billing">
                            <Button>{t("upgrade")}</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {t("activity.title")}
                    </h3>
                    <div className="p-4 rounded-lg border">
                      <p className="mb-2 text-sm text-muted-foreground">
                        {t("recentLogins")}
                      </p>
                      <div className="space-y-2">
                        {user.last_sign_in_at && (
                          <div className="flex justify-between items-center text-sm">
                            <span>{t("lastLogin")}</span>
                            <span>
                              {formatDistance(
                                new Date(user.last_sign_in_at),
                                new Date(),
                                { addSuffix: true },
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("supportTickets")}</CardTitle>
                  <CardDescription>{t("viewManage")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {t("yourTickets")}
                    </h3>
                    <Link href="/dashboard/support/new">
                      <Button>{t("createNewTicket")}</Button>
                    </Link>
                  </div>
                  {tickets.length > 0 ? (
                    <UserTicketAccordion data={tickets} />
                  ) : (
                    <div className="p-6 text-center rounded-lg border">
                      <HelpCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
                      <h3 className="mb-2 text-xl font-semibold">
                        {t("noTickets")}
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        {t("needHelp")}
                      </p>
                      <Link href="/dashboard/support/new">
                        <Button>{t("createNewTicket")}</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-4 space-y-4">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("billingInfo")}</CardTitle>
                  <CardDescription>{t("manageSubscription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BillingInfo userSubscriptionPlan={userSubscriptionPlan} userEmail={user.email} />
                  
                  {/* Micro Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Abrechnung verwalten</span>
                      {userSubscriptionPlan.polarCustomerId ? (
                        <PolarPortalButton 
                          customerId={userSubscriptionPlan.polarCustomerId}
                          variant="outline"
                          className="h-8 text-xs"
                        />
                      ) : userSubscriptionPlan.polarSubscriptionId ? (
                        <PolarPortalButtonWithSubscription 
                          subscriptionId={userSubscriptionPlan.polarSubscriptionId}
                          variant="outline"
                          className="h-8 text-xs"
                        />
                      ) : (
                        <PolarPortalButtonFallback 
                          variant="outline"
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                    <Link href="/dashboard/billing" className="flex items-center justify-between text-sm group hover:text-primary transition-colors">
                      <span className="text-muted-foreground">Vollständige Abrechnungsübersicht</span>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>Verwalten Sie Ihre Profilinformationen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Profilbild</label>
                      <UserAvatarForm
                        user={{ id: user.id, avatar_url: user.avatar_url }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <UserNameForm user={{ id: user.id, name: user.name || "" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              {preferences && (
                <Card>
                  <CardHeader>
                    <CardTitle>Einstellungen</CardTitle>
                    <CardDescription>Anpassen Sie Ihre Präferenzen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Design</p>
                        <p className="text-sm capitalize">{preferences.theme_preference || "System"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Sprache</p>
                        <p className="text-sm">{preferences.language_preference || "Deutsch"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Währung</p>
                        <p className="text-sm">{preferences.currency || "EUR"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Datumsformat</p>
                        <p className="text-sm">{preferences.date_format || "DD.MM.YYYY"}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Link href="/dashboard/settings/preferences" className="flex items-center justify-between text-sm group hover:text-primary transition-colors">
                        <span className="text-muted-foreground">Alle Einstellungen verwalten</span>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Weitere Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border">
                  <Link href="/dashboard/settings/company" className="flex items-center justify-between py-3 group hover:text-primary transition-colors">
                    <div>
                      <h3 className="text-sm font-medium">Firmenprofile</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Firmendaten verwalten</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                  <Link href="/dashboard/settings/security" className="flex items-center justify-between py-3 group hover:text-primary transition-colors">
                    <div>
                      <h3 className="text-sm font-medium">Sicherheit</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Passwort und 2FA</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                  <Link href="/dashboard/settings/privacy" className="flex items-center justify-between py-3 group hover:text-primary transition-colors">
                    <div>
                      <h3 className="text-sm font-medium">Datenschutz</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">GDPR & Datenschutz</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </UnifiedPageLayout>
  );
}
