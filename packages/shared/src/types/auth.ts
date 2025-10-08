import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  tier?: string;
  organizationId?: string;
  tokenId?: string;
  sessionId?: string;
  profileCompleted?: boolean;
  [key: string]: unknown;
}

// Export AuthenticatedRequest type for use in middleware and controllers
// This leverages the global Express.Request augmentation from express.d.ts
// Using intersection type to ensure user is required while maintaining all Request properties
export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
