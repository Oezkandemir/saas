import { LucideIcon } from "lucide-react";
import { StatCard } from "../ui/stat-card";
import { useNavigate } from "react-router-dom";

interface QuickStat {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
}

interface QuickStatsWidgetProps {
  stats: QuickStat[];
}

export function QuickStatsWidget({ stats }: QuickStatsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          onClick={stat.href ? () => navigate(stat.href) : undefined}
          className={stat.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        />
      ))}
    </div>
  );
}
