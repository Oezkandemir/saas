import { useState, useMemo } from "react";
import { Checkbox } from "./checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>;
  getRowId: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (selectedIds: string[]) => void;
    variant?: "default" | "destructive";
  }>;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  selectable = false,
  onSelectionChange,
  bulkActions = [],
  emptyMessage = "No data available",
  loading = false,
  className,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(getRowId));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleBulkAction = (action: (selectedIds: string[]) => void) => {
    action(Array.from(selectedIds));
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {selectable && selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => handleBulkAction(action.onClick)}
                >
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const id = getRowId(item);
                const isSelected = selectedIds.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        className="w-12"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectRow(id, checked as boolean)
                          }
                          aria-label={`Select row ${id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
