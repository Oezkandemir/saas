import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  spinnerSize?: "sm" | "md" | "lg" | "xl";
}

export function LoadingOverlay({
  isLoading,
  text,
  className,
  spinnerSize = "lg",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm rounded-lg",
        "transition-opacity duration-300 animate-in fade-in",
        className
      )}
    >
      <LoadingSpinner size={spinnerSize} text={text} />
    </div>
  );
}




















