/**
 * Express.js type extensions and augmentations
 */

import type { Request } from 'express';
import type { AuthenticatedUser } from '@reporunner/shared';

// Import AuthenticatedUser from shared package instead of declaring global namespace
// The shared package already defines Express.Request augmentation

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface PaginatedRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    skip?: string;
    [key: string]: any;
  };
}
