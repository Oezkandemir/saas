import { Badge } from "./badge";
import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  variant?: "default" | "outline";
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  error: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  success: {
    label: "Success",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  warning: {
    label: "Warning",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  info: {
    label: "Info",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  canceled: {
    label: "Canceled",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  draft: {
    label: "Draft",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  paid: {
    label: "Paid",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  open: {
    label: "Open",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

export function StatusBadge({
  status,
  className,
  variant = "default",
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(
        variant === "default" && config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
