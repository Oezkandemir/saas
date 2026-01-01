import { redirect } from "next/navigation";
import { getRevenueAnalytics } from "@/actions/revenue-analytics-actions";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata() {
  const t = await getTranslations("Admin.revenue");

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

export default async function AdminRevenuePage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.revenue");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch revenue analytics for the last 12 months
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

  const result = await getRevenueAnalytics(startDate, endDate);

  if (!result.success) {
    return (
      <UnifiedPageLayout
        title={t("title")}
        description={t("description")}
        icon={<DollarSign className="h-4 w-4 text-primary" />}
      >
        <Card>
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold">
              Fehler beim Laden der Revenue-Daten
            </h2>
            <p className="mt-2 text-muted-foreground">
              {result.error || "Bitte versuchen Sie es später erneut"}
            </p>
          </CardContent>
        </Card>
      </UnifiedPageLayout>
    );
  }

  const data = result.data!;
  const { revenueByPeriod, revenueByPlan, metrics } = data;

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<DollarSign className="h-4 w-4 text-primary" />}
      contentClassName="space-y-4"
    >
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalMRR")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.total_mrr.toLocaleString(locale, {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Monatliches wiederkehrendes Einkommen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("subscriptionMetrics")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_subscribers}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Abonnenten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("churnRate")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.churn_rate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Kündigungsrate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgRevenuePerUser")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avg_revenue_per_user.toLocaleString(locale, {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnitt pro Benutzer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="period" className="space-y-4">
        <TabsList>
          <TabsTrigger value="period">{t("revenueByPeriod")}</TabsTrigger>
          <TabsTrigger value="plan">{t("revenueByPlan")}</TabsTrigger>
        </TabsList>

        {/* Revenue by Period Tab */}
        <TabsContent value="period" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByPeriod")}</CardTitle>
              <CardDescription>
                Umsatz nach Zeitraum in den letzten 12 Monaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByPeriod.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitraum</TableHead>
                      <TableHead className="text-right">Umsatz</TableHead>
                      <TableHead className="text-right">Abonnenten</TableHead>
                      <TableHead className="text-right">Ø pro Abonnent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByPeriod.map((period, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {new Date(period.period_start).toLocaleDateString(locale)} -{" "}
                          {new Date(period.period_end).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {period.total_revenue.toLocaleString(locale, {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {period.subscriber_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {period.avg_revenue_per_subscriber.toLocaleString(locale, {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Umsatzdaten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue by Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByPlan")}</CardTitle>
              <CardDescription>
                Umsatz nach Abonnement-Plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByPlan.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Abonnenten</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                      <TableHead className="text-right">Gesamt Umsatz</TableHead>
                      <TableHead className="text-right">Ø pro Abonnent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByPlan
                      .sort((a, b) => b.mrr - a.mrr)
                      .map((plan, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{plan.plan || "Kein Plan"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {plan.subscriber_count}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {plan.mrr.toLocaleString(locale, {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {plan.total_revenue.toLocaleString(locale, {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {plan.avg_revenue_per_subscriber.toLocaleString(locale, {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Plan-Umsatzdaten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gesamt Abonnenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_subscribers}</div>
            <p className="text-xs text-muted-foreground">
              Alle Zeit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aktive Abonnenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_subscribers}</div>
            <p className="text-xs text-muted-foreground">
              Aktuell aktiv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gekündigte Abonnenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cancelled_subscribers}</div>
            <p className="text-xs text-muted-foreground">
              Kündigungen
            </p>
          </CardContent>
        </Card>
      </div>
    </UnifiedPageLayout>
  );
}

