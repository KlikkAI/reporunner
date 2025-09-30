/**
 * Enhanced Error Handlers
 * TODO: Implement enhanced error handling middleware
 */

import type { NextFunction, Request, Response } from 'express';

export const enhancedCatchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
