/**
 * Enhanced Error Handlers
 * TODO: Implement enhanced error handling middleware
 */

import type { Request, Response, NextFunction } from 'express';

export const enhancedCatchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};