import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/actions/admin-user-actions";
import { getAllTickets } from "@/actions/support-ticket-actions";
import {
  AlertTriangle,
  BarChart4,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfigureStripePortalButton } from "@/components/admin/configure-stripe-button";
import { DashboardHeader } from "@/components/dashboard/header";

export async function generateMetadata() {
  const t = await getTranslations("Admin.panel");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: {
    locale: string;
  };
};

export default async function AdminPanelPage(props: Props) {
  // Extract locale safely from props
  const locale = props.params.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin");
  const tPanel = await getTranslations("Admin.panel");
  const tUsers = await getTranslations("Admin.users");
  const tSupport = await getTranslations("Admin.support");
  const tStats = await getTranslations("Admin.stats");

  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role instead of email pattern
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch data for stats
  const usersResult = await getAllUsers();
  const ticketsResult = await getAllTickets();

  // Default values in case of errors
  let totalUsers = 0;
  let adminUsers = 0;
  let subscribedUsers = 0;
  let totalTickets = 0;
  let openTickets = 0;
  let inProgressTickets = 0;
  let resolvedTickets = 0;

  if (usersResult.success && usersResult.data) {
    const users = usersResult.data;
    totalUsers = users.length;
    adminUsers = users.filter((user) => user.role === "ADMIN").length;
    subscribedUsers = users.filter(
      (user) => user.stripe_subscription_id,
    ).length;
  }

  if (ticketsResult.success && ticketsResult.data) {
    const tickets = ticketsResult.data;
    totalTickets = tickets.length;
    openTickets = tickets.filter((ticket) => ticket.status === "open").length;
    inProgressTickets = tickets.filter(
      (ticket) => ticket.status === "in_progress",
    ).length;
    resolvedTickets = tickets.filter(
      (ticket) => ticket.status === "resolved" || ticket.status === "closed",
    ).length;
  }

  return (
    <div className="container px-0 sm:px-4">
      <DashboardHeader
        heading={tPanel("heading")}
        text={tPanel("subheading")}
      />

      {/* User Stats Section */}
      <div className="my-6">
        <h2 className="mb-3 text-lg font-medium">{tStats("userStats")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tUsers("totalUsers")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{totalUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                <Users className="size-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tUsers("adminUsers")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{adminUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-purple-100">
                <ShieldCheck className="size-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tUsers("subscribers")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{subscribedUsers}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
                <CreditCard className="size-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-indigo-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tSupport("openTickets")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{openTickets}</h3>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100">
                <MessageSquare className="size-4 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support Ticket Stats Section */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium">{tStats("ticketStatus")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tStats("newTickets")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{openTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tStats("awaitingResponse")}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="size-4 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-orange-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tSupport("statuses.inProgress")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{inProgressTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tStats("currentlyHandled")}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-100">
                <Clock className="size-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-emerald-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tSupport("statuses.resolved")}
                </p>
                <h3 className="mt-1 text-xl font-bold">{resolvedTickets}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tStats("completedTickets")}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="size-4 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Admin Modules */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <Users className="mr-2 size-5" />
              {tUsers("management")}
            </CardTitle>
            <CardDescription>{tUsers("description")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {tStats("userManagementDesc")}
            </p>
            <Link href={`/${locale}/admin/users`}>
              <Button className="gap-2">
                {tUsers("manageUsers")}
                <Users className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 size-5" />
              {tSupport("tickets")}
            </CardTitle>
            <CardDescription>{tSupport("description")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {tStats("supportTicketsDesc")}
            </p>
            <Link href={`/${locale}/admin/support`}>
              <Button className="gap-2">
                {tSupport("manageTickets")}
                <MessageSquare className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <BarChart4 className="mr-2 size-5" />
              {tStats("analyticsDashboard")}
            </CardTitle>
            <CardDescription>{tStats("trackMetrics")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {tStats("analyticsDashboard")} - {tStats("trackMetrics")}
            </p>
            <Link href={`/${locale}/admin/analytics`}>
              <Button className="gap-2">
                {tStats("viewAnalytics")}
                <BarChart4 className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center">
              <Settings className="mr-2 size-5" />
              Stripe {t("configuration")}
            </CardTitle>
            <CardDescription>{t("configure_stripe_portal")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ConfigureStripePortalButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
