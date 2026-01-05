import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/actions/analytics-actions";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { RealtimeAnalytics } from "@/components/analytics/realtime-analytics";

export const metadata = constructMetadata({
  title: "Analytics – Cenety",
  description: "Analytics dashboard for your application.",
});

interface AnalyticsData {
  totalUsers: number;
  adminCount: number;
  bannedCount: number;
  subscribersCount: number;
  userGrowthByMonth: Record<string, number>;
  ticketStats: Record<string, number>;
  recentLogins: {
    type: string;
    userId: string;
    email: string;
    timestamp: string;
  }[];
  recentSubscriptions: {
    id: string;
    email: string;
    polar_current_period_end: string | null;
  }[];
  detailedAnalytics: any;
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("Admin.stats");
  const result = await getAnalyticsData();

  if (!result.success) {
    return (
      <UnifiedPageLayout
        title="Analytics Dashboard"
        description="Track key metrics and app performance"
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
      >
        <Card>
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold">
              Error loading analytics data
            </h2>
            <p className="mt-2 text-muted-foreground">
              {result.error || "Please try again later"}
            </p>
          </CardContent>
        </Card>
      </UnifiedPageLayout>
    );
  }

  const data = result.data as AnalyticsData;
  const detailedData = data.detailedAnalytics;

  // Calculate active users from recent logins (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsers30d = data.recentLogins.filter(
    (login) => new Date(login.timestamp) >= thirtyDaysAgo
  ).length;

  return (
    <UnifiedPageLayout
      title="Analytics Dashboard"
      description="Track key metrics and app performance"
      icon={<TrendingUp className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Primary Metric */}
      <div className="border-b pb-6">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold tracking-tight">
            {data.totalUsers || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
      </div>

      {/* Secondary KPIs - Max 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Active Users (30d)</div>
          <div className="text-2xl font-semibold">{activeUsers30d}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Admin Users</div>
          <div className="text-2xl font-semibold">{data.adminCount || 0}</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Echtzeit</TabsTrigger>
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="page-analytics">Page Analytics</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Data Table - Visual Focus */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User logins and subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLogins.slice(0, 10).map((login, index) => (
                    <TableRow key={`login-${index}`}>
                      <TableCell className="font-medium">{login.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Login</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(login.timestamp), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.recentSubscriptions.slice(0, 5).map((sub, index) => (
                    <TableRow key={`sub-${index}`}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Subscription</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.polar_current_period_end
                          ? formatDistanceToNow(
                              new Date(sub.polar_current_period_end),
                              { addSuffix: true },
                            )
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.recentLogins.length === 0 && data.recentSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No recent activity
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <RealtimeAnalytics />
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="user-behavior" className="space-y-6">
          {detailedData?.user_engagement && detailedData.user_engagement.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Types of user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Interaction Type</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedData.user_engagement.map(
                      (interaction: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{interaction.interaction_type}</TableCell>
                          <TableCell>{interaction.count}</TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {detailedData?.user_flow && detailedData.user_flow.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Flow</CardTitle>
                <CardDescription>Common navigation paths</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedData.user_flow.slice(0, 10).map((flow: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {flow.from_page.length > 30
                            ? flow.from_page.substring(0, 30) + "..."
                            : flow.from_page}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {flow.to_page.length > 30
                            ? flow.to_page.substring(0, 30) + "..."
                            : flow.to_page}
                        </TableCell>
                        <TableCell>{flow.transition_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Page Analytics Tab */}
        <TabsContent value="page-analytics" className="space-y-6">
          {detailedData?.popular_pages && detailedData.popular_pages.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Most Viewed Pages</CardTitle>
                  <CardDescription>
                    Top {Math.min(detailedData.popular_pages.length, 20)} pages by view count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page Path</TableHead>
                        <TableHead className="text-right">Total Views</TableHead>
                        <TableHead className="text-right">Unique Visitors</TableHead>
                        <TableHead className="text-right">Avg Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedData.popular_pages
                        .filter((page: any) => {
                          const path = page.page_path || page.slug || "";
                          return path && String(path).trim() !== "";
                        })
                        .slice(0, 20)
                        .map((page: any, index: number) => {
                          const pagePath = String(page.page_path || page.slug || "").trim();
                          const avgDuration = page.avg_duration
                            ? `${Math.round(Number(page.avg_duration))}s`
                            : "N/A";
                          return (
                            <TableRow key={`page-${index}-${pagePath}`}>
                              <TableCell className="font-mono text-xs max-w-[300px] truncate" title={pagePath}>
                                {pagePath}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(page.view_count || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(page.unique_visitors || page.view_count || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {avgDuration}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {detailedData.popular_pages.filter((page: any) => {
                        const path = page.page_path || page.slug || "";
                        return path && String(path).trim() !== "";
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No page view data available. Check console for debugging info.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Page Views</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {detailedData.popular_pages
                        .reduce((sum: number, page: any) => sum + (page.view_count || 0), 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Unique Pages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {detailedData.popular_pages.filter(
                        (page: any) => {
                          const path = page.page_path || page.slug || "";
                          return path && String(path).trim() !== "";
                        },
                      ).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Unique Visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {detailedData.popular_pages.reduce(
                        (sum: number, page: any) => sum + (page.unique_visitors || 0),
                        0,
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Pages</CardTitle>
                <CardDescription>Top pages by view count</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 text-center">
                <p className="text-muted-foreground">
                  No page view data available yet. Page views will appear here once users start browsing your site.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-6">
          {detailedData?.device_stats && detailedData.device_stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>User device distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Type</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedData.device_stats.map((device: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{device.device_type}</TableCell>
                        <TableCell>{device.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {detailedData?.browser_stats && detailedData.browser_stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
                <CardDescription>User browser distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Browser</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedData.browser_stats.map((browser: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{browser.browser}</TableCell>
                        <TableCell>{browser.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </UnifiedPageLayout>
  );
}
