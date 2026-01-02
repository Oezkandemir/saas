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
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  User,
  Globe,
} from "lucide-react";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
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
import { getDefaultCompanyProfile, getCompanyProfiles } from "@/actions/company-profiles-actions";
import { Badge } from '@/components/alignui/data-display/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    console.error("Error fetching user data:", error);
  }

  // Get company profile - try default first, then get first available profile
  let companyProfile = await getDefaultCompanyProfile().catch(() => null);
  if (!companyProfile) {
    const allProfiles = await getCompanyProfiles().catch(() => []);
    companyProfile = allProfiles.length > 0 ? allProfiles[0] : null;
  }

  const hasSubscription = !!userData?.stripe_subscription_id;
  const subscriptionStatus = hasSubscription ? "active" : null; // Simplified since we don't have the status field
  const subscriptionEndsAt =
    hasSubscription && userData?.stripe_current_period_end
      ? new Date(userData.stripe_current_period_end)
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
                  
                  {subscriptionStatus && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-green-500/10 border border-green-500/20">
                        <BadgeCheck className="size-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("subscription")}</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {subscriptionStatus === "active" ? t("active") : t("inactive")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Company Profile Section - Accordion */}
      <Card>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="company-profile" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 border border-primary/20">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">
                        {companyProfile ? companyProfile.company_name : "Firmenprofil"}
                      </CardTitle>
                      {companyProfile?.is_default && (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                          Standard
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm mt-0.5">
                      {companyProfile ? "Standard-Profil für Dokumente und Rechnungen" : "Kein Firmenprofil vorhanden"}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {companyProfile ? (
                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {companyProfile.profile_name && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Profilname</p>
                        <p className="text-sm">{companyProfile.profile_name}</p>
                      </div>
                    )}
                    {companyProfile.company_address && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" />
                          Adresse
                        </p>
                        <p className="text-sm">
                          {companyProfile.company_address}
                          {companyProfile.company_address_line2 && `, ${companyProfile.company_address_line2}`}
                          {companyProfile.company_postal_code && companyProfile.company_city && (
                            <><br />{companyProfile.company_postal_code} {companyProfile.company_city}</>
                          )}
                          {companyProfile.company_country && (
                            <><br />{companyProfile.company_country}</>
                          )}
                        </p>
                      </div>
                    )}
                    {companyProfile.company_email && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" />
                          E-Mail
                        </p>
                        <a href={`mailto:${companyProfile.company_email}`} className="text-sm text-primary hover:underline">
                          {companyProfile.company_email}
                        </a>
                      </div>
                    )}
                    {(companyProfile.company_phone || companyProfile.company_mobile) && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="size-3" />
                          Telefon
                        </p>
                        <p className="text-sm">
                          {companyProfile.company_phone || companyProfile.company_mobile}
                        </p>
                      </div>
                    )}
                    {companyProfile.company_website && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Globe className="size-3" />
                          Website
                        </p>
                        <a 
                          href={companyProfile.company_website.startsWith('http') ? companyProfile.company_website : `https://${companyProfile.company_website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {companyProfile.company_website}
                        </a>
                      </div>
                    )}
                    {(companyProfile.company_vat_id || companyProfile.company_tax_id) && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Steuernummer / USt-IdNr.</p>
                        <p className="text-sm">
                          {companyProfile.company_vat_id && `USt-IdNr.: ${companyProfile.company_vat_id}`}
                          {companyProfile.company_vat_id && companyProfile.company_tax_id && " / "}
                          {companyProfile.company_tax_id && `Steuernummer: ${companyProfile.company_tax_id}`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <Link href="/dashboard/settings/company">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Firmenprofile verwalten
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Kein Firmenprofil vorhanden</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Erstellen Sie ein Firmenprofil, um Ihre Firmendaten für Dokumente und Rechnungen zu verwalten.
                  </p>
                  <Link href="/dashboard/settings/company/new">
                    <Button className="gap-2">
                      <Building2 className="size-4" />
                      Erstes Firmenprofil erstellen
                    </Button>
                  </Link>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/billing">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <CreditCard className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{t("billing")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/settings">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Settings className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{t("settings")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/support">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <HelpCircle className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{t("support")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/profile/notifications">
          <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Bell className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{t("notifications.title")}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

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
                    {hasSubscription ? (
                      <div className="p-4 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{t("currentPlan")}</p>
                            <p className="text-sm text-muted-foreground">
                              {userData.stripe_price_id
                                ? t("premiumPlan")
                                : t("basicPlan")}
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

            <TabsContent value="billing" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("billingInfo")}</CardTitle>
                  <CardDescription>{t("manageSubscription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-6 text-center rounded-lg border">
                    <p className="mb-4 text-muted-foreground">
                      {t("viewManageSubscription")}
                    </p>
                    <Link href="/dashboard/billing">
                      <Button>{t("goToBilling")}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("accountSettings")}</CardTitle>
                  <CardDescription>{t("updateSettings")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-6 text-center rounded-lg border">
                    <p className="mb-4 text-muted-foreground">
                      {t("manageAccountSettings")}
                    </p>
                    <Link href="/dashboard/settings">
                      <Button>{t("goToSettings")}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </UnifiedPageLayout>
  );
}
