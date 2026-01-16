import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { StatCard } from "../ui/stat-card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Skeleton } from "../ui/skeleton";

interface SystemHealthWidgetProps {
  stats?: {
    totalUsers?: number;
    activeSubscriptions?: number;
    supportTickets?: number;
    adminUsers?: number;
  };
  isLoading?: boolean;
}

export function SystemHealthWidget({ stats, isLoading }: SystemHealthWidgetProps) {
  const getHealthStatus = () => {
    if (!stats) return { status: "unknown", color: "text-gray-500" };
    
    // Simple health check logic
    const hasUsers = (stats.totalUsers || 0) > 0;
    const hasSubscriptions = (stats.activeSubscriptions || 0) > 0;
    
    if (hasUsers && hasSubscriptions) {
      return { status: "healthy", color: "text-green-500" };
    } else if (hasUsers) {
      return { status: "warning", color: "text-yellow-500" };
    } else {
      return { status: "error", color: "text-red-500" };
    }
  };

  const health = getHealthStatus();

  const getHealthIcon = () => {
    switch (health.status) {
      case "healthy":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "error":
        return XCircle;
      default:
        return Activity;
    }
  };

  const HealthIcon = getHealthIcon();

  if (isLoading) {
    return (
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        <div className="flex items-center gap-4">
          <LoadingSpinner size="lg" className="h-8 w-8" />
          <div className="flex-1">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">System Health</h3>
      </div>
      <div className="flex items-center gap-4">
        <HealthIcon className={`h-8 w-8 ${health.color}`} />
        <div>
          <div className="text-2xl font-bold capitalize">{health.status}</div>
          <div className="text-sm text-muted-foreground">
            {stats?.totalUsers || 0} users • {stats?.activeSubscriptions || 0}{" "}
            subscriptions
          </div>
        </div>
      </div>
    </div>
  );
}
