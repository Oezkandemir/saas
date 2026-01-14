import { redirect } from "next/navigation";
import { getRevenueAnalytics } from "@/actions/revenue-analytics-actions";
import { DollarSign } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
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
      contentClassName="space-y-6"
    >
      {/* Primary Metric */}
      <div className="border-b pb-6">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold tracking-tight">
            {metrics.total_mrr.toLocaleString(locale, {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            Monatliches wiederkehrendes Einkommen
          </div>
        </div>
      </div>

      {/* Secondary KPIs - Max 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Aktive Abonnenten
          </div>
          <div className="text-2xl font-semibold">
            {metrics.active_subscribers}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Ø Revenue pro User
          </div>
          <div className="text-2xl font-semibold">
            {metrics.avg_revenue_per_user.toLocaleString(locale, {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Churn Rate</div>
          <div className="text-2xl font-semibold">
            {(metrics.churn_rate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <Tabs defaultValue="period" className="space-y-6">
        <TabsList>
          <TabsTrigger value="period">{t("revenueByPeriod")}</TabsTrigger>
          <TabsTrigger value="plan">{t("revenueByPlan")}</TabsTrigger>
        </TabsList>

        {/* Revenue by Period Tab */}
        <TabsContent value="period" className="space-y-6">
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
                      <TableHead className="text-right">
                        Ø pro Abonnent
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByPeriod.map((period, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {new Date(period.period_start).toLocaleDateString(
                            locale,
                            {
                              month: "short",
                              year: "numeric",
                            },
                          )}
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
                        <TableCell className="text-right text-muted-foreground">
                          {period.avg_revenue_per_subscriber.toLocaleString(
                            locale,
                            {
                              style: "currency",
                              currency: "EUR",
                            },
                          )}
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
        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByPlan")}</CardTitle>
              <CardDescription>Umsatz nach Abonnement-Plan</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByPlan.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Abonnenten</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                      <TableHead className="text-right">
                        Gesamt Umsatz
                      </TableHead>
                      <TableHead className="text-right">
                        Ø pro Abonnent
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByPlan
                      .sort((a, b) => b.mrr - a.mrr)
                      .map((plan, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">
                              {plan.plan || "Kein Plan"}
                            </Badge>
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
                          <TableCell className="text-right text-muted-foreground">
                            {plan.avg_revenue_per_subscriber.toLocaleString(
                              locale,
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
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
    </UnifiedPageLayout>
  );
}
