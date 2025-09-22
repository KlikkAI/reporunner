/**
 * Express.js type extensions and augmentations
 */

import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        organizationId?: string;
        isEmailVerified: boolean;
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
    permissions: string[];
    organizationId?: string;
    isEmailVerified: boolean;
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
