import { z } from 'zod';
import {
  ApiResponseSchema,
  IdSchema,
  MetadataSchema,
  StatusSchema,
  TimestampSchema,
} from './BaseSchemas';

// Credential type definitions
export const CredentialTypeSchema = z.enum([
  'gmailOAuth2',
  'openaiApi',
  'anthropicApi',
  'googleAiApi',
  'azureOpenAiApi',
  'awsBedrockApi',
  'ollamaApi',
  'postgres',
  'mongodb',
  'mysql',
  'redis',
  'slack',
  'discord',
  'webhook',
  'custom',
]);

// OAuth2 specific schemas
export const OAuth2CredentialDataSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenType: z.string().default('Bearer'),
  expiresAt: TimestampSchema.optional(),
  scope: z.array(z.string()).optional(),
  redirectUri: z.string().url().optional(),
});

// API Key credential schemas
export const ApiKeyCredentialDataSchema = z.object({
  apiKey: z.string().min(1),
  endpoint: z.string().url().optional(),
  organization: z.string().optional(),
  model: z.string().optional(),
  version: z.string().optional(),
  region: z.string().optional(),
});

// Database credential schemas
export const DatabaseCredentialDataSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
  connectionString: z.string().optional(),
  maxConnections: z.number().int().min(1).max(100).optional(),
});

// Generic credential data (for custom/webhook types)
export const GenericCredentialDataSchema = z.record(z.string(), z.union([z.string(), z.unknown()]));

// Main credential schema - matches actual backend response
export const CredentialSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string(),
  type: z.string(), // Backend sends flexible strings, not enum
  userId: z.string(),
  integration: z.string(),
  isActive: z.boolean(),
  isValid: z.boolean().optional(),
  expiresAt: z.string().optional(), // ISO string from backend
  lastTestedAt: z.string().optional(), // ISO string from backend
  createdAt: z.string(), // ISO string from backend
  updatedAt: z.string(), // ISO string from backend
  __v: z.number().optional(), // MongoDB version field
  isExpired: z.boolean().optional(),
  // Optional fields that might appear
  description: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(), // Flexible data object
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Credential configuration (for creation/update)
export const CredentialConfigSchema = z.object({
  name: z.string().min(1).max(255),
  type: CredentialTypeSchema,
  description: z.string().max(1000).optional(),
  integration: z.string().optional(),
  data: z.union([
    OAuth2CredentialDataSchema,
    ApiKeyCredentialDataSchema,
    DatabaseCredentialDataSchema,
    GenericCredentialDataSchema,
  ]),
  metadata: MetadataSchema.optional(),
