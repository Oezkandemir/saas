import { Badge } from "./badge";
import { cn } from "../../lib/utils";

interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function CountBadge({
  count,
  max,
  className,
  variant = "default",
}: CountBadgeProps) {
  const displayCount = max && count > max ? `${max}+` : count;

  return (
    <Badge
      variant={variant}
      className={cn(
        "ml-2",
        count === 0 && "opacity-50",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}
