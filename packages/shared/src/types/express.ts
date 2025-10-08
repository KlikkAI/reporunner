/**
 * Express type extensions for shared functionality
 */

import type { AuthenticatedUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
      organizationId?: string;
      sessionId?: string;
      token?: string;
      rbac?: {
        decision?: any;
        permissions?: string[];
      };
      organization?: {
        id: string;
        name: string;
        settings?: Record<string, any>;
      };
      pagination?: {
        page: number;
        limit: number;
        skip: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
      filters?: Record<string, any>;
    }
  }
}

export {};
