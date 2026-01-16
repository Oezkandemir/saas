import { RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function RefreshButton({
  onClick,
  isLoading = false,
  className,
  variant = "outline",
  size = "sm",
}: RefreshButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isLoading}
      className={cn(className)}
    >
      <RefreshCw
        className={cn("h-4 w-4", isLoading && "animate-spin")}
      />
      {size !== "icon" && <span className="ml-2">Refresh</span>}
    </Button>
  );
}
