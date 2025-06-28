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

    // In production, you might want to send errors to a service like Sentry
    if (!this.isDevelopment && this.isClient) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error);
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