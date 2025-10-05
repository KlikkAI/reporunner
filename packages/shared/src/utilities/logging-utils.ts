/**
 * Centralized logging utilities
 * Replaces Log.use-case.ts files across domains
 */
import type { LogLevel } from '../types/common';

export class LoggingUtils {
  static log(message: string, level: LogLevel = 'info', context?: any): void {
    const timestamp = new Date().toISOString();
    const _logEntry = {
      timestamp,
      level,
      message,
      context,
    };

    switch (level) {
      case 'debug':
        break;
      case 'info':
        break;
      case 'warn':
        break;
      case 'error':
        break;
    }
  }

  static debug(message: string, context?: any): void {
    LoggingUtils.log(message, 'debug', context);
  }

  static info(message: string, context?: any): void {
    LoggingUtils.log(message, 'info', context);
  }

  static warn(message: string, context?: any): void {
    LoggingUtils.log(message, 'warn', context);
  }

  static error(message: string, error?: Error | any): void {
    LoggingUtils.log(message, 'error', error);
  }
}
