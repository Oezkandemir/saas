import { Search, X, Filter } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "../../lib/utils";

interface FilterOption {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface TableFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

export function TableFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onFilterChange,
  onClearFilters,
  className,
  rightContent,
}: TableFiltersProps) {
  const hasActiveFilters =
    searchQuery || filters.some((f) => f.options.find((o) => o.value !== "all"));

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          onValueChange={(value) => onFilterChange?.(filter.key, value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasActiveFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}

      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </div>
  );
}
