import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface InfoCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  value?: string | number;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InfoCard({
  title,
  description,
  icon: Icon,
  value,
  children,
  className,
  onClick,
}: InfoCardProps) {
  return (
    <Card
      className={cn(
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      {value !== undefined && (
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      )}
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
