/**
 * Express type extensions for shared functionality
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string;
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
      };
      filters?: Record<string, any>;
    }
  }
}

export {};