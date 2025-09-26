export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
}

export interface LoggerOptions {
  minLevel?: LogLevel;
  serviceName?: string;
  enableConsole?: boolean;
  customHandlers?: Array<(entry: LogEntry) => void>;
}

export class Logger {
  private readonly options: Required<LoggerOptions>;
  
  constructor(serviceName: string, options: LoggerOptions = {}) {
    this.options = {
      minLevel: 'info',
      serviceName,
      enableConsole: true,
      customHandlers: [],
      ...options
    };
  }

  public debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error | any): void {
    this.log('error', message, undefined, error);
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    if (levels[level] < levels[this.options.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.options.serviceName}] ${message}`,
      context,
      error
    };

    // Console logging
    if (this.options.enableConsole) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      const prefix = `${entry.timestamp} ${level.toUpperCase()}:`;

      console[consoleMethod](prefix, entry.message);
      
      if (context) {
        console[consoleMethod]('Context:', context);
      }
      
      if (error) {
        console[consoleMethod]('Error:', error);
        if (error.stack) {
          console[consoleMethod]('Stack:', error.stack);
        }
      }
    }

    // Custom handlers
    this.options.customHandlers.forEach(handler => {
      try {
        handler(entry);
      } catch (handlerError) {
        console.error('Error in log handler:', handlerError);
      }
    });
  }

  /**
   * Add a custom log handler
   */
  public addHandler(handler: (entry: LogEntry) => void): void {
    this.options.customHandlers.push(handler);
  }

  /**
   * Remove a custom log handler
   */
  public removeHandler(handler: (entry: LogEntry) => void): void {
    const index = this.options.customHandlers.indexOf(handler);
    if (index >= 0) {
      this.options.customHandlers.splice(index, 1);
    }
  }

  /**
   * Create a child logger with a sub-context
   */
  public child(subContext: string): Logger {
    return new Logger(
      `${this.options.serviceName}:${subContext}`,
      { ...this.options }
    );
  }
}