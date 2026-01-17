import { useState, useMemo } from "react";
import { useRevenue } from "../hooks/useRevenue";
import { useSubscriptions } from "../hooks/useSubscriptions";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { DollarSign, TrendingUp, Users, CreditCard, Download, TrendingDown, Mail, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { formatDateTime } from "../lib/format";
import { cn } from "../lib/utils";

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "trialing" | "canceled" | "past_due">("all");
  
  // Memoize dates to prevent query key changes on every render
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data: revenueResponse, isLoading, error } = useRevenue(startDate, endDate);
  const { data: subscriptionsResponse, isLoading: subscriptionsLoading } = useSubscriptions();
  const revenue = revenueResponse?.data;
  const subscriptions = subscriptionsResponse?.data || [];

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (statusFilter === "all") {
      return subscriptions;
    }
    return subscriptions.filter((sub) => sub.status === statusFilter);
  }, [subscriptions, statusFilter]);

  // Get active subscriptions for the list
  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => sub.status === "active" || sub.status === "trialing");
  }, [subscriptions]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "trialing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "past_due":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "pro":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "free":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground mt-2">Track revenue and payments</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    if (!revenue) return;
    
    const csv = [
      ["Period", "Revenue", "Subscriptions"],
      ...(revenue.revenueByPeriod?.map((item) => [
        item.period_start,
        item.total_revenue?.toFixed(2) || "0.00",
        item.subscription_count?.toString() || "0",
      ]) || []),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const revenueChange = revenue?.revenueByPeriod && revenue.revenueByPeriod.length >= 2
    ? ((revenue.revenueByPeriod[revenue.revenueByPeriod.length - 1].total_revenue || 0) -
        (revenue.revenueByPeriod[revenue.revenueByPeriod.length - 2].total_revenue || 0)) /
      (revenue.revenueByPeriod[revenue.revenueByPeriod.length - 2].total_revenue || 1) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground mt-2">Track revenue and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 bg-background border border-border rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics - Only show if data is loaded */}
      {revenue && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total MRR</h3>
                <p className="text-2xl font-bold mt-2">
                  €{(revenue.metrics.total_mrr ?? 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Active Subscribers</h3>
              <p className="text-2xl font-bold mt-2">
                {revenue?.metrics.active_subscribers ?? 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Churn Rate</h3>
              <p className="text-2xl font-bold mt-2">
                {revenue?.metrics.churn_rate.toFixed(2) ?? "0.00"}%
              </p>
              {revenueChange !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {revenueChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs ${
                      revenueChange >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {revenueChange >= 0 ? "+" : ""}
                    {revenueChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {revenueChange >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Avg Revenue/User</h3>
              <p className="text-2xl font-bold mt-2">
                €{(revenue?.metrics.avg_revenue_per_user ?? 0).toFixed(2)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        </div>
      )}

      {/* Error State */}
      {(error || (revenueResponse && !revenueResponse.success)) && (
        <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-medium">Error loading revenue data</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || revenueResponse?.error || "Failed to load revenue analytics"}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && revenueResponse?.success && (!revenue?.revenueByPeriod || revenue.revenueByPeriod.length === 0) && (
        <div className="p-12 text-center text-muted-foreground">
          <p>No revenue data available for the selected period.</p>
          <p className="text-sm mt-2">
            Revenue data will appear here once subscriptions are created.
          </p>
        </div>
      )}

      {/* Revenue Chart */}
      {revenue?.revenueByPeriod && revenue.revenueByPeriod.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenue.revenueByPeriod}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period_start" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `€${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue (€)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Subscriptions Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenue.revenueByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period_start" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
                <Legend />
                <Bar dataKey="subscription_count" fill="#00C49F" name="Subscriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subscribed Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscribed Users</CardTitle>
              <CardDescription>
                {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading subscriptions...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No subscriptions found</p>
              <p className="text-sm mt-2">
                {statusFilter === "all"
                  ? "No subscriptions have been created yet."
                  : `No subscriptions with status "${statusFilter}" found.`}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Payment Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={subscription.user?.avatar_url || undefined}
                              alt={subscription.user?.name || subscription.user?.email || "User"}
                              className="object-cover"
                            />
                            <AvatarFallback>
                              {subscription.user?.name?.[0]?.toUpperCase() ||
                                subscription.user?.email?.[0]?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {subscription.user?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {subscription.user?.email || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(getPlanBadgeColor(subscription.plan))}
                        >
                          {subscription.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(getStatusBadgeColor(subscription.status))}
                        >
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.calculatedMRR !== undefined && subscription.calculatedMRR > 0 ? (
                          <div>
                            <div className="font-medium">
                              €{subscription.calculatedMRR.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              €{(subscription.calculatedMRR * 12).toFixed(2)}/yr
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {subscription.payment_provider || "stripe"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.current_period_start && subscription.current_period_end ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(subscription.current_period_start).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              until {new Date(subscription.current_period_end).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(subscription.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
