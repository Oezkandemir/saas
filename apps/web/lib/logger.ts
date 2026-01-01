/**
 * Production-safe logging utility
 * Logs only in development, errors always logged
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const context = this.isClient ? '[Client]' : '[Server]';
    return `${timestamp} ${context} [${level.toUpperCase()}] ${message}`;
  }

  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      if (data) {
        console.log(this.formatMessage('info', message), data);
      } else {
        console.log(this.formatMessage('info', message));
      }
    }
  }

  warn(message: string, data?: LogData) {
    if (data) {
      console.warn(this.formatMessage('warn', message), data);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  error(message: string, error?: any) {
    if (error) {
      console.error(this.formatMessage('error', message), error);
    } else {
      console.error(this.formatMessage('error', message));
    }

    // Log to system monitoring if server-side
    if (!this.isClient) {
      this.logToSystemMonitoring(message, error).catch((err) => {
        // Don't throw - logging failures shouldn't break the app
        console.error('Failed to log to system monitoring:', err);
      });
    }

    // In production, you might want to send errors to a service like Sentry
    if (!this.isDevelopment && this.isClient) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error);
    }
  }

  private async logToSystemMonitoring(message: string, error?: any) {
    try {
      // Skip logging if this is an RLS error to prevent infinite loops
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        return;
      }

      // Skip logging if message is about failed system error logging
      if (message.includes('Failed to log system error')) {
        return;
      }

      // Only import on server side
      const { logSystemError } = await import('./system-monitoring');
      
      // Determine component from error or default to 'api'
      let component: 'database' | 'api' | 'auth' | 'email' | 'storage' | 'payment' = 'api';
      if (error) {
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('database') || errorMessage.includes('supabase') || errorMessage.includes('postgres')) {
          component = 'database';
        } else if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('session')) {
          component = 'auth';
        } else if (errorMessage.includes('email') || errorMessage.includes('resend')) {
          component = 'email';
        } else if (errorMessage.includes('storage') || errorMessage.includes('s3')) {
          component = 'storage';
        } else if (errorMessage.includes('stripe') || errorMessage.includes('payment')) {
          component = 'payment';
        }
      }

      // Determine error type
      let errorType: 'critical' | 'warning' | 'info' = 'warning';
      if (error) {
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('critical') || errorMessage.includes('fatal') || errorMessage.includes('down')) {
          errorType = 'critical';
        }
      }

      await logSystemError({
        component,
        errorType,
        errorMessage: message,
        errorStack: error?.stack || (error ? String(error) : undefined),
        context: error ? { error: String(error) } : undefined,
      });
    } catch (err) {
      // Silently fail - don't break logging
      // This prevents infinite loops if logging itself fails
      // Don't log RLS errors to prevent loops
      if (process.env.NODE_ENV === 'development' && err && typeof err === 'object' && 'code' in err && err.code !== '42501') {
        console.error('Failed to log to system monitoring:', err);
      }
    }
  }

  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      if (data) {
        console.debug(this.formatMessage('debug', message), data);
      } else {
        console.debug(this.formatMessage('debug', message));
      }
    }
  }
}

export const logger = new Logger(); 