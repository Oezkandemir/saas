import { useState, useMemo } from "react";
import {
  usePageViews,
  usePageViewStats,
  usePageViewBreakdown,
} from "../hooks/usePageViews";
import {
  Search,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  BarChart3,
  MapPin,
  TrendingUp,
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export default function PageViewsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [browserFilter, setBrowserFilter] = useState<string>("all");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all"); // all, today, yesterday, 7d, 30d, 90d, 1y

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { startDate, endDate } = useMemo(() => {
    if (dateRange === "all") {
      return { startDate: undefined, endDate: undefined };
    }
    return getDateRange(dateRange);
  }, [dateRange]);

  const { data: pageViewsResponse, isLoading } = usePageViews({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    country: countryFilter !== "all" ? countryFilter : undefined,
    browser: browserFilter !== "all" ? browserFilter : undefined,
    os: osFilter !== "all" ? osFilter : undefined,
    deviceType: deviceFilter !== "all" ? deviceFilter : undefined,
    startDate,
    endDate,
  });

  const { data: statsResponse } = usePageViewStats(startDate, endDate);
  const { data: breakdownResponse } = usePageViewBreakdown(startDate, endDate);

  const pageViews = pageViewsResponse?.data?.data || [];
  const stats = statsResponse?.data;
  const breakdown = breakdownResponse?.data;

  const handleExport = () => {
    const exportData = pageViews.map((pv) => ({
      ID: pv.id,
      Path: pv.page_path || pv.slug || "N/A",
      Title: pv.page_title || "N/A",
      User: pv.user?.email || "Anonymous",
      Country: pv.country || "N/A",
      City: pv.city || "N/A",
      Browser: pv.browser || "N/A",
      OS: pv.os || "N/A",
      Device: pv.is_mobile ? "Mobile" : pv.is_tablet ? "Tablet" : pv.is_desktop ? "Desktop" : pv.device_type || "N/A",
      Duration: pv.duration_seconds ? `${pv.duration_seconds}s` : "N/A",
      "Created At": formatDate(pv.created_at),
    }));
    exportToCSV(exportData, "page-views");
  };

  if (isLoading && !pageViewsResponse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Page Views Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed page view analytics and insights
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
          <h1 className="text-3xl font-bold">Page Views Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed page view analytics and insights
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
            title="Total Views"
            value={stats.total.toLocaleString()}
            icon={TrendingUp}
          />
          <StatCard
            title="Unique Users"
            value={stats.uniqueUsers.toLocaleString()}
            icon={Globe}
          />
          <StatCard
            title="Unique Sessions"
            value={stats.uniqueSessions.toLocaleString()}
            icon={BarChart3}
          />
          <StatCard
            title="Avg Duration"
            value={`${Math.round(stats.averageDuration)}s`}
            icon={Monitor}
          />
        </div>
      )}

      {/* Charts */}
      {breakdown && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Browser Distribution */}
          {breakdown.byBrowser.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Browser Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdown.byBrowser.slice(0, 5)}
                    dataKey="count"
                    nameKey="browser"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {breakdown.byBrowser.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Device Distribution */}
          {breakdown.byDevice.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown.byDevice}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="device" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Countries */}
          {breakdown.byCountry.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown.byCountry.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Popular Pages */}
          {breakdown.popularPages.length > 0 && (
            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Popular Pages</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown.popularPages.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="path" angle={-45} textAnchor="end" height={100} />
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
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search page paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Zeitraum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Zeit</SelectItem>
            <SelectItem value="today">Heute</SelectItem>
            <SelectItem value="yesterday">Gestern</SelectItem>
            <SelectItem value="7d">Letzte 7 Tage</SelectItem>
            <SelectItem value="30d">Letzter Monat</SelectItem>
            <SelectItem value="90d">Letzte 3 Monate</SelectItem>
            <SelectItem value="1y">Letztes Jahr</SelectItem>
          </SelectContent>
        </Select>
        {breakdown && breakdown.byCountry.length > 0 && (
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {breakdown.byCountry.slice(0, 20).map((item) => (
                <SelectItem key={item.country} value={item.country}>
                  {item.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {breakdown && breakdown.byBrowser.length > 0 && (
          <Select value={browserFilter} onValueChange={setBrowserFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Browsers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Browsers</SelectItem>
              {breakdown.byBrowser.map((item) => (
                <SelectItem key={item.browser} value={item.browser}>
                  {item.browser}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Devices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {pageViews.length === 0 && !isLoading ? (
        <EmptyState
          icon={Globe}
          title="No page views found"
          description={
            pageViewsResponse?.data?.total === 0
              ? "No page views have been tracked yet. Page views will appear here once users start visiting pages on your site."
              : "There are no page views matching your current filters. Try adjusting your filters or date range."
          }
        />
      ) : pageViews.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Path</th>
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium">Location</th>
                  <th className="p-4 text-left text-sm font-medium">Browser/OS</th>
                  <th className="p-4 text-left text-sm font-medium">Device</th>
                  <th className="p-4 text-left text-sm font-medium">Duration</th>
                  <th className="p-4 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {pageViews.map((pv) => (
                  <tr
                    key={pv.id}
                    className="border-t border-border hover:bg-muted/50"
                  >
                    <td className="p-4">
                      <div className="font-medium">{pv.page_path || pv.slug || "N/A"}</div>
                      {pv.page_title && (
                        <div className="text-sm text-muted-foreground">{pv.page_title}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {pv.user ? (
                        <div>
                          <div className="font-medium">{pv.user.email}</div>
                          {pv.user.name && (
                            <div className="text-sm text-muted-foreground">{pv.user.name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </td>
                    <td className="p-4">
                      {pv.country && (
                        <div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {pv.country}
                          </div>
                          {pv.city && (
                            <div className="text-sm text-muted-foreground">{pv.city}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        {pv.browser && <div>{pv.browser}</div>}
                        {pv.os && (
                          <div className="text-sm text-muted-foreground">{pv.os}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {pv.is_mobile ? (
                        <Badge variant="secondary">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Mobile
                        </Badge>
                      ) : pv.is_tablet ? (
                        <Badge variant="secondary">
                          <Tablet className="h-3 w-3 mr-1" />
                          Tablet
                        </Badge>
                      ) : pv.is_desktop ? (
                        <Badge variant="secondary">
                          <Monitor className="h-3 w-3 mr-1" />
                          Desktop
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {pv.duration_seconds ? `${Math.round(pv.duration_seconds)}s` : "N/A"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatRelativeTime(pv.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      {pageViewsResponse?.data && pageViewsResponse.data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pageViewsResponse.data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999); // End of today
  
  let start = new Date(now);
  
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0); // Start of today
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
