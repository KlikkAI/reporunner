import { z } from 'zod';

// User and Organization types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  organizationId: z.string().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  logo: z.string().url().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  organizationId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  username: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

// OAuth types
export interface OAuthProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'oidc';
  enabled: boolean;
  config: Record<string, unknown>;
}

export const OAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  callbackURL: z.string(),
  scope: z.array(z.string()).optional(),
  authorizationURL: z.string().optional(),
  tokenURL: z.string().optional(),
  userProfileURL: z.string().optional(),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

// SAML types
export const SAMLConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string(),
  cert: z.string(),
  privateKey: z.string().optional(),
  callbackUrl: z.string().url(),
  signatureAlgorithm: z.string().optional(),
  digestAlgorithm: z.string().optional(),
