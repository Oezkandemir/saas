import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { icon: typeof AlertCircle; className: string }
> = {
  info: {
    icon: Info,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  success: {
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export function AlertBanner({
  variant = "info",
  title,
  message,
  onDismiss,
  className,
  action,
}: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        config.className,
        className
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
