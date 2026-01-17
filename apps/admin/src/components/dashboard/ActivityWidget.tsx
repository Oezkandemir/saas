import { useActivityFeed } from "../../hooks/useActivity";
import { Activity, Clock } from "lucide-react";
import { formatRelativeTime } from "../../lib/format";
import { EmptyState } from "../ui/empty-state";
import { LoadingSpinner } from "../ui/loading-spinner";

export function ActivityWidget() {
  const { data: activityResponse, isLoading } = useActivityFeed(10);

  const activities = activityResponse?.data || [];

  if (isLoading) {
    return (
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Activity will appear here as users interact with the system"
        />
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-muted rounded-lg"
            >
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{activity.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.resource_type}
                  </span>
                </div>
                {activity.user && (
                  <div className="text-xs text-muted-foreground mb-1">
                    {activity.user.email}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(activity.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
