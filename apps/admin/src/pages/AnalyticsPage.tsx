import { useState, useMemo } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { usePageViews, usePageViewStats, usePageViewBreakdown } from "../hooks/usePageViews";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Calendar, 
  FileText, 
  QrCode, 
  CreditCard, 
  Download,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  BarChart3,
  Search,
  List,
  DollarSign,
  Activity
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { RefreshButton } from "../components/ui/refresh-button";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Pagination } from "../components/ui/pagination";
import { formatRelativeTime } from "../lib/format";
import { useDebounce } from "../hooks/use-debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<string>("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [pageViewsPage, setPageViewsPage] = useState(1);
  const [pageViewsSearch, setPageViewsSearch] = useState("");
  
  const { startDate, endDate } = useMemo(() => {
    if (dateRange === "all") {
      return { startDate: undefined, endDate: undefined };
    }
    return getDateRange(dateRange);
  }, [dateRange]);

  const { data: analyticsResponse, isLoading, refetch: refetchAnalytics } = useAnalytics();
  const { data: pageViewStatsResponse, isLoading: pageViewStatsLoading, refetch: refetchPageViewStats } = usePageViewStats(startDate, endDate);
  const { data: pageViewBreakdownResponse, isLoading: pageViewBreakdownLoading, refetch: refetchPageViewBreakdown } = usePageViewBreakdown(startDate, endDate);
  const debouncedPageViewsSearch = useDebounce(pageViewsSearch, 500);
  const { data: pageViewsResponse, isLoading: pageViewsLoading } = usePageViews({
    page: pageViewsPage,
    pageSize: 20,
    search: debouncedPageViewsSearch || undefined,
    startDate,
    endDate,
  });
  
  const analytics = analyticsResponse?.data;
  const pageViewStats = pageViewStatsResponse?.data;
  const pageViewBreakdown = pageViewBreakdownResponse?.data;
  const pageViews = pageViewsResponse?.data?.data || [];

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      queryClient.invalidateQueries({ queryKey: ["page-view-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["page-view-breakdown"] }),
      queryClient.invalidateQueries({ queryKey: ["page-views"] }),
      refetchAnalytics(),
      refetchPageViewStats(),
      refetchPageViewBreakdown()
    ]);
  };

  const isRefreshing = isLoading || pageViewStatsLoading || pageViewBreakdownLoading || pageViewsLoading;

  if (isLoading && !analyticsResponse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive analytics dashboard</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-card border border-border rounded-lg animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const data = {
      userStats: analytics?.userStats,
      subscriptionStats: analytics?.subscriptionStats,
      pageViews: {
        ...analytics?.pageViews,
        stats: pageViewStats,
        breakdown: pageViewBreakdown,
      },
      featureUsage: analytics?.featureUsage,
      dateRange,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <RefreshButton onClick={handleRefresh} isLoading={isRefreshing} />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="page-views">
            <Eye className="h-4 w-4 mr-2" />
            Page Views
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={analytics?.userStats.totalUsers ?? 0}
              icon={Users}
              description={`${analytics?.userStats.newUsersThisMonth ?? 0} new this month`}
            />
            <StatCard
              title="Page Views"
              value={pageViewStats?.total.toLocaleString() ?? analytics?.pageViews.total.toLocaleString() ?? 0}
              icon={Eye}
              description={`${pageViewStats?.uniqueUsers ?? 0} unique users`}
            />
            <StatCard
              title="Active Subscriptions"
              value={analytics?.subscriptionStats.activeSubscriptions ?? 0}
              icon={CreditCard}
              description={`€${(analytics?.subscriptionStats.mrr ?? 0).toLocaleString()} MRR`}
            />
            <StatCard
              title="Avg Session"
              value={pageViewStats?.averageDuration ? `${Math.round(pageViewStats.averageDuration)}s` : "0s"}
              icon={Clock}
              description={`${pageViewStats?.uniqueSessions ?? 0} sessions`}
            />
          </div>

          {/* Feature Usage */}
          {analytics?.featureUsage && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Platform feature statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{analytics.featureUsage.documents}</div>
                    <div className="text-xs text-muted-foreground mt-1">Documents</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{analytics.featureUsage.customers}</div>
                    <div className="text-xs text-muted-foreground mt-1">Customers</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <QrCode className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{analytics.featureUsage.qrCodes}</div>
                    <div className="text-xs text-muted-foreground mt-1">QR Codes</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{analytics.featureUsage.bookings}</div>
                    <div className="text-xs text-muted-foreground mt-1">Bookings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Growth */}
          {analytics?.userGrowth && analytics.userGrowth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.userGrowth.map((item) => ({
                    month: new Date(item.month + "-01").toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    }),
                    users: item.count,
                  }))}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={analytics?.userStats.totalUsers ?? 0}
              icon={Users}
            />
            <StatCard
              title="Admin Users"
              value={analytics?.userStats.adminUsers ?? 0}
              icon={Users}
            />
            <StatCard
              title="Subscribers"
              value={analytics?.userStats.subscribers ?? 0}
              icon={CreditCard}
            />
            <StatCard
              title="New This Month"
              value={analytics?.userStats.newUsersThisMonth ?? 0}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-semibold">{analytics?.userStats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admin Users</span>
                    <Badge variant="outline">{analytics?.userStats.adminUsers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      {analytics?.userStats.subscribers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Banned Users</span>
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      {analytics?.userStats.bannedUsers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">New This Month</span>
                    <span className="font-semibold text-green-500">
                      +{analytics?.userStats.newUsersThisMonth}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analytics?.planUsage && analytics.planUsage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.planUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ plan, users }) => `${plan}: ${users}`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="users"
                      >
                        {analytics.planUsage.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Page Views Tab */}
        <TabsContent value="page-views" className="space-y-6">
          {/* Stats */}
          {pageViewStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Views"
                value={pageViewStats.total.toLocaleString()}
                icon={Eye}
              />
              <StatCard
                title="Unique Users"
                value={pageViewStats.uniqueUsers.toLocaleString()}
                icon={Users}
              />
              <StatCard
                title="Sessions"
                value={pageViewStats.uniqueSessions.toLocaleString()}
                icon={BarChart3}
              />
              <StatCard
                title="Avg Duration"
                value={`${Math.round(pageViewStats.averageDuration)}s`}
                icon={Clock}
              />
            </div>
          )}

          {/* Charts */}
          {pageViewBreakdown && (
            <div className="grid gap-6 md:grid-cols-2">
              {pageViewBreakdown.byBrowser.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Browser</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pageViewBreakdown.byBrowser.slice(0, 5)}
                          dataKey="count"
                          nameKey="browser"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ browser, count }) => `${browser}: ${count}`}
                        >
                          {pageViewBreakdown.byBrowser.slice(0, 5).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {pageViewBreakdown.byDevice.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Device</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={pageViewBreakdown.byDevice}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="device" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {pageViewBreakdown.byCountry.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={pageViewBreakdown.byCountry.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="country" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {pageViewBreakdown.popularPages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={pageViewBreakdown.popularPages.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="path" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Page Views List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Page Views</CardTitle>
                  <CardDescription>
                    {pageViewStats?.total ?? 0} total views
                  </CardDescription>
                </div>
                <div className="w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search paths..."
                      value={pageViewsSearch}
                      onChange={(e) => {
                        setPageViewsSearch(e.target.value);
                        setPageViewsPage(1);
                      }}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pageViewsLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading page views...
                </div>
              ) : pageViews.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No page views found</p>
                  <p className="text-sm mt-1">Try adjusting your search or date range</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 text-left font-medium">Path</th>
                            <th className="p-3 text-left font-medium">User</th>
                            <th className="p-3 text-left font-medium">Location</th>
                            <th className="p-3 text-left font-medium">Device</th>
                            <th className="p-3 text-left font-medium">Duration</th>
                            <th className="p-3 text-left font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageViews.map((pv) => (
                            <tr
                              key={pv.id}
                              className="border-t border-border hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3">
                                <div className="font-medium max-w-[200px] truncate">
                                  {pv.page_path || pv.slug || "N/A"}
                                </div>
                                {pv.page_title && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {pv.page_title}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {pv.user ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-xs">
                                        {pv.user.name?.[0]?.toUpperCase() ||
                                          pv.user.email?.[0]?.toUpperCase() ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate max-w-[120px]">
                                      {pv.user.name || pv.user.email}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Anonymous</span>
                                )}
                              </td>
                              <td className="p-3">
                                {pv.country && (
                                  <div className="text-xs">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {pv.country}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                {pv.is_mobile ? (
                                  <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0.5">
                                    <Smartphone className="h-3 w-3" />
                                    Mobile
                                  </Badge>
                                ) : pv.is_tablet ? (
                                  <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0.5">
                                    <Tablet className="h-3 w-3" />
                                    Tablet
                                  </Badge>
                                ) : pv.is_desktop ? (
                                  <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0.5">
                                    <Monitor className="h-3 w-3" />
                                    Desktop
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                {pv.duration_seconds ? (
                                  <span className="text-xs">{Math.round(pv.duration_seconds)}s</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(pv.created_at)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {pageViewsResponse?.data && pageViewsResponse.data.totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={pageViewsPage}
                        totalPages={pageViewsResponse.data.totalPages}
                        onPageChange={setPageViewsPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Subscriptions"
              value={analytics?.subscriptionStats.activeSubscriptions ?? 0}
              icon={CreditCard}
            />
            <StatCard
              title="Total Subscriptions"
              value={analytics?.subscriptionStats.totalSubscriptions ?? 0}
              icon={CreditCard}
            />
            <StatCard
              title="MRR"
              value={`€${(analytics?.subscriptionStats.mrr ?? 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <StatCard
              title="Cancelled"
              value={analytics?.subscriptionStats.cancelledSubscriptions ?? 0}
              icon={Activity}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      {analytics?.subscriptionStats.totalSubscriptions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      {analytics?.subscriptionStats.activeSubscriptions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cancelled</span>
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      {analytics?.subscriptionStats.cancelledSubscriptions}
                    </Badge>
                  </div>
                  {analytics?.subscriptionStats.mrr > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
                      <span className="font-semibold text-lg">
                        €{analytics.subscriptionStats.mrr.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User & Subscription Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-semibold">{analytics?.userStats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      {analytics?.userStats.subscribers}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Free Users</span>
                    <span className="font-semibold">
                      {(analytics?.userStats.totalUsers ?? 0) - (analytics?.userStats.subscribers ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="font-semibold">
                      {analytics?.userStats.totalUsers 
                        ? `${((analytics.userStats.subscribers / analytics.userStats.totalUsers) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  let start = new Date(now);
  
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "7d":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case "90d":
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    case "1y":
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(0);
      end = new Date();
  }
  
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
