import { MoreHorizontal, Edit, Trash2, Eye, Download } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface TableAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface TableActionsProps {
  actions: TableAction[];
  align?: "left" | "right";
}

export function TableActions({ actions, align = "right" }: TableActionsProps) {
  if (actions.length === 0) return null;

  // If only one action, show as button
  if (actions.length === 1) {
    const action = actions[0];
    const Icon = action.icon;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={action.onClick}
        className={action.variant === "destructive" ? "text-destructive" : ""}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {action.label}
      </Button>
    );
  }

  // Multiple actions, show as dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={index}>
              {index > 0 && action.variant === "destructive" && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                onClick={action.onClick}
                className={
                  action.variant === "destructive" ? "text-destructive" : ""
                }
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
