import { AlertCircle, X, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { useState } from "react";

interface NotificationBannerProps {
  type?: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationBanner({
  type = "info",
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const typeStyles = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    success: "bg-green-500/10 border-green-500/20 text-green-500",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
    error: "bg-red-500/10 border-red-500/20 text-red-500",
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "border-l-4 p-4 rounded-r-lg flex items-start gap-3",
        typeStyles[type]
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{title}</h4>
        {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="mt-2"
          >
            {action.label}
          </Button>
        )}
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
