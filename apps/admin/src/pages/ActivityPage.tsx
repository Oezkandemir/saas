import { useState, useMemo, useEffect } from "react";
import { useActivityFeed, useAuditLogs } from "../hooks/useActivity";
import { Activity, Download, Search, User, Clock, RefreshCw, Radio } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { formatDateTime, formatRelativeTime } from "../lib/format";
import { cn } from "../lib/utils";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { RefreshButton } from "../components/ui/refresh-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function ActivityPage() {
  const { data: feedResponse, isLoading, isRefetching, refetch } = useActivityFeed(500, true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all");

  const activities = feedResponse?.data || [];

  // Update last update time when data changes
  useEffect(() => {
    if (feedResponse?.data && !isLoading) {
      setLastUpdateTime(new Date());
    }
  }, [feedResponse?.data, isLoading]);

  const handleRefresh = async () => {
    await refetch();
    setLastUpdateTime(new Date());
  };

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.action === actionFilter || a.activity_type === actionFilter
      );
    }

    // Filter by resource type
    if (resourceFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.resource_type === resourceFilter
      );
    }

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(
        (a) => new Date(a.created_at) >= cutoff
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.action?.toLowerCase().includes(query) ||
          a.activity_type?.toLowerCase().includes(query) ||
          a.resource_type?.toLowerCase().includes(query) ||
          a.user?.email?.toLowerCase().includes(query) ||
          a.user?.name?.toLowerCase().includes(query) ||
          JSON.stringify(a.details || {}).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activities, actionFilter, resourceFilter, dateRange, searchQuery]);

  const uniqueActions = useMemo(
    () => 
      Array.from(
        new Set(
          activities
            .map((a) => a.action || a.activity_type)
            .filter(Boolean)
        )
      ).sort(),
    [activities]
  );
  
  const uniqueResources = useMemo(
    () =>
      Array.from(
        new Set(activities.map((a) => a.resource_type).filter(Boolean))
      ).sort(),
    [activities]
  );

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("CREATE")) {
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    }
    if (action.includes("UPDATE") || action.includes("UPDATE")) {
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    }
    if (action.includes("DELETE") || action.includes("DELETE")) {
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    }
    if (action.includes("LOGIN") || action.includes("LOGOUT")) {
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    }
    return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
  };

  const handleExport = () => {
    const csv = [
      ["Date", "User", "Action", "Resource Type", "Resource ID", "Details"],
      ...filteredActivities.map((a) => [
        new Date(a.created_at).toLocaleString(),
        a.user?.email || "System",
        a.action,
        a.resource_type,
        a.resource_id || "",
        JSON.stringify(a.details || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">Monitor system activity and audit trails</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-sm text-muted-foreground">Loading activity logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Activity Logs</h1>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Real-time system activity and audit trails
            {lastUpdateTime && (
              <span className="ml-2 text-xs">
                • Last updated {formatRelativeTime(lastUpdateTime.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton 
            onClick={handleRefresh} 
            isLoading={isRefetching}
          />
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Filtered Results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredActivities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Matching current filters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different action types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resource Types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueResources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different resources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {uniqueResources.map((resource) => (
              <SelectItem key={resource} value={resource}>
                {resource}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-border rounded-lg bg-card">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No activity logs found</p>
            <p className="text-sm mt-2">
              {activities.length === 0
                ? "Activity logs will appear here once actions are performed."
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={activity.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {activity.user?.name?.[0]?.toUpperCase() ||
                      activity.user?.email?.[0]?.toUpperCase() ||
                      "S"}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge
                          className={cn(
                            "border",
                            getActionColor(activity.action || activity.activity_type || "")
                          )}
                        >
                          {activity.action || activity.activity_type || "Unknown"}
                        </Badge>
                        {activity.resource_type && (
                          <Badge variant="secondary">
                            {activity.resource_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {activity.user?.name || activity.user?.email || "System"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(activity.created_at)}</span>
                        </div>
                        <span className="text-xs">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activity.resource_id && (
                    <div className="text-sm mt-2">
                      <span className="text-muted-foreground">Resource: </span>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {activity.resource_id}
                      </span>
                    </div>
                  )}

                  {activity.ip_address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      IP: {activity.ip_address}
                    </div>
                  )}

                  {activity.details &&
                    Object.keys(activity.details).length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
