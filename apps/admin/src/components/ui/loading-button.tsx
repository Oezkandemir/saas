import { Button, ButtonProps } from "./button";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "../../lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading && (
        <>
          <LoadingSpinner className="mr-2 h-4 w-4" />
          {loadingText || children}
        </>
      )}
      {!loading && children}
    </Button>
  );
}
