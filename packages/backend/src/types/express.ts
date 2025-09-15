/**
 * Express.js type extensions and augmentations
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      correlationId?: string;
      startTime?: number;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface PaginatedRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    skip?: string;
    [key: string]: any;
  };
}