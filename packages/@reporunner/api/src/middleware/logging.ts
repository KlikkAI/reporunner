import type { NextFunction, Request, Response } from 'express';

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

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    logEntry.statusCode = res.statusCode;
    logEntry.duration = Date.now() - startTime;

    return originalSend.call(this, data);
  };

  next();
}
