import { MoreHorizontal, Edit, Trash2, Eye, Download, Copy } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface Action {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: Action[];
  align?: "left" | "right";
  trigger?: React.ReactNode;
}

export function ActionMenu({
  actions,
  align = "right",
  trigger,
}: ActionMenuProps) {
  const defaultActions = actions.filter((a) => !a.variant || a.variant === "default");
  const destructiveActions = actions.filter((a) => a.variant === "destructive");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {defaultActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
        {destructiveActions.length > 0 && defaultActions.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {destructiveActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-destructive focus:text-destructive"
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
