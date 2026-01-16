import { useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, defaultMessage?: string) => {
    let message = defaultMessage || "An error occurred";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error
    ) {
      message = String(error.message);
    }

    toast.error(message);
    console.error("Error:", error);
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  return { handleError, handleSuccess };
}
