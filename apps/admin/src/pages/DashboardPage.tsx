import { useAdminStats } from "../hooks/useAdminStats";
import { useAnalytics } from "../hooks/useAnalytics";
import { Users, CreditCard, Ticket, Shield, TrendingUp, TrendingDown, FileText, QrCode, Calendar, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { ActivityWidget } from "../components/dashboard/ActivityWidget";
import { RecentTicketsWidget } from "../components/dashboard/RecentTicketsWidget";
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
} from "recharts";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: statsResponse, isLoading: statsLoading } = useAdminStats();
  const { data: analyticsResponse, isLoading: analyticsLoading } = useAnalytics();
  const stats = statsResponse?.data;
  const analytics = analyticsResponse?.data;

  const isLoading = statsLoading || analyticsLoading;

  // Prepare chart data
  const userGrowthData = analytics?.userGrowth.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    users: item.count,
  })) || [];

  const ticketStatusData = analytics
    ? [
        {
          name: "Open",
          value: analytics.ticketStats.openTickets,
        },
        {
          name: "In Progress",
          value: analytics.ticketStats.inProgressTickets,
        },
        {
          name: "Resolved",
          value: analytics.ticketStats.resolvedTickets,
        },
      ]
    : [];

  const userGrowthChange =
    analytics?.userStats.newUsersThisMonth &&
    analytics?.userStats.newUsersLastMonth
      ? ((analytics.userStats.newUsersThisMonth -
          analytics.userStats.newUsersLastMonth) /
          analytics.userStats.newUsersLastMonth) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your application statistics
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-6 bg-card border border-border rounded-lg animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Users
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics?.userStats.totalUsers ?? stats?.totalUsers ?? 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            {analytics?.userStats.newUsersThisMonth !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {userGrowthChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-xs ${
                    userGrowthChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {userGrowthChange >= 0 ? "+" : ""}
                  {userGrowthChange.toFixed(1)}% from last month
                </span>
              </div>
            )}
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Active Subscriptions
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics?.subscriptionStats.activeSubscriptions ??
                    stats?.subscribedUsers ??
                    0}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            {analytics?.subscriptionStats.totalSubscriptions !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.subscriptionStats.totalSubscriptions} total
              </p>
            )}
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Support Tickets
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics?.ticketStats.totalTickets ?? stats?.totalTickets ?? 0}
                </p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            {analytics?.ticketStats.openTickets !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.ticketStats.openTickets} open,{" "}
                {analytics.ticketStats.inProgressTickets} in progress
              </p>
            )}
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Admin Users
                </h3>
                <p className="text-2xl font-bold mt-2">
                  {analytics?.userStats.adminUsers ?? stats?.adminUsers ?? 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {analytics?.pageViews && (
            <>
              <div className="p-6 bg-card border border-border rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Page Views Today
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {analytics.pageViews.today}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.pageViews.thisWeek} this week
                </p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    New Users This Month
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {analytics.userStats.newUsersThisMonth}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.userStats.newUsersLastMonth} last month
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!isLoading && (
        <div className="p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/users")}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/customers")}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>View Customers</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/documents")}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>View Documents</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/support")}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Ticket className="h-6 w-6" />
              <span>Support Tickets</span>
            </Button>
          </div>
        </div>
      )}

      {/* Feature Usage */}
      {!isLoading && analytics?.featureUsage && (
        <div className="p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Customers</div>
              <div className="text-2xl font-bold mt-1">
                {analytics.featureUsage.customers}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Documents</div>
              <div className="text-2xl font-bold mt-1">
                {analytics.featureUsage.documents}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">QR Codes</div>
              <div className="text-2xl font-bold mt-1">
                {analytics.featureUsage.qrCodes}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Bookings</div>
              <div className="text-2xl font-bold mt-1">
                {analytics.featureUsage.bookings}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth Chart */}
          {userGrowthData.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ticket Status Chart */}
          {ticketStatusData.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Ticket Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Widgets */}
      <div className="grid gap-6 md:grid-cols-2">
        <ActivityWidget />
        <RecentTicketsWidget />
      </div>
    </div>
  );
}
