export interface AuthenticatedUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  tier?: string;
  organizationId?: string;
  [key: string]: unknown;
}

// NOTE: AuthenticatedRequest is now defined globally in express.d.ts
// This provides proper Express Request augmentation with all custom properties
