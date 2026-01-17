import { Badge } from "./badge";
import { cn } from "../../lib/utils";

interface BadgeVariantProps {
  variant:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "secondary"
    | "outline";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-primary text-primary-foreground",
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border",
};

export function BadgeVariant({
  variant,
  children,
  className,
}: BadgeVariantProps) {
  return (
    <Badge className={cn(variantStyles[variant], className)}>{children}</Badge>
  );
}
