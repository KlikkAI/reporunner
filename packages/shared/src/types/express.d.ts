import type { AuthenticatedUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
      organizationId?: string;
      sessionId?: string;
      validated?: Record<string, unknown>;
      validationResult?: {
        valid: boolean;
        errors: Array<{
          field: string;
          message: string;
          value?: unknown;
        }>;
      };
    }
  }
}
