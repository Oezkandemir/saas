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

      // Skip logging if error is about cookies() in cached functions
      // This prevents errors when logging from within unstable_cache
      const errorMessage = error?.message || String(error || '');
      if (errorMessage.includes('cookies()') && errorMessage.includes('unstable_cache')) {
        return;
      }

      // Only import on server side
      const { logSystemError } = await import('./system-monitoring');
      
      // Determine component from error or default to 'api'
      let component: 'database' | 'api' | 'auth' | 'email' | 'storage' | 'payment' = 'api';
      if (error) {
        const errMsg = error.message || String(error);
        if (errMsg.includes('database') || errMsg.includes('supabase') || errMsg.includes('postgres')) {
          component = 'database';
        } else if (errMsg.includes('auth') || errMsg.includes('login') || errMsg.includes('session')) {
          component = 'auth';
        } else if (errMsg.includes('email') || errMsg.includes('resend')) {
          component = 'email';
        } else if (errMsg.includes('storage') || errMsg.includes('s3')) {
          component = 'storage';
        } else if (errMsg.includes('stripe') || errMsg.includes('payment')) {
          component = 'payment';
        }
      }

      // Determine error type
      let errorType: 'critical' | 'warning' | 'info' = 'warning';
      if (error) {
        const errMsg = error.message || String(error);
        if (errMsg.includes('critical') || errMsg.includes('fatal') || errMsg.includes('down')) {
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
      // Don't log RLS errors or cookies() errors to prevent loops
      const errMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err || '');
      const errCode = err && typeof err === 'object' && 'code' in err ? err.code : null;
      
      if (errCode !== '42501' && !errMessage.includes('cookies()') && !errMessage.includes('unstable_cache')) {
        // Only log in development to avoid noise
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to log to system monitoring:', err);
        }
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