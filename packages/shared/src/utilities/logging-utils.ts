/**
 * Centralized logging utilities
 * Replaces Log.use-case.ts files across domains
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class LoggingUtils {
  static log(message: string, level: LogLevel = 'info', context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context
    };

    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  static debug(message: string, context?: any): void {
    this.log(message, 'debug', context);
  }

  static info(message: string, context?: any): void {
    this.log(message, 'info', context);
  }

  static warn(message: string, context?: any): void {
    this.log(message, 'warn', context);
  }

  static error(message: string, error?: Error | any): void {
    this.log(message, 'error', error);
  }
}