import { useState } from "react";
import {
  useFeatureUsage,
  useFeatureUsageStats,
} from "../hooks/useFeatureUsage";
import {
  Search,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  Download,
  BarChart3,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { StatCard } from "../components/ui/stat-card";
import { Pagination } from "../components/ui/pagination";
import { useDebounce } from "../hooks/use-debounce";
import { exportToCSV } from "../lib/export";
import { formatDate, formatRelativeTime } from "../lib/format";
import { Input } from "../components/ui/input";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FEATURE_NAMES = [
  "document_created",
  "document_updated",
  "document_deleted",
  "document_viewed",
  "qr_code_created",
  "qr_code_updated",
  "qr_code_deleted",
  "qr_code_scanned",
  "customer_created",
  "customer_updated",
  "customer_deleted",
  "invoice_sent",
  "quote_sent",
  "payment_received",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
];

export default function FeatureUsagePage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const startDate = dateRange !== "all" ? getDateRangeStart(dateRange) : undefined;
  const endDate = dateRange !== "all" ? new Date().toISOString() : undefined;

  const { data: featureUsageResponse, isLoading } = useFeatureUsage({
    page,
    pageSize,
    featureName: featureFilter !== "all" ? featureFilter : undefined,
    startDate,
    endDate,
  });

  const { data: statsResponse } = useFeatureUsageStats(startDate, endDate);

  const featureUsage = featureUsageResponse?.data?.data || [];
  const stats = statsResponse?.data;

  const handleExport = () => {
    const exportData = featureUsage.map((fu) => ({
      ID: fu.id,
      User: fu.user?.email || fu.user_id,
      Feature: fu.feature_name,
      Metadata: fu.metadata ? JSON.stringify(fu.metadata) : "",
      "Created At": formatDate(fu.created_at),
    }));
    exportToCSV(exportData, "feature-usage");
  };

  if (isLoading && !featureUsageResponse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Feature Usage Statistics</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze feature usage across the platform
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Usage Statistics</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze feature usage across the platform
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Usage"
            value={stats.total.toLocaleString()}
            icon={Zap}
          />
          <StatCard
            title="Features Tracked"
            value={stats.byFeature.length}
            icon={BarChart3}
          />
          <StatCard
            title="Recent (7 days)"
            value={stats.recent.toLocaleString()}
            icon={TrendingUp}
          />
          <StatCard
            title="Top Users"
            value={stats.topUsers.length}
            icon={Users}
          />
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Feature Usage Chart */}
          {stats.byFeature.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Feature Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byFeature.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Usage Over Time */}
          {stats.byDate.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Usage Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.byDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Users */}
          {stats.topUsers.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Top Users</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="email" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={featureFilter} onValueChange={setFeatureFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Features" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Features</SelectItem>
            {FEATURE_NAMES.map((feature) => (
              <SelectItem key={feature} value={feature}>
                {feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {featureUsage.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No feature usage found"
          description="There is no feature usage data matching your filters."
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium">Feature</th>
                  <th className="p-4 text-left text-sm font-medium">Metadata</th>
                  <th className="p-4 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {featureUsage.map((fu) => (
                  <tr
                    key={fu.id}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <td className="p-4">
                      {fu.user ? (
                        <div>
                          <div className="font-medium">{fu.user.email}</div>
                          {fu.user.name && (
                            <div className="text-sm text-muted-foreground">{fu.user.name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{fu.user_id}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {fu.feature_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {fu.metadata && Object.keys(fu.metadata).length > 0 ? (
                        <div className="text-sm font-mono max-w-md truncate">
                          {JSON.stringify(fu.metadata)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatRelativeTime(fu.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {featureUsageResponse?.data && featureUsageResponse.data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={featureUsageResponse.data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function getDateRangeStart(range: string): string {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo.toISOString();
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    default:
      return new Date(0).toISOString();
  }
}
