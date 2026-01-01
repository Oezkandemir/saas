import { redirect } from "next/navigation";
import {
  getUsageStatistics,
  getFeatureUsageTrends,
  getPeakUsageTimes,
} from "@/actions/usage-statistics-actions";
import { TrendingUp, Clock, Activity } from "lucide-react";
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

export async function generateMetadata() {
  const t = await getTranslations("Admin.usageStats");

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

export default async function AdminUsageStatsPage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

  const user = await getCurrentUser();
  const t = await getTranslations("Admin.usageStats");

  if (!user?.email) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch usage statistics for the last 30 days
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [usageStatsResult, trendsResult, peakTimesResult] = await Promise.all([
    getUsageStatistics(startDate, endDate),
    getFeatureUsageTrends(undefined, 30),
    getPeakUsageTimes(30),
  ]);

  const usageStats = usageStatsResult.success ? usageStatsResult.data || [] : [];
  const trends = trendsResult.success ? trendsResult.data || [] : [];
  const peakTimes = peakTimesResult.success ? peakTimesResult.data || [] : [];

  // Group usage stats by feature
  const featureUsageMap = new Map<string, number>();
  usageStats.forEach((stat) => {
    const current = featureUsageMap.get(stat.feature_name) || 0;
    featureUsageMap.set(stat.feature_name, current + stat.usage_count);
  });

  const featureUsage = Array.from(featureUsageMap.entries())
    .map(([feature_name, usage_count]) => ({ feature_name, usage_count }))
    .sort((a, b) => b.usage_count - a.usage_count);

  return (
    <UnifiedPageLayout
      title={t("title")}
      description={t("description")}
      icon={<TrendingUp className="h-4 w-4 text-primary" />}
      contentClassName="space-y-4"
    >
      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">{t("featureUsage")}</TabsTrigger>
          <TabsTrigger value="peaks">{t("peakTimes")}</TabsTrigger>
          <TabsTrigger value="activity">{t("userActivity")}</TabsTrigger>
        </TabsList>

        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("featureUsage")}</CardTitle>
              <CardDescription>
                Übersicht der Feature-Nutzung in den letzten 30 Tagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureUsage.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-right">Nutzungen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureUsage.map((feature, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {feature.feature_name.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-right">
                          {feature.usage_count.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Nutzungsdaten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peak Times Tab */}
        <TabsContent value="peaks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("peakTimes")}</CardTitle>
              <CardDescription>
                Tageszeiten mit der höchsten Nutzung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {peakTimes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead className="text-right">Nutzungen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {peakTimes
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .map((peak, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {peak.hour_of_day}:00 - {peak.hour_of_day + 1}:00
                          </TableCell>
                          <TableCell className="text-right">
                            {peak.usage_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Peak-Zeit-Daten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("userActivity")}</CardTitle>
              <CardDescription>
                Feature-Nutzung nach Datum in den letzten 30 Tagen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-right">Nutzungen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trends
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .slice(0, 50)
                      .map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(trend.date).toLocaleDateString(locale)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {trend.feature_name.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-right">
                            {trend.usage_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Keine Aktivitätsdaten verfügbar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Features</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureUsage.length}</div>
            <p className="text-xs text-muted-foreground">
              Unterschiedliche Features genutzt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Nutzungen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.reduce((sum, stat) => sum + stat.usage_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              In den letzten 30 Tagen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Stunde</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {peakTimes.length > 0
                ? `${peakTimes.sort((a, b) => b.usage_count - a.usage_count)[0]?.hour_of_day || 0}:00`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Höchste Nutzung
            </p>
          </CardContent>
        </Card>
      </div>
    </UnifiedPageLayout>
  );
}

