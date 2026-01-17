import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ResponsiveListProps {
  children: ReactNode;
  className?: string;
  mobileView: ReactNode;
  desktopView: ReactNode;
}

/**
 * Responsive list component that shows cards on mobile and table on desktop
 * No horizontal scrolling - adapts to all screen sizes
 */
export function ResponsiveList({
  mobileView,
  desktopView,
  className,
}: ResponsiveListProps) {
  return (
    <>
      {/* Mobile Card View */}
      <div className={cn("md:hidden space-y-4", className)}>
        {mobileView}
      </div>

      {/* Desktop Table View */}
      <div className={cn("hidden md:block bg-card border border-border rounded-lg overflow-hidden", className)}>
        {desktopView}
      </div>
    </>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ResponsiveCard({ children, className, onClick }: ResponsiveCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 space-y-3",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function ResponsiveCardRow({ label, value, className }: ResponsiveCardRowProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

interface ResponsiveCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ResponsiveCardGrid({
  children,
  columns = 2,
  className,
}: ResponsiveCardGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {children}
    </div>
  );
}
