import Link from "next/link";
import { redirect } from "next/navigation";
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
  Mail,
  FileText,
  Layers,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { getAdminStats } from "@/actions/admin-stats-actions";
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

// ISR: Revalidate every 60 seconds for fresh admin data
export const revalidate = 60;

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
  const tSystem = await getTranslations("Admin.system");
  const tWebhooks = await getTranslations("Admin.webhooks");
  const tRoles = await getTranslations("Admin.roles");
  const tUsageStats = await getTranslations("Admin.usageStats");
  const tRevenue = await getTranslations("Admin.revenue");
  const tEmails = await getTranslations("Admin.emails");
  const tPlans = await getTranslations("Admin.plans");
  const tAudit = await getTranslations("Admin.audit");
  const tBulk = await getTranslations("Admin.bulk");

  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role instead of email pattern
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch optimized admin statistics using SQL function
  const statsResult = await getAdminStats();

  // Default values in case of errors
  const statsData = statsResult.success && statsResult.data
    ? statsResult.data
    : {
        totalUsers: 0,
        adminUsers: 0,
        subscribedUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
      };

  const stats = [
    {
      title: tStats("userStats"),
      value: statsData.totalUsers,
      icon: Users,
      description: tUsers("allRegistered"),
    },
    {
      title: tUsers("adminUsers"),
      value: statsData.adminUsers,
      icon: ShieldCheck,
      description: tUsers("withAdminPrivileges"),
    },
    {
      title: tUsers("subscribers"),
      value: statsData.subscribedUsers,
      icon: CreditCard,
      description: tUsers("activePaid"),
    },
    {
      title: tSupport("openTickets"),
      value: statsData.openTickets,
      icon: AlertTriangle,
      description: tSupport("awaitingResponse"),
    },
    {
      title: tSupport("statuses.inProgress"),
      value: statsData.inProgressTickets,
      icon: Clock,
      description: tSupport("inProgressDescription"),
    },
    {
      title: tSupport("statuses.resolved"),
      value: statsData.resolvedTickets,
      icon: CheckCircle,
      description: tSupport("successfullyClosed"),
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
                  {tSystem("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tSystem("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tSystem("monitoringDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tSystem("viewSystem")}
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
                  {tWebhooks("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tWebhooks("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tWebhooks("manageDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tWebhooks("manageWebhooks")}
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
                  {tRoles("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tRoles("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tRoles("manageDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tRoles("manageRoles")}
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
                  {tUsageStats("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tUsageStats("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tUsageStats("manageDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tUsageStats("viewStats")}
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
                  {tRevenue("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tRevenue("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tRevenue("analyzeDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tRevenue("viewRevenue")}
                  <DollarSign className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/emails`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <Mail className="size-4 text-primary" />
                  {tEmails("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tEmails("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tEmails("manageDescription")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tEmails("manageTemplates")}
                  <Mail className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/plans`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <CreditCard className="size-4 text-primary" />
                  {t("plans.title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("plans.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("plans.subheading")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {t("plans.title")}
                  <CreditCard className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/audit`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <FileText className="size-4 text-primary" />
                  {tAudit("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tAudit("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tAudit("subheading")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tAudit("title")}
                  <FileText className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/admin/bulk`} className="group">
            <Card className="h-full hover interactive">
              <CardHeader className="pb-3">
                <CardTitle className="flex gap-2 items-center text-sm">
                  <Layers className="size-4 text-primary" />
                  {tBulk("title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tBulk("description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  {tBulk("subheading")}
                </p>
                <Button size="sm" className="gap-2 w-full h-8 text-xs sm:w-auto">
                  {tBulk("title")}
                  <Layers className="size-3.5" />
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
