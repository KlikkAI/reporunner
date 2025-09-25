documentation?: string;
supportEmail?: string;
}

export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodes: string[];
  recoveryEmail?: string;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  name: string;
  enabled: boolean;
  verified: boolean;
  createdAt: number;
  lastUsed?: number;
  metadata?: Record<string, any>;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  keyHash: string;
  permissions: Permission[];
  expiresAt?: number;
  lastUsedAt?: number;
  createdAt: number;
  createdBy: string;
  status: 'active' | 'revoked' | 'expired';
  metadata: {
    ipWhitelist?: string[];
    userAgent?: string;
    description?: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: number;
  createdAt: number;
  lastActivityAt: number;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  isActive: boolean;
  mfaVerified: boolean;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  permissions: Permission[];
  projects: string[];
  invitedBy: string;
  invitedAt: number;
  expiresAt: number;
  acceptedAt?: number;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  message?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    workflows: boolean;
    executions: boolean;
    security: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    widgets: string[];
    refreshInterval: number;
  };
  editor: {
    autoSave: boolean;
    autoComplete: boolean;
    syntaxHighlighting: boolean;
