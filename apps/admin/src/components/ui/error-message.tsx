import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorMessage({
  title = "Error",
  message,
  onRetry,
  className,
  variant = "default",
}: ErrorMessageProps) {
  const variantStyles = {
    default: "bg-muted border-border",
    destructive: "bg-red-500/10 border-red-500/20 text-red-500",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border flex items-start gap-3",
        variantStyles[variant],
        className
      )}
    >
      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
