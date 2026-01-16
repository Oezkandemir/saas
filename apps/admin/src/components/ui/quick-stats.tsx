import { LucideIcon } from "lucide-react";
import { StatCard } from "./stat-card";
import { cn } from "../../lib/utils";

interface QuickStat {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  description?: string;
  onClick?: () => void;
}

interface QuickStatsProps {
  stats: QuickStat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickStats({
  stats,
  columns = 4,
  className,
}: QuickStatsProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          description={stat.description}
          onClick={stat.onClick}
        />
      ))}
    </div>
  );
}
