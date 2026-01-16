import { useTickets } from "../../hooks/useSupport";
import { Ticket, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "../../lib/format";
import { EmptyState } from "../ui/empty-state";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

export function RecentTicketsWidget() {
  const navigate = useNavigate();
  const { data: ticketsResponse, isLoading } = useTickets();

  const tickets = ticketsResponse?.data || [];
  const recentTickets = tickets.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "closed":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recent Tickets</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="mt-0.5">
                <div className="h-4 w-4 bg-muted-foreground/20 rounded" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recent Tickets</h3>
        </div>
        <button
          onClick={() => navigate("/support")}
          className="text-sm text-primary hover:underline"
        >
          View all
        </button>
      </div>
      {recentTickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets"
          description="Support tickets will appear here"
        />
      ) : (
        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-start gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => navigate(`/support`)}
            >
              <div className="mt-0.5">{getStatusIcon(ticket.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {ticket.subject}
                  </span>
                  <Badge
                    className={`text-xs ${getStatusBadgeColor(ticket.status)}`}
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {ticket.user?.email || "Unknown"} •{" "}
                  {formatRelativeTime(ticket.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
