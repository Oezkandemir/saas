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
  Shield,
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
import { ModernPageHeader } from "@/components/layout/modern-page-header";

export async function generateMetadata() {
  const t = await getTranslations("Admin.panel");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminPanelPage(props: Props) {
  // Await the params to resolve the Promise
  const resolvedParams = await props.params;
  // Extract locale safely from resolved params
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin");
  const tPanel = await getTranslations("Admin.panel");
  const tUsers = await getTranslations("Admin.users");
  const tSupport = await getTranslations("Admin.support");
  const tStats = await getTranslations("Admin.stats");
  const tConfig = await getTranslations("Admin.configuration");

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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ModernPageHeader
        title={tPanel("heading")}
        description={tPanel("subheading")}
        icon={<Shield className="w-5 h-5 text-primary" />}
      />

      {/* User Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("totalUsers")}
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registrierte Benutzer
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("adminUsers")}
            </CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mit Admin-Rechten
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tUsers("subscribers")}
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribedUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktive Abonnements
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("openTickets")}
            </CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Benötigen Antwort
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Support Ticket Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tStats("newTickets")}
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tStats("awaitingResponse")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("statuses.inProgress")}
            </CardTitle>
            <Clock className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tStats("currentlyHandled")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tSupport("statuses.resolved")}
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tStats("completedTickets")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Modules */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/${locale}/admin/users`} className="group">
          <Card className="h-full hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                {tUsers("management")}
              </CardTitle>
              <CardDescription>{tUsers("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {tStats("userManagementDesc")}
              </p>
              <Button className="gap-2 w-full sm:w-auto">
                {tUsers("manageUsers")}
                <Users className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/support`} className="group">
          <Card className="h-full hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                {tSupport("tickets")}
              </CardTitle>
              <CardDescription>{tSupport("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {tStats("supportTicketsDesc")}
              </p>
              <Button className="gap-2 w-full sm:w-auto">
                {tSupport("manageTickets")}
                <MessageSquare className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/analytics`} className="group">
          <Card className="h-full hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart4 className="size-5 text-primary" />
                {tStats("analyticsDashboard")}
              </CardTitle>
              <CardDescription>{tStats("trackMetrics")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {tStats("analyticsDashboard")} - {tStats("trackMetrics")}
              </p>
              <Button className="gap-2 w-full sm:w-auto">
                {tStats("viewAnalytics")}
                <BarChart4 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              Stripe {tConfig("title")}
            </CardTitle>
            <CardDescription>{tConfig("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfigureStripePortalButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
