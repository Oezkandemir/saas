import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  currentSort?: {
    key: string;
    direction: SortDirection;
  };
  sortKey: string;
  onSort: (key: string, direction: SortDirection) => void;
  className?: string;
}

export function SortableHeader({
  label,
  currentSort,
  sortKey,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort?.direction : null;

  const handleClick = () => {
    if (!isActive) {
      onSort(sortKey, "asc");
    } else if (direction === "asc") {
      onSort(sortKey, "desc");
    } else {
      onSort(sortKey, null);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "h-8 -ml-3 hover:bg-transparent",
        isActive && "text-foreground",
        className
      )}
    >
      {label}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
