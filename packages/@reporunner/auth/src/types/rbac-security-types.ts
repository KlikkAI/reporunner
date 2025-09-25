attributeStatementMapping: z.record(z.string()).optional(),
})

export type SAMLConfig = z.infer<typeof SAMLConfigSchema>;

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

// Role-Based Access Control (RBAC)
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  organizationId: z.string().optional(),
  isSystem: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().optional(),
  conditions: z.record(z.unknown()).optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

// Session types
export interface SessionData {
  userId: string;
  email: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  loginMethod: 'email' | 'oauth' | 'saml';
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
}

// Audit types
export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

// Security settings
export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number; // days
  };
  sessionConfig: {
    maxAge: number; // seconds
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  rateLimiting: {
    enabled: boolean;
    requests: number;
    window: number; // seconds
