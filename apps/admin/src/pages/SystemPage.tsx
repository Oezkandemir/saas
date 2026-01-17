import { useSystemStatus, useRecentErrors, useResolveError, useSendTestNotification } from "../hooks/useSystem";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Check, 
  Bell, 
  Server, 
  Database, 
  Shield, 
  Zap,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { RefreshButton } from "../components/ui/refresh-button";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";

export default function SystemPage() {
  const queryClient = useQueryClient();
  const { data: statusResponse, isLoading: statusLoading, refetch: refetchStatus, isRefetching: isRefetchingStatus } = useSystemStatus();
  const { data: errorsResponse, isLoading: errorsLoading, refetch: refetchErrors, isRefetching: isRefetchingErrors } = useRecentErrors();
  const resolveError = useResolveError();
  const sendTestNotification = useSendTestNotification();

  const status = statusResponse?.data;
  const errors = errorsResponse?.data || [];

  const handleRefresh = async () => {
    // Invalidate queries - this will automatically trigger refetch for active queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["system-status"] }),
      queryClient.invalidateQueries({ queryKey: ["system-errors"] })
    ]);
  };

  const isRefreshing = isRefetchingStatus || isRefetchingErrors;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "down":
        return "text-red-500";
      case "maintenance":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500/10 border-green-500/20";
      case "degraded":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "down":
        return "bg-red-500/10 border-red-500/20";
      case "maintenance":
        return "bg-blue-500/10 border-blue-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-8 w-8"
    };
    const iconSize = sizeClasses[size];

    switch (status) {
      case "operational":
        return <CheckCircle className={cn(iconSize, "text-green-500")} />;
      case "degraded":
        return <AlertTriangle className={cn(iconSize, "text-yellow-500")} />;
      case "down":
        return <XCircle className={cn(iconSize, "text-red-500")} />;
      case "maintenance":
        return <Clock className={cn(iconSize, "text-blue-500")} />;
      default:
        return <Activity className={cn(iconSize, "text-gray-500")} />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case "database":
        return <Database className="h-5 w-5 text-muted-foreground" />;
      case "authentication":
      case "auth":
        return <Shield className="h-5 w-5 text-muted-foreground" />;
      case "api":
        return <Zap className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Server className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Calculate error statistics
  const errorStats = {
    total: errors.length,
    unresolved: errors.filter(e => !e.resolved).length,
    critical: errors.filter(e => e.errorType === "critical" && !e.resolved).length,
    warnings: errors.filter(e => e.errorType === "warning" && !e.resolved).length,
    byComponent: errors.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Calculate component statistics
  const componentStats = {
    operational: status?.components.filter(c => c.status === "operational").length || 0,
    degraded: status?.components.filter(c => c.status === "degraded").length || 0,
    down: status?.components.filter(c => c.status === "down").length || 0,
    total: status?.components.length || 0
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (statusLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Status</h1>
            <p className="text-muted-foreground mt-2">Real-time system monitoring and health</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground mt-2">
            Real-time system monitoring and health dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton 
            onClick={handleRefresh} 
            isLoading={isRefreshing}
          />
          <Button
            onClick={() => sendTestNotification.mutate()}
            disabled={sendTestNotification.isPending}
            variant="outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        </div>
      </div>

      {/* Overall Status Hero */}
      {status && (
        <Card className={cn("border-2", getStatusBgColor(status.overallStatus))}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(status.overallStatus, "lg")}
                <div>
                  <CardTitle className="text-2xl">System Status</CardTitle>
                  <CardDescription className="mt-1">
                    Last checked {formatTimeAgo(status.components[0]?.lastCheck || new Date().toISOString())}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-lg px-4 py-2",
                  getStatusColor(status.overallStatus),
                  getStatusBgColor(status.overallStatus)
                )}
              >
                {status.overallStatus.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Components Status"
          value={`${componentStats.operational}/${componentStats.total}`}
          icon={Server}
          description={`${componentStats.degraded} degraded, ${componentStats.down} down`}
        />
        <StatCard
          title="Total Errors"
          value={errorStats.total}
          icon={AlertCircle}
          description={`${errorStats.unresolved} unresolved`}
        />
        <StatCard
          title="Critical Issues"
          value={errorStats.critical}
          icon={XCircle}
          description={`${errorStats.warnings} warnings`}
          className={errorStats.critical > 0 ? "border-red-500/50" : ""}
        />
        <StatCard
          title="System Health"
          value={status?.overallStatus === "operational" ? "100%" : status?.overallStatus === "degraded" ? "75%" : "0%"}
          icon={Activity}
          description={status?.overallStatus || "Unknown"}
        />
      </div>

      {/* Component Status Grid */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Component Status</CardTitle>
            <CardDescription>Detailed status of all system components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {status.components.map((component) => (
                <div
                  key={component.component}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    component.status === "operational" 
                      ? "bg-green-500/5 border-green-500/20" 
                      : component.status === "degraded"
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getComponentIcon(component.component)}
                      <div>
                        <h3 className="font-semibold">{component.component}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(component.lastCheck)}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(component.status, "sm")}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline"
                      className={cn(
                        component.status === "operational"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : component.status === "degraded"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {component.status}
                    </Badge>
                    {component.message && (
                      <p className="text-xs text-muted-foreground text-right max-w-[200px] truncate">
                        {component.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                {errorStats.unresolved > 0 
                  ? `${errorStats.unresolved} unresolved errors require attention`
                  : "No active errors"}
              </CardDescription>
            </div>
            {errorStats.total > 0 && (
              <Badge variant="outline">
                {errorStats.total} total
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          ) : errors.length > 0 ? (
            <div className="space-y-3">
              {errors.slice(0, 10).map((error) => (
                <div
                  key={error.id}
                  className={cn(
                    "p-4 rounded-lg border-l-4 transition-all",
                    error.resolved
                      ? "bg-muted/50 border-gray-500/50 opacity-60"
                      : error.errorType === "critical"
                      ? "bg-red-500/5 border-red-500"
                      : "bg-yellow-500/5 border-yellow-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline"
                          className={cn(
                            error.errorType === "critical"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          )}
                        >
                          {error.errorType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.component}
                        </Badge>
                        {error.resolved && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">{error.errorMessage}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(error.createdAt)}</span>
                        {error.resolved && error.resolvedAt && (
                          <>
                            <span>•</span>
                            <span>Resolved {formatTimeAgo(error.resolvedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {!error.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveError.mutate(error.id)}
                        disabled={resolveError.isPending}
                        className="shrink-0"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {errors.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {errors.length} errors
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-1">All Systems Operational</h3>
              <p className="text-sm text-muted-foreground">
                No errors detected in the system
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
