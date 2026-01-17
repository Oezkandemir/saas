import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  description?: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  onClick,
  children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "p-6 bg-card border border-border rounded-lg",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend && typeof trend.value === 'number' && (
          <div
            className={cn(
              "text-xs flex items-center gap-1",
              trend.isPositive !== false
                ? "text-green-500"
                : "text-red-500"
            )}
          >
            <span>{trend.isPositive !== false ? "+" : ""}</span>
            <span>{trend.value.toFixed(1)}%</span>
            {trend.label && <span className="text-muted-foreground">({trend.label})</span>}
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
