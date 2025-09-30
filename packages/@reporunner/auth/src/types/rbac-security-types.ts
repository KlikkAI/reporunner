// Role-Based Access Control Types
import { z } from 'zod';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RBAC Validation Schemas using zod pattern
export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  resource: z.string(),
  action: z.string(),
  conditions: z.record(z.any()).optional(),
});

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(PermissionSchema),
  isSystemRole: z.boolean(),
  organizationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PermissionType = z.infer<typeof PermissionSchema>;
export type RoleType = z.infer<typeof RoleSchema>;

// Two-Factor Authentication
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

// Security Policy Types
export interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  rules: SecurityRule[];
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_mfa';
  priority: number;
  metadata?: Record<string, any>;
}

// Session Management
export interface SecuritySession {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
}
