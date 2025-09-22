/**
 * Professional Logging Service
 * Provides structured logging with multiple transports and formats
 */

import path from 'path';
import winston from 'winston';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

// Log context interface
export interface LogContext {
  userId?: string;
  sessionId?: string;
  workflowId?: string;
  operationId?: string;
  requestId?: string;
  traceId?: string;
  component?: string;
  module?: string;
  method?: string;
  [key: string]: any;
}

// Performance metrics interface
export interface PerformanceMetrics {
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  timestamp: number;
}

class LoggerService {
  private logger: winston.Logger;
  private metricsLogger: winston.Logger;

  constructor() {
    this.logger = this.createMainLogger();
    this.metricsLogger = this.createMetricsLogger();
  }

  private createMainLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const logEntry: any = {
          timestamp,
          level,
          message,
          context: context || {},
          ...meta,
        };

        if (stack) {
          logEntry.stack = stack;
        }

        return JSON.stringify(logEntry);
      })
    );

    const transports: winston.transport[] = [
      // Console transport with colors for development
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            const contextStr =
              context && Object.keys(context).length > 0 ? ` [${JSON.stringify(context)}]` : '';
            return `${timestamp} ${level}: ${message}${contextStr}`;
          })
        ),
      }),
    ];

    // File transports for production
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
      // Error logs
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
        })
      );

      // Combined logs
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: logFormat,
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 10,
        })
      );

      // HTTP logs
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'http.log'),
          level: 'http',
          format: logFormat,
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      // Don't exit on handled exceptions
      exitOnError: false,
      // Handle uncaught exceptions and unhandled rejections
      handleExceptions: true,
      handleRejections: true,
    });
  }

  private createMetricsLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'metrics.log'),
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 5,
        }),
      ],
    });
  }

  // Main logging methods
  public error(message: string, context?: LogContext, error?: Error): void {
    this.logger.error(message, {
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context });
  }

  public info(message: string, context?: LogContext): void {
    this.logger.info(message, { context });
  }

  public http(message: string, context?: LogContext): void {
    this.logger.http(message, { context });
  }

  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { context });
  }

  public verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, { context });
  }

  // Specialized logging methods
  public logRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
      requestId: req.id,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
      duration,
    };

    this.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, context);
  }

  public logDatabaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database query executed in ${duration}ms`, {
      ...context,
      query,
      duration,
      component: 'database',
    });
  }

  public logCollaborationEvent(event: string, sessionId: string, userId: string, data?: any): void {
    this.info(`Collaboration event: ${event}`, {
      sessionId,
      userId,
      component: 'collaboration',
      event,
      data,
    });
  }

  public logWorkflowExecution(
    workflowId: string,
    nodeId: string,
    status: string,
    duration?: number,
    error?: Error
  ): void {
    const level = error ? 'error' : 'info';
    const message = `Workflow execution: ${workflowId}/${nodeId} - ${status}`;

    const context: LogContext = {
      workflowId,
      nodeId,
      component: 'workflow-engine',
      status,
      duration,
    };

    if (error) {
      this.error(message, context, error);
    } else {
      this.info(message, context);
    }
  }

  public logPerformanceMetrics(
    operation: string,
    metrics: PerformanceMetrics,
    context?: LogContext
  ): void {
    this.metricsLogger.info('Performance metrics', {
      operation,
      metrics,
      context,
      timestamp: Date.now(),
    });
  }

  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';

    this.logger.log(level, `Security event: ${event}`, {
      context: {
        ...context,
        component: 'security',
        event,
        severity,
      },
    });
  }

  public logAIOperation(
    operation: string,
    provider: string,
    duration: number,
    tokens?: number,
    context?: LogContext
  ): void {
    this.info(`AI operation: ${operation} via ${provider}`, {
      ...context,
      component: 'ai',
      operation,
      provider,
      duration,
      tokens,
    });
  }

  // Utility methods
  public createChildLogger(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  public setLogLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  public getLogLevel(): string {
    return this.logger.level;
  }

  // Stream for morgan HTTP logging
  public getHttpStream() {
    return {
      write: (message: string) => {
        this.http(message.trim());
      },
    };
  }
}

// Child logger for context-specific logging
export class ChildLogger {
  constructor(
    private parent: LoggerService,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }

  public warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  public debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  public http(message: string, context?: LogContext): void {
    this.parent.http(message, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = new LoggerService();
export default logger;
