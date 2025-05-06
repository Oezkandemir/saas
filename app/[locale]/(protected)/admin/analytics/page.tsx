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
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { DashboardHeader } from "@/components/dashboard/header";

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
      <>
        <DashboardHeader
          heading="Analytics Dashboard"
          text="Track key metrics and app performance"
        />
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">
            Error loading analytics data
          </h2>
          <p className="mt-2 text-muted-foreground">
            {result.error || "Please try again later"}
          </p>
        </div>
      </>
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
    <>
      <DashboardHeader
        heading="Analytics Dashboard"
        text="Track key metrics and app performance"
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="page-analytics">Page Analytics</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Admin Users
                </CardTitle>
                <ShieldCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.adminCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Users with admin privileges
                </p>
              </CardContent>
            </Card>

            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Currently suspended accounts
                </p>
              </CardContent>
            </Card>

            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Active paid subscriptions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user signups by month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {userGrowthLabels.length > 0 ? (
                  <BarChart
                    data={{
                      labels: userGrowthLabels.map((month) => {
                        const [year, monthNum] = month.split("-");
                        return `${monthNum}/${year.slice(2)}`;
                      }),
                      datasets: [
                        {
                          label: "New Users",
                          data: userGrowthData,
                          backgroundColor: "rgba(59, 130, 246, 0.5)",
                          borderColor: "rgb(59, 130, 246)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      No user growth data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Support Ticket Status</CardTitle>
                <CardDescription>
                  Current status of support tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <BarChart
                  data={{
                    labels: ticketLabels,
                    datasets: [
                      {
                        label: "Tickets",
                        data: ticketData,
                        backgroundColor: [
                          "rgba(239, 68, 68, 0.5)",
                          "rgba(245, 158, 11, 0.5)",
                          "rgba(16, 185, 129, 0.5)",
                          "rgba(107, 114, 128, 0.5)",
                        ],
                        borderColor: [
                          "rgb(239, 68, 68)",
                          "rgb(245, 158, 11)",
                          "rgb(16, 185, 129)",
                          "rgb(107, 114, 128)",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="user-behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Users active in the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Total page views in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Average time spent per session
                </p>
              </CardContent>
            </Card>

            <Card>
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
                <p className="text-xs text-muted-foreground">
                  Single page visit percentage
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Types of user interactions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {userEngagementLabels.length > 0 ? (
                  <BarChart
                    data={{
                      labels: userEngagementLabels,
                      datasets: [
                        {
                          label: "Count",
                          data: userEngagementData,
                          backgroundColor: "rgba(99, 102, 241, 0.5)",
                          borderColor: "rgb(99, 102, 241)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      No user engagement data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Daily Page Views</CardTitle>
                <CardDescription>
                  Page views over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {pageViewLabels.length > 0 ? (
                  <LineChart
                    data={{
                      labels: pageViewLabels,
                      datasets: [
                        {
                          label: "Page Views",
                          data: pageViewData,
                          borderColor: "rgb(99, 102, 241)",
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          borderWidth: 1,
                          tension: 0.2,
                          fill: true,
                        },
                      ],
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      No page view data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
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

            <Card className="col-span-1">
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
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>User device distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {deviceLabels.length > 0 ? (
                  <PieChart
                    data={{
                      labels: deviceLabels,
                      datasets: [
                        {
                          label: "Devices",
                          data: deviceData,
                          backgroundColor: [
                            "rgba(54, 162, 235, 0.5)",
                            "rgba(255, 99, 132, 0.5)",
                            "rgba(255, 206, 86, 0.5)",
                            "rgba(75, 192, 192, 0.5)",
                          ],
                          borderColor: [
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 99, 132, 1)",
                            "rgba(255, 206, 86, 1)",
                            "rgba(75, 192, 192, 1)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      No device data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
                <CardDescription>User browser distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {browserLabels.length > 0 ? (
                  <PieChart
                    data={{
                      labels: browserLabels,
                      datasets: [
                        {
                          label: "Browsers",
                          data: browserData,
                          backgroundColor: [
                            "rgba(255, 99, 132, 0.5)",
                            "rgba(54, 162, 235, 0.5)",
                            "rgba(255, 206, 86, 0.5)",
                            "rgba(75, 192, 192, 0.5)",
                            "rgba(153, 102, 255, 0.5)",
                          ],
                          borderColor: [
                            "rgba(255, 99, 132, 1)",
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 206, 86, 1)",
                            "rgba(75, 192, 192, 1)",
                            "rgba(153, 102, 255, 1)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      No browser data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
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

        <Card className="col-span-1">
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
    </>
  );
}
