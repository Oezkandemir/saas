import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CreditCard, TrendingUp, Users, Settings } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import {
  getAllPlans,
  getPlanStatistics,
  getPlanMigrations,
  getUsersByPlan,
} from "@/actions/admin-plan-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { Button } from '@/components/alignui/actions/button';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { PlanStatisticsTable } from "@/components/admin/plans/plan-statistics-table";
import { PlansOverview } from "@/components/admin/plans/plans-overview";
import { PlanMigrationsTable } from "@/components/admin/plans/plan-migrations-table";
import { PlanUsersTable } from "@/components/admin/plans/plan-users-table";

export async function generateMetadata() {
  const t = await getTranslations("Admin.plans");

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

export default async function AdminPlansPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.plans");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch data
  const [plansResult, statsResult, migrationsResult, usersResult] = await Promise.all([
    getAllPlans(),
    getPlanStatistics(),
    getPlanMigrations(50),
    getUsersByPlan(),
  ]);

  const plans = plansResult.success ? plansResult.data || [] : [];
  const statistics = statsResult.success ? statsResult.data || [] : [];
  const migrations = migrationsResult.success ? migrationsResult.data || [] : [];
  const planUsers = usersResult.success ? usersResult.data || [] : [];

  // Calculate totals
  const totalMRR = statistics.reduce((sum, stat) => sum + Number(stat.mrr || 0), 0);
  const totalARR = statistics.reduce((sum, stat) => sum + Number(stat.arr || 0), 0);
  const totalUsers = statistics.reduce((sum, stat) => sum + Number(stat.user_count || 0), 0);

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("subheading")}
      icon={<CreditCard className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover>
          <CardHeader className="flex flex-row justify-between items-center pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.totalMRR")}
            </CardTitle>
            <div className="flex justify-center items-center rounded-md border size-9 bg-muted/50 border-border">
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1 text-2xl font-semibold">
              €{totalMRR.toFixed(2)}
            </div>
            <CardDescription className="text-xs">
              {t("stats.monthlyRecurring")}
            </CardDescription>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row justify-between items-center pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.totalARR")}
            </CardTitle>
            <div className="flex justify-center items-center rounded-md border size-9 bg-muted/50 border-border">
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1 text-2xl font-semibold">
              €{totalARR.toFixed(2)}
            </div>
            <CardDescription className="text-xs">
              {t("stats.annualRecurring")}
            </CardDescription>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row justify-between items-center pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.totalUsers")}
            </CardTitle>
            <div className="flex justify-center items-center rounded-md border size-9 bg-muted/50 border-border">
              <Users className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1 text-2xl font-semibold">{totalUsers}</div>
            <CardDescription className="text-xs">
              {t("stats.activeSubscribers")}
            </CardDescription>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader className="flex flex-row justify-between items-center pb-3 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.activePlans")}
            </CardTitle>
            <div className="flex justify-center items-center rounded-md border size-9 bg-muted/50 border-border">
              <CreditCard className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-1 text-2xl font-semibold">
              {plans.filter((p) => p.is_active).length}
            </div>
            <CardDescription className="text-xs">
              {t("stats.availablePlans")}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Plans Overview */}
      <PlansOverview plans={plans} locale={locale} />

      {/* Plan Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <TrendingUp className="size-4 text-primary" />
            {t("planStatistics")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("planStatisticsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanStatisticsTable statistics={statistics} />
        </CardContent>
      </Card>

      {/* Users by Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <Users className="size-4 text-primary" />
            User nach Plan
          </CardTitle>
          <CardDescription className="text-xs">
            Übersicht aller User mit aktiven Subscriptions, gruppiert nach Plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanUsersTable users={planUsers} />
        </CardContent>
      </Card>

      {/* Recent Plan Migrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <Users className="size-4 text-primary" />
            {t("recentMigrations")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("recentMigrationsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanMigrationsTable migrations={migrations} />
        </CardContent>
      </Card>
    </UnifiedPageLayout>
  );
}



