import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive table wrapper that provides horizontal scrolling on mobile
 * and proper spacing for all screen sizes
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className={cn("min-w-full divide-y divide-border", className)}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

interface ResponsiveTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  return (
    <thead className={cn("bg-muted/50", className)}>
      {children}
    </thead>
  );
}

interface ResponsiveTableHeaderCellProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}

export function ResponsiveTableHeaderCell({ 
  children, 
  className,
  minWidth = "auto"
}: ResponsiveTableHeaderCellProps) {
  return (
    <th 
      className={cn(
        "px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap",
        className
      )}
      style={{ minWidth }}
    >
      {children}
    </th>
  );
}

interface ResponsiveTableCellProps {
  children: ReactNode;
  className?: string;
  noWrap?: boolean;
}

export function ResponsiveTableCell({ 
  children, 
  className,
  noWrap = true
}: ResponsiveTableCellProps) {
  return (
    <td 
      className={cn(
        "px-4 sm:px-6 py-4",
        noWrap && "whitespace-nowrap",
        className
      )}
    >
      {children}
    </td>
  );
}
