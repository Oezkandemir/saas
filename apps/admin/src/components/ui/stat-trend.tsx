import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface StatTrendProps {
  value: number;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function StatTrend({
  value,
  label,
  className,
  showIcon = true,
}: StatTrendProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const Icon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm",
        isPositive && "text-green-500",
        isNegative && "text-red-500",
        isNeutral && "text-muted-foreground",
        className
      )}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      <span>
        {isPositive && "+"}
        {value.toFixed(1)}%
      </span>
      {label && <span className="text-muted-foreground ml-1">{label}</span>}
    </div>
  );
}
