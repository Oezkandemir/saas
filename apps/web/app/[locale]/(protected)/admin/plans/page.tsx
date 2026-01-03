import { redirect } from "next/navigation";
import { getTranslations, getLocale, setRequestLocale } from "next-intl/server";
import { CreditCard } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import {
  getAllPlans,
  getPlanStatistics,
  getPlanMigrations,
  getUsersByPlan,
} from "@/actions/admin-plan-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/alignui/data-display/card';
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { PlanStatisticsTable } from "@/components/admin/plans/plan-statistics-table";
import { PlanMigrationsTable } from "@/components/admin/plans/plan-migrations-table";
import { PlanUsersTable } from "@/components/admin/plans/plan-users-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
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
      {/* Primary Metric */}
      <div className="border-b pb-6">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold tracking-tight">
            €{totalMRR.toLocaleString(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-sm text-muted-foreground">Monatliches wiederkehrendes Einkommen</div>
        </div>
      </div>

      {/* Secondary KPIs - Max 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Jährliches wiederkehrendes Einkommen</div>
          <div className="text-2xl font-semibold">
            €{totalARR.toLocaleString(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Aktive Abonnenten</div>
          <div className="text-2xl font-semibold">{totalUsers}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Aktive Pläne</div>
          <div className="text-2xl font-semibold">
            {plans.filter((p) => p.is_active).length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="statistics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="statistics">Umsatz & Statistiken</TabsTrigger>
          <TabsTrigger value="users">User nach Plan</TabsTrigger>
          <TabsTrigger value="migrations">Plan-Migrationen</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("planStatistics")}</CardTitle>
              <CardDescription>
                Umsatz und Statistiken nach Plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanStatisticsTable statistics={statistics} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User nach Plan</CardTitle>
              <CardDescription>
                Übersicht aller User mit aktiven Subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanUsersTable users={planUsers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migrations Tab */}
        <TabsContent value="migrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentMigrations")}</CardTitle>
              <CardDescription>
                {t("recentMigrationsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanMigrationsTable migrations={migrations} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </UnifiedPageLayout>
  );
}



