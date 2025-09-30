/**
 * Logger Service
 * TODO: Implement comprehensive logging
 */

export interface LogContext {
  [key: string]: any;
}

class Logger {
  info(_message: string, _context?: LogContext) {}

  error(_message: string, _context?: LogContext) {}

  warn(_message: string, _context?: LogContext) {}

  debug(_message: string, _context?: LogContext) {}
}

export const logger = new Logger();
