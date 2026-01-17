import { LayoutGrid, List } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

type ViewMode = "grid" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      <Button
        variant={value === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("grid")}
        className="h-8"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={value === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("list")}
        className="h-8"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
