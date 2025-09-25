import { z } from 'zod';

// Base schemas for common field types
export const ApiKeySchema = z.object({
  key: z.string().min(1),
  secret: z.string().optional(),
  region: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development', 'test']).optional(),
});

export const OAuth2ConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default([]),
  usePKCE: z.boolean().default(false),
  useStateParameter: z.boolean().default(true),
  accessType: z.enum(['online', 'offline']).optional(),
  prompt: z.enum(['none', 'consent', 'select_account']).optional(),
  additionalParams: z.record(z.string()).optional(),
});

export const WebhookConfigSchema = z.object({
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()).default(['*']),
  headers: z.record(z.string()).optional(),
  validateSignature: z.boolean().default(true),
  signatureHeader: z.string().default('x-signature'),
  signatureAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).default('sha256'),
  maxPayloadSize: z.number().positive().optional(),
  timeout: z.number().positive().default(30000),
  retryOnError: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
});

export const RateLimitConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxRequests: z.number().positive(),
  windowMs: z.number().positive(),
  strategy: z.enum(['sliding', 'fixed']).default('fixed'),
  burstAllowance: z.number().min(0).optional(),
  retryAfterMs: z.number().positive().optional(),
});

export const ConnectionConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().positive().optional(),
  protocol: z.enum(['http', 'https', 'ws', 'wss']).optional(),
  basePath: z.string().optional(),
  timeout: z.number().positive().default(30000),
  keepAlive: z.boolean().default(true),
  maxSockets: z.number().positive().optional(),
  proxy: z
    .object({
      host: z.string(),
      port: z.number(),
      auth: z
        .object({
          username: z.string(),
          password: z.string(),
        })
        .optional(),
    })
    .optional(),
});

// Integration-specific configuration schemas
export const BaseIntegrationConfigSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  documentation: z.string().url().optional(),

  // Authentication
  authentication: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('api_key'),
        config: ApiKeySchema,
      }),
      z.object({
        type: z.literal('oauth2'),
        config: OAuth2ConfigSchema,
      }),
      z.object({
        type: z.literal('basic'),
        config: z.object({
          username: z.string(),
          password: z.string(),
        }),
      }),
      z.object({
