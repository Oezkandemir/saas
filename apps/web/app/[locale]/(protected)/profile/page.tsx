import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { formatDistance } from "date-fns";
import {
  BadgeCheck,
  Bell,
  CreditCard,
  HelpCircle,
  Mail,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";
import { FollowStats } from "@/components/follow-stats";
import { getFollowStatus } from "@/actions/follow-actions";

export async function generateMetadata() {
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

  // Get follow status and stats for current user
  const followStatus = await getFollowStatus(user.id);

  const hasSubscription = !!userData?.stripe_subscription_id;
  const subscriptionStatus = hasSubscription ? "active" : null; // Simplified since we don't have the status field
  const subscriptionEndsAt =
    hasSubscription && userData?.stripe_current_period_end
      ? new Date(userData.stripe_current_period_end)
      : null;

  // Get email verification status from Supabase user metadata
  const emailVerified = user.email_confirmed_at != null;

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("updateProfile")}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left sidebar with user info */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row gap-4 items-center pb-2">
            <Avatar className="size-16">
              <AvatarImage
                src={user.avatar_url || ""}
                alt={user.name || "User"}
              />
              <AvatarFallback>
                {user.name?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name || t("personalInfo.title")}</CardTitle>
              <CardDescription className="flex items-center">
                {user.role === "ADMIN" && (
                  <Shield className="mr-1 text-blue-500 size-3" />
                )}
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t("accountInfo")}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("memberSince")}</span>
                <span className="text-sm font-medium">
                  {user.created_at
                    ? formatDistance(new Date(user.created_at), new Date(), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("lastLogin")}</span>
                <span className="text-sm font-medium">
                  {user.last_sign_in_at
                    ? formatDistance(
                        new Date(user.last_sign_in_at),
                        new Date(),
                        { addSuffix: true },
                      )
                    : "N/A"}
                </span>
              </div>
              {subscriptionStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("subscription")}</span>
                  <span
                    className={`flex items-center text-sm font-medium ${subscriptionStatus === "active" ? "text-green-500" : "text-yellow-500"}`}
                  >
                    <BadgeCheck className="mr-1 size-3" />
                    {subscriptionStatus === "active"
                      ? t("active")
                      : t("inactive")}
                  </span>
                </div>
              )}
              {subscriptionEndsAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("renews")}</span>
                  <span className="text-sm font-medium">
                    {formatDistance(subscriptionEndsAt, new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("quickLinks")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/billing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start w-full"
                  >
                    <CreditCard className="mr-2 size-4" />
                    {t("billing")}
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start w-full"
                  >
                    <Settings className="mr-2 size-4" />
                    {t("settings")}
                  </Button>
                </Link>
                <Link href="/dashboard/support">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start w-full"
                  >
                    <HelpCircle className="mr-2 size-4" />
                    {t("support")}
                  </Button>
                </Link>
                <Link href="/dashboard/notifications">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start w-full"
                  >
                    <Bell className="mr-2 size-4" />
                    {t("notifications.title")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Follow Stats */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Social
              </p>
              <FollowStats
                userId={user.id}
                followerCount={followStatus.followerCount}
                followingCount={followStatus.followingCount}
                className="justify-start"
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main content with tabs */}
        <div className="md:col-span-2">
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
      </div>
    </>
  );
}
