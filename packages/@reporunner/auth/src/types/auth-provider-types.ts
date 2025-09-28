// OAuth Configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scope?: string[];
  redirectUri: string;
}

// SAML Configuration
export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
}

// Two-Factor Authentication Settings
export interface TwoFactorSettings {
  enabled: boolean;
  required: boolean;
  backupCodes: number;
}

// Authentication events
export enum AuthEvent {
  LOGIN_SUCCESS = 'login.success',
  LOGIN_FAILED = 'login.failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password.changed',
  PASSWORD_RESET = 'password.reset',
  TWO_FACTOR_ENABLED = 'two_factor.enabled',
  TWO_FACTOR_DISABLED = 'two_factor.disabled',
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
}

export interface AuthEventData {
  event: AuthEvent;
  userId?: string;
  email?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// Provider configuration
export interface AuthProviderConfig {
  local: {
    enabled: boolean;
    allowRegistration: boolean;
    emailVerificationRequired: boolean;
  };
  oauth: {
    google?: OAuthConfig;
    github?: OAuthConfig;
    microsoft?: OAuthConfig;
    slack?: OAuthConfig;
  };
  saml: {
    [key: string]: SAMLConfig;
  };
  oidc: {
    [key: string]: OAuthConfig;
  };
}
