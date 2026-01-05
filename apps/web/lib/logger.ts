/**
 * Production-safe logging utility
 * Logs only in development, errors always logged
 */

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isClient = typeof window !== "undefined";

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const context = this.isClient ? "[Client]" : "[Server]";
    return `${timestamp} ${context} [${level.toUpperCase()}] ${message}`;
  }

  info(message: string, data?: any) {
    if (this.isDevelopment) {
      if (data) {
        console.log(this.formatMessage("info", message), data);
      } else {
        console.log(this.formatMessage("info", message));
      }
    }
  }

  warn(message: string, data?: any) {
    if (data) {
      console.warn(this.formatMessage("warn", message), data);
    } else {
      console.warn(this.formatMessage("warn", message));
    }
  }

  error(message: string, error?: any) {
    if (error) {
      // Check if error is an empty object or has no meaningful properties
      const errorKeys =
        typeof error === "object" && error !== null
          ? Object.keys(error).filter(
              (key) => error[key] !== undefined && error[key] !== null,
            )
          : [];

      if (errorKeys.length === 0 && typeof error === "object") {
        // Empty object - try to serialize it or log a warning
        try {
          const serialized = JSON.stringify(error);
          if (serialized === "{}") {
            // Try to extract more information from the error
            const errorString = this.serializeError(error);
            if (errorString && errorString !== "Error: Unknown") {
              console.error(this.formatMessage("error", message), errorString);
            } else {
              console.error(
                this.formatMessage("error", message),
                "(Empty error object - check console for details)",
              );
              // Try to log error properties that might not be enumerable
              if (error instanceof Error) {
                console.error("Error name:", error.name);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
              }
            }
          } else {
            console.error(this.formatMessage("error", message), error);
          }
        } catch {
          // If serialization fails, try to extract what we can
          const errorString = this.serializeError(error);
          console.error(
            this.formatMessage("error", message),
            errorString || error,
          );
        }
      } else {
        console.error(this.formatMessage("error", message), error);
      }
    } else {
      console.error(this.formatMessage("error", message));
    }

    // Log to system monitoring if server-side
    if (!this.isClient) {
      this.logToSystemMonitoring(message, error).catch((err) => {
        // Don't throw - logging failures shouldn't break the app
        console.error("Failed to log to system monitoring:", err);
      });
    }

    // In production, you might want to send errors to a service like Sentry
    if (!this.isDevelopment && this.isClient) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error);
    }
  }

  /**
   * Safely serialize error objects to string
   */
  private serializeError(error: any): string {
    if (!error) return "";

    // If it's already a string, return it
    if (typeof error === "string") {
      return error;
    }

    // If it's an Error instance, extract message and stack
    if (error instanceof Error) {
      return error.message || error.toString();
    }

    // If it has a message property, use it
    if (error.message) {
      return String(error.message);
    }

    // If it has a code and message, format it nicely
    if (error.code && error.message) {
      return `[${error.code}] ${error.message}`;
    }

    // Try to stringify the object, but handle circular references
    try {
      const serialized = JSON.stringify(
        error,
        Object.getOwnPropertyNames(error),
      );
      if (
        serialized &&
        serialized !== "{}" &&
        !serialized.includes("[object Object]")
      ) {
        return serialized;
      }
    } catch {
      // If JSON.stringify fails (circular reference), try toString
    }

    // Fallback to toString if available
    if (error.toString && error.toString() !== "[object Object]") {
      return error.toString();
    }

    // Last resort: return a descriptive string
    return `Error: ${error.constructor?.name || "Unknown"}`;
  }

  /**
   * Safely extract error stack trace
   */
  private extractErrorStack(error: any): string | undefined {
    if (!error) return undefined;

    if (error instanceof Error && error.stack) {
      return error.stack;
    }

    if (error.stack) {
      return String(error.stack);
    }

    return undefined;
  }

  /**
   * Safely extract error context for logging
   */
  private extractErrorContext(error: any): Record<string, unknown> | undefined {
    if (!error) return undefined;

    try {
      const context: Record<string, unknown> = {};

      // Extract common error properties
      if (error.code) context.code = error.code;
      if (error.name) context.name = error.name;
      if (error.message) context.message = error.message;
      if (error.details) context.details = error.details;
      if (error.hint) context.hint = error.hint;

      // If it's a Supabase error, extract additional info
      if (error.code && (error.message || error.details)) {
        context.error = this.serializeError(error);
      }

      return Object.keys(context).length > 0 ? context : undefined;
    } catch {
      // If extraction fails, return minimal context
      return { error: this.serializeError(error) };
    }
  }

  private async logToSystemMonitoring(message: string, error?: any) {
    try {
      // Skip logging if this is an RLS error to prevent infinite loops
      if (
        error?.code === "42501" ||
        error?.message?.includes("row-level security")
      ) {
        return;
      }

      // Skip logging if message is about failed system error logging
      if (message.includes("Failed to log system error")) {
        return;
      }

      // Skip logging if error is about cookies() in cached functions
      // This prevents errors when logging from within unstable_cache
      const errorMessage = this.serializeError(error);
      if (
        errorMessage.includes("cookies()") &&
        errorMessage.includes("unstable_cache")
      ) {
        return;
      }

      // Only import on server side
      const { logSystemError } = await import("./system-monitoring");

      // Determine component from error or default to 'api'
      let component:
        | "database"
        | "api"
        | "auth"
        | "email"
        | "storage"
        | "payment" = "api";
      if (error) {
        const errMsg = this.serializeError(error);
        if (
          errMsg.includes("database") ||
          errMsg.includes("supabase") ||
          errMsg.includes("postgres")
        ) {
          component = "database";
        } else if (
          errMsg.includes("auth") ||
          errMsg.includes("login") ||
          errMsg.includes("session")
        ) {
          component = "auth";
        } else if (errMsg.includes("email") || errMsg.includes("resend")) {
          component = "email";
        } else if (errMsg.includes("storage") || errMsg.includes("s3")) {
          component = "storage";
        } else if (errMsg.includes("stripe") || errMsg.includes("payment")) {
          component = "payment";
        }
      }

      // Determine error type
      let errorType: "critical" | "warning" | "info" = "warning";
      if (error) {
        const errMsg = this.serializeError(error);
        if (
          errMsg.includes("critical") ||
          errMsg.includes("fatal") ||
          errMsg.includes("down")
        ) {
          errorType = "critical";
        }
      }

      await logSystemError({
        component,
        errorType,
        errorMessage: message,
        errorStack: this.extractErrorStack(error),
        context: this.extractErrorContext(error),
      });
    } catch (err) {
      // Silently fail - don't break logging
      // This prevents infinite loops if logging itself fails
      // Don't log RLS errors or cookies() errors to prevent loops
      const errMessage = this.serializeError(err);
      const errCode =
        err && typeof err === "object" && "code" in err ? err.code : null;

      if (
        errCode !== "42501" &&
        !errMessage.includes("cookies()") &&
        !errMessage.includes("unstable_cache")
      ) {
        // Only log in development to avoid noise
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to log to system monitoring:", err);
        }
      }
    }
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      if (data) {
        console.debug(this.formatMessage("debug", message), data);
      } else {
        console.debug(this.formatMessage("debug", message));
      }
    }
  }
}

export const logger = new Logger();
