import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPlanStatistics,
  getUsersByPlan,
} from "@/actions/admin-plan-actions";
import { getAdminStats } from "@/actions/admin-stats-actions";
import { getAllUsers } from "@/actions/admin-user-actions";
import { ArrowRight, Shield, Users } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/alignui/actions/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/alignui/data-display/avatar";
import { BadgeRoot as Badge } from "@/components/alignui/data-display/badge";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

// ISR: Revalidate every 60 seconds for fresh admin data
export const revalidate = 60;

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
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
  const tPanel = await getTranslations("Admin.panel");
  const tUsers = await getTranslations("Admin.users");
  const tSupport = await getTranslations("Admin.support");
  const tStats = await getTranslations("Admin.stats");
  const tPlans = await getTranslations("Admin.plans");

  if (!user?.email) {
    redirect("/login");
  }

  // Check for ADMIN role instead of email pattern
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch optimized admin statistics, recent users, plan statistics, and users by plan
  const [statsResult, usersResult, plansResult, usersByPlanResult] =
    await Promise.all([
      getAdminStats(),
      getAllUsers(),
      getPlanStatistics(),
      getUsersByPlan(),
    ]);

  // Default values in case of errors
  const statsData =
    statsResult.success && statsResult.data
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

  // Get recent users (last 5)
  const recentUsers =
    usersResult.success && usersResult.data ? usersResult.data.slice(0, 5) : [];

  // Get active plans with user counts
  const activePlans =
    plansResult.success && plansResult.data
      ? plansResult.data.filter((plan) => plan.user_count > 0)
      : [];

  // Calculate total users in active plans
  const totalUsersInActivePlans = activePlans.reduce(
    (sum, plan) => sum + (plan.user_count || 0),
    0,
  );

  // Get users in active plans for avatars
  const usersInActivePlans =
    usersByPlanResult.success && usersByPlanResult.data
      ? usersByPlanResult.data.filter((user) =>
          activePlans.some((plan) => plan.plan_id === user.plan_id),
        )
      : [];

  // Get user data with avatars for active plan users
  const activePlanUsersWithAvatars =
    usersResult.success && usersResult.data
      ? usersInActivePlans.map((planUser) => {
          const userData = usersResult.data.find(
            (u) => u.id === planUser.user_id,
          );
          return {
            id: planUser.user_id,
            name: planUser.user_name || planUser.user_email || "User",
            email: planUser.user_email,
            avatar_url: userData?.avatar_url || null,
          };
        })
      : [];

  // Maximal 3 KPIs: Admin Users, Open Tickets, Active Plans (with user count and avatars)
  const kpis = [
    {
      title: tUsers("adminUsers"),
      value: statsData.adminUsers,
      href: `/${locale}/admin/users?role=ADMIN`,
    },
    {
      title: tSupport("openTickets"),
      value: statsData.openTickets,
      href: `/${locale}/admin/support?status=open`,
    },
    {
      title: tPlans("overview.activePlans"),
      value: `${activePlans.length} (${totalUsersInActivePlans})`,
      href: `/${locale}/admin/plans`,
      avatars: activePlanUsersWithAvatars.slice(0, 5), // Show max 5 avatars
    },
  ];

  return (
    <UnifiedPageLayout
      title={tPanel("heading")}
      description={tPanel("subheading")}
      icon={<Shield className="h-4 w-4 text-primary" />}
      contentClassName=""
    >
      {/* 1. Primary Metric - Single Focus */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-2">
          {tStats("userStats")}
        </p>
        <p className="text-4xl font-semibold tracking-tight">
          {statsData.totalUsers.toLocaleString()}
        </p>
      </div>

      {/* 2. Maximum 3 KPIs - Minimal, Grouped */}
      <div className="flex gap-8 mb-10 pb-8 border-b border-border">
        {kpis.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="group">
            <p className="text-xs text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
              {kpi.title}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{kpi.value}</p>
              {kpi.avatars && kpi.avatars.length > 0 && (
                <div className="flex -space-x-2">
                  {kpi.avatars.map((user) => (
                    <Avatar
                      key={user.id}
                      className="size-5 border-2 border-background"
                      title={user.name}
                    >
                      {user.avatar_url ? (
                        <AvatarImage
                          src={user.avatar_url}
                          alt={user.name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="text-[10px] bg-muted">
                          {user.name[0]?.toUpperCase() ||
                            user.email[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {activePlanUsersWithAvatars.length > 5 && (
                    <div className="flex items-center justify-center size-5 rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                      +{activePlanUsersWithAvatars.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 3. Data Table - Visual Focus */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{tUsers("heading")}</h2>
          <Link href={`/${locale}/admin/users`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs -mr-2">
              {tPanel("viewAll")}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {tUsers("noUsers")}
            </p>
            <Link href={`/${locale}/admin/users`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                {tUsers("manageUsers")}
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="py-3">
                    <Link
                      href={`/${locale}/admin/users`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {user.name || user.email || "N/A"}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {user.email || "N/A"}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {user.role === "ADMIN"
                        ? tUsers("table.admin")
                        : tUsers("table.user")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Badge
                      variant={
                        user.status === "banned" ? "destructive" : "default"
                      }
                      className="text-xs font-normal"
                    >
                      {user.status === "banned"
                        ? tUsers("table.banned")
                        : tUsers("table.active")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </UnifiedPageLayout>
  );
}
