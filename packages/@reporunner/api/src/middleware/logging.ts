import type { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  timestamp: Date;
  method: string;
  path: string;
  query?: any;
  body?: any;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  const logEntry: LogEntry = {
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).userId,
  };

  // Log request
  console.log(`[${logEntry.timestamp.toISOString()}] ${logEntry.method} ${logEntry.path}`);

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    logEntry.statusCode = res.statusCode;
    logEntry.duration = Date.now() - startTime;

    // Log response
    console.log(
      `[${new Date().toISOString()}] ${logEntry.method} ${logEntry.path} - ${logEntry.statusCode} (${logEntry.duration}ms)`
    );

    return originalSend.call(this, data);
  };

  next();
}