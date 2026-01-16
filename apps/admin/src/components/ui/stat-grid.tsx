import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function StatGrid({
  children,
  columns = 4,
  className,
}: StatGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1",
        gridCols[columns],
        className
      )}
    >
      {children}
    </div>
  );
}
