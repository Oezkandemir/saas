import { redirect } from "next/navigation";
import {
  getAnalyticsData,
  getDetailedAnalytics,
} from "@/actions/analytics-actions";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  MousePointer,
  ShieldCheck,
  TicketCheck,
  Users,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Badge } from '@/components/alignui/data-display/badge';
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
    stripe_current_period_end: string | null;
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

  // Format user growth data for charts
  const userGrowthLabels = Object.keys(data.userGrowthByMonth).sort();
  const userGrowthData = userGrowthLabels.map(
    (month) => data.userGrowthByMonth[month],
  );

  // Format ticket status data for charts
  const ticketLabels = ["Open", "In Progress", "Resolved", "Closed"];
  const ticketData = [
    data.ticketStats.open || 0,
    data.ticketStats.in_progress || 0,
    data.ticketStats.resolved || 0,
    data.ticketStats.closed || 0,
  ];

  // Prepare device type data for pie chart
  let deviceData = [];
  let deviceLabels = [];
  if (detailedData?.device_stats) {
    deviceData = detailedData.device_stats.map((item: any) => item.count);
    deviceLabels = detailedData.device_stats.map(
      (item: any) => item.device_type,
    );
  }

  // Prepare browser stats data for pie chart
  let browserData = [];
  let browserLabels = [];
  if (detailedData?.browser_stats) {
    browserData = detailedData.browser_stats.map((item: any) => item.count);
    browserLabels = detailedData.browser_stats.map((item: any) => item.browser);
  }

  // Prepare page view stats data for line chart
  let pageViewLabels: string[] = [];
  let pageViewData: number[] = [];
  if (detailedData?.page_view_stats) {
    const sortedPageViews = [...detailedData.page_view_stats].sort(
      (a: any, b: any) => a.day.localeCompare(b.day),
    );
    pageViewLabels = sortedPageViews.map((item: any) => item.day);
    pageViewData = sortedPageViews.map((item: any) => item.view_count);
  }

  // Format user engagements data
  let userEngagementLabels = [];
  let userEngagementData = [];
  if (detailedData?.user_engagement) {
    userEngagementLabels = detailedData.user_engagement.map(
      (item: any) => item.interaction_type,
    );
    userEngagementData = detailedData.user_engagement.map(
      (item: any) => item.count,
    );
  }

  return (
    <UnifiedPageLayout
      title="Analytics Dashboard"
      description="Track key metrics and app performance"
      icon={<TrendingUp className="h-4 w-4 text-primary" />}
      contentClassName="space-y-4"
    >
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Echtzeit</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="page-analytics">Page Analytics</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Echtzeit-Analytics</CardTitle>
                <CardDescription>
                  Live-Daten über aktive User, Page Views, Standorte und Geräte
                </CardDescription>
              </CardHeader>
            </Card>
            <RealtimeAnalytics />
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Admin Users
                </CardTitle>
                <ShieldCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.adminCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users with admin privileges
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Banned Users
                </CardTitle>
                <Ban className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.bannedCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently suspended accounts
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscribers
                </CardTitle>
                <CreditCard className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.subscribersCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active paid subscriptions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user signups by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    {userGrowthLabels.length > 0
                      ? `Total new users: ${userGrowthData.reduce((a, b) => a + b, 0)}`
                      : "No user growth data available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Support Ticket Status</CardTitle>
                <CardDescription>
                  Current status of support tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Ticket Statistics:</p>
                    <div className="space-y-1">
                      {ticketLabels.map((label, index) => (
                        <p key={index} className="text-sm">
                          {label}: {ticketData[index]}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="user-behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users (30d)
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detailedData?.user_stats?.active_users_last_30_days || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users active in the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Page Views (30d)
                </CardTitle>
                <Eye className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detailedData?.user_stats?.page_views_last_30_days || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total page views in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Session Time
                </CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detailedData?.avg_session_duration
                    ? Math.floor(detailedData.avg_session_duration / 60)
                    : 0}{" "}
                  min
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average time spent per session
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bounce Rate
                </CardTitle>
                <ExternalLink className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {detailedData?.bounce_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Single page visit percentage
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Types of user interactions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    {userEngagementLabels.length > 0
                      ? `Total engagements: ${userEngagementData.reduce((a, b) => a + b, 0)}`
                      : "No user engagement data available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>User Flow</CardTitle>
                <CardDescription>Common navigation paths</CardDescription>
              </CardHeader>
              <CardContent>
                {detailedData?.user_flow &&
                detailedData.user_flow.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From Page</TableHead>
                        <TableHead>To Page</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedData.user_flow
                        .slice(0, 8)
                        .map((flow: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {flow.from_page.length > 20
                                ? flow.from_page.substring(0, 20) + "..."
                                : flow.from_page}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {flow.to_page.length > 20
                                ? flow.to_page.substring(0, 20) + "..."
                                : flow.to_page}
                            </TableCell>
                            <TableCell>{flow.transition_count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No user flow data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Page Analytics Tab */}
        <TabsContent value="page-analytics" className="space-y-4">
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Daily Page Views</CardTitle>
              <CardDescription>
                Page views over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">
                  {pageViewLabels.length > 0
                    ? `Total page views: ${pageViewData.reduce((a, b) => a + b, 0)}`
                    : "No page view data available"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Most Viewed Pages</CardTitle>
                <CardDescription>Top pages by view count</CardDescription>
              </CardHeader>
              <CardContent>
                {detailedData?.popular_pages &&
                detailedData.popular_pages.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Unique Visitors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedData.popular_pages
                        .slice(0, 8)
                        .map((page: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {page.page_path.length > 30
                                ? page.page_path.substring(0, 30) + "..."
                                : page.page_path}
                            </TableCell>
                            <TableCell>{page.view_count}</TableCell>
                            <TableCell>{page.unique_visitors}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No popular pages data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>User Interactions</CardTitle>
                <CardDescription>Top user interactions by type</CardDescription>
              </CardHeader>
              <CardContent>
                {detailedData?.user_engagement &&
                detailedData.user_engagement.length > 0 ? (
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
                            <TableCell>
                              <div className="flex items-center">
                                <MousePointer className="mr-2 size-4" />
                                {interaction.interaction_type}
                              </div>
                            </TableCell>
                            <TableCell>{interaction.count}</TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No user interaction data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>User device distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Device Statistics:</p>
                    <div className="space-y-1">
                      {deviceLabels.length > 0 ? (
                        deviceLabels.map((label, index) => (
                          <p key={index} className="text-sm">
                            {label}: {deviceData[index]}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No device data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
                <CardDescription>User browser distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Browser Statistics:</p>
                    <div className="space-y-1">
                      {browserLabels.length > 0 ? (
                        browserLabels.map((label, index) => (
                          <p key={index} className="text-sm">
                            {label}: {browserData[index]}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No browser data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle>Recent Logins</CardTitle>
            <CardDescription>Last 10 user login activities</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentLogins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLogins.map((login, index) => (
                    <TableRow key={index}>
                      <TableCell>{login.email}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(login.timestamp), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No recent login activity
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
            <CardDescription>Last 5 user subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSubscriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Renewal Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentSubscriptions.map((sub, index) => (
                    <TableRow key={index}>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>
                        {sub.stripe_current_period_end
                          ? formatDistanceToNow(
                              new Date(sub.stripe_current_period_end),
                              { addSuffix: true },
                            )
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No recent subscription activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedPageLayout>
  );
}
