import { cn } from "../../lib/utils";

interface StatusIndicatorProps {
  status: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  pending: "bg-yellow-500",
  error: "bg-red-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
  scheduled: "bg-blue-500",
  canceled: "bg-red-500",
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  open: "bg-blue-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function StatusIndicator({
  status,
  className,
  size = "md",
}: StatusIndicatorProps) {
  const colorClass =
    statusColors[status.toLowerCase()] || statusColors.inactive;

  return (
    <span
      className={cn(
        "inline-block rounded-full",
        colorClass,
        sizeClasses[size],
        className
      )}
      title={status}
    />
  );
}
