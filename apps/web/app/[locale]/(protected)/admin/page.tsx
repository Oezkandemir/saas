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
  Activity,
  Webhook,
  UserCog,
  TrendingUp,
  DollarSign,
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
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

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

  const stats = [
    {
      title: "Benutzer",
      value: totalUsers,
      icon: Users,
      description: "Gesamt Benutzer",
    },
    {
      title: "Admins",
      value: adminUsers,
      icon: ShieldCheck,
      description: "Administratoren",
    },
    {
      title: "Abonnements",
      value: subscribedUsers,
      icon: CreditCard,
      description: "Aktive Abos",
    },
    {
      title: "Offene Tickets",
      value: openTickets,
      icon: AlertTriangle,
      description: "Benötigen Aufmerksamkeit",
    },
    {
      title: "In Bearbeitung",
      value: inProgressTickets,
      icon: Clock,
      description: "Werden bearbeitet",
    },
    {
      title: "Gelöst",
      value: resolvedTickets,
      icon: CheckCircle,
      description: "Erfolgreich abgeschlossen",
    },
  ];

  return (
    <UnifiedPageLayout
      title={tPanel("heading")}
      description={tPanel("subheading")}
      icon={<Shield className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} hover>
              <CardHeader className="flex flex-row justify-between items-center pb-3 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex justify-center items-center rounded-md border size-9 bg-muted/50 border-border">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-1 text-2xl font-semibold">{stat.value}</div>
                <CardDescription className="text-xs">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
        {/* Main Admin Modules */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href={`/${locale}/admin/users`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <Users className="size-4 text-primary" />
                  {tUsers("management")}
                </CardTitle>
                <CardDescription className="text-xs">{tUsers("description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tStats("userManagementDesc")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tUsers("manageUsers")}
                  <Users className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/support`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <MessageSquare className="size-4 text-primary" />
                  {tSupport("tickets")}
                </CardTitle>
                <CardDescription className="text-xs">{tSupport("description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tStats("supportTicketsDesc")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tSupport("manageTickets")}
                  <MessageSquare className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/analytics`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <BarChart4 className="size-4 text-primary" />
                  {tStats("analyticsDashboard")}
                </CardTitle>
                <CardDescription className="text-xs">{tStats("trackMetrics")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tStats("analyticsDashboard")} - {tStats("trackMetrics")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tStats("viewAnalytics")}
                  <BarChart4 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/system`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <Activity className="size-4 text-primary" />
                  System-Monitoring
                </CardTitle>
                <CardDescription className="text-xs">
                  System-Status und Fehlerüberwachung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Überwachung des Systemstatus, Fehlerverfolgung und Health-Checks
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  System anzeigen
                  <Activity className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/webhooks`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <Webhook className="size-4 text-primary" />
                  Webhooks
                </CardTitle>
                <CardDescription className="text-xs">
                  Webhook-Konfiguration für Event-Benachrichtigungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Konfigurieren Sie Webhooks, um über wichtige Events benachrichtigt zu werden
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  Webhooks verwalten
                  <Webhook className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/roles`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <UserCog className="size-4 text-primary" />
                  Rollen & Berechtigungen
                </CardTitle>
                <CardDescription className="text-xs">
                  Custom Rollen und Berechtigungen verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Erstellen Sie eigene Rollen mit spezifischen Berechtigungen
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  Rollen verwalten
                  <UserCog className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/usage-stats`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <TrendingUp className="size-4 text-primary" />
                  Nutzungsstatistiken
                </CardTitle>
                <CardDescription className="text-xs">
                  Feature-Nutzung und Peak-Zeiten analysieren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Verfolgen Sie, wie Benutzer die Features nutzen
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  Statistiken anzeigen
                  <TrendingUp className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/revenue`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <DollarSign className="size-4 text-primary" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription className="text-xs">
                  Detaillierte Umsatz-Analysen und Metriken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Analysieren Sie Umsatz, Abonnements und Churn-Rate
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  Revenue anzeigen
                  <DollarSign className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full hover">
            <CardHeader className="pb-3">
              <CardTitle className="flex gap-2 items-center text-sm">
                <Settings className="size-4 text-primary" />
                Stripe {tConfig("title")}
              </CardTitle>
              <CardDescription className="text-xs">{tConfig("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ConfigureStripePortalButton />
            </CardContent>
          </Card>
        </div>
    </UnifiedPageLayout>
  );
}
