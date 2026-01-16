import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onClear,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
