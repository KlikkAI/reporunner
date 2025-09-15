import { z } from 'zod'
import {
  IdSchema,
  OptionalIdSchema,
  TimestampSchema,
  StatusSchema,
  MetadataSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
} from './BaseSchemas'

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
])

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
})

// API Key credential schemas
export const ApiKeyCredentialDataSchema = z.object({
  apiKey: z.string().min(1),
  endpoint: z.string().url().optional(),
  organization: z.string().optional(),
  model: z.string().optional(),
  version: z.string().optional(),
  region: z.string().optional(),
})

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
})

// Generic credential data (for custom/webhook types)
export const GenericCredentialDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.unknown()])
)

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
})

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
  testOnCreate: z.boolean().default(true),
})

// Credential test request/response
export const CredentialTestRequestSchema = z.object({
  credentialId: IdSchema,
  testType: z.enum(['connection', 'auth', 'permissions']).default('connection'),
  additionalParams: z.record(z.string(), z.unknown()).optional(),
})

export const CredentialTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z
    .object({
      responseTime: z.number().min(0).optional(),
      statusCode: z.number().int().optional(),
      endpoint: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      quotaInfo: z
        .object({
          used: z.number().min(0).optional(),
          limit: z.number().min(0).optional(),
          resetDate: TimestampSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  testedAt: TimestampSchema,
  errors: z.array(z.string()).optional(),
})

// OAuth2 flow schemas
export const OAuth2InitRequestSchema = z.object({
  credentialType: CredentialTypeSchema,
  redirectUri: z.string().url(),
  state: z.string().optional(),
  scopes: z.array(z.string()).optional(),
})

export const OAuth2CallbackRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
  credentialType: CredentialTypeSchema,
})

export const OAuth2TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().min(0).optional(),
  scope: z.string().optional(),
})

// Credential sharing/permissions
export const CredentialPermissionSchema = z.object({
  userId: z.string(),
  userName: z.string().optional(),
  permissions: z.array(z.enum(['read', 'use', 'modify', 'delete'])),
  grantedAt: TimestampSchema,
  grantedBy: z.string(),
})

export const CredentialWithPermissionsSchema = CredentialSchema.and(
  z.object({
    permissions: z.array(CredentialPermissionSchema).default([]),
    isShared: z.boolean().default(false),
    ownerId: z.string(),
  })
)

// Credential filter schemas
export const CredentialFilterSchema = z.object({
  type: CredentialTypeSchema.optional(),
  status: StatusSchema.optional(),
  integration: z.string().optional(),
  search: z.string().optional(), // Search in name/description
  includeShared: z.boolean().default(true),
  onlyOwned: z.boolean().default(false),
})

// API request schemas
export const CreateCredentialRequestSchema = CredentialConfigSchema

export const UpdateCredentialRequestSchema =
  CredentialConfigSchema.partial().and(
    z.object({
      id: IdSchema,
    })
  )

export const CredentialUsageLogSchema = z.object({
  id: IdSchema,
  credentialId: IdSchema,
  workflowId: IdSchema.optional(),
  nodeId: z.string().optional(),
  usedAt: TimestampSchema,
  action: z.enum(['authenticate', 'api_call', 'test', 'refresh']),
  success: z.boolean(),
  details: z.record(z.string(), z.unknown()).optional(),
})

// API Response schemas
export const CredentialResponseSchema = ApiResponseSchema(CredentialSchema)
export const CredentialListResponseSchema = ApiResponseSchema(
  z.object({
    credentials: z.array(CredentialSchema)
  })
)
export const CredentialTestResponseSchema = ApiResponseSchema(
  CredentialTestResultSchema
)
export const OAuth2InitResponseSchema = ApiResponseSchema(
  z.object({
    authorizationUrl: z.string().url(),
    state: z.string(),
  })
)
export const OAuth2TokenSchema = ApiResponseSchema(OAuth2TokenResponseSchema)

// Statistics schemas
export const CredentialStatsSchema = z.object({
  total: z.number().int().min(0),
  byType: z.record(CredentialTypeSchema, z.number().int().min(0)),
  byStatus: z.record(StatusSchema, z.number().int().min(0)),
  active: z.number().int().min(0),
  expired: z.number().int().min(0),
  recentlyUsed: z.number().int().min(0),
  needsTesting: z.number().int().min(0),
})

export const CredentialStatsResponseSchema = ApiResponseSchema(
  CredentialStatsSchema
)

// Type exports
export type CredentialType = z.infer<typeof CredentialTypeSchema>
export type OAuth2CredentialData = z.infer<typeof OAuth2CredentialDataSchema>
export type ApiKeyCredentialData = z.infer<typeof ApiKeyCredentialDataSchema>
export type DatabaseCredentialData = z.infer<
  typeof DatabaseCredentialDataSchema
>
export type GenericCredentialData = z.infer<typeof GenericCredentialDataSchema>
export type Credential = z.infer<typeof CredentialSchema>
export type CredentialConfig = z.infer<typeof CredentialConfigSchema>
export type CredentialTestRequest = z.infer<typeof CredentialTestRequestSchema>
export type CredentialTestResult = z.infer<typeof CredentialTestResultSchema>
export type OAuth2InitRequest = z.infer<typeof OAuth2InitRequestSchema>
export type OAuth2CallbackRequest = z.infer<typeof OAuth2CallbackRequestSchema>
export type OAuth2TokenResponse = z.infer<typeof OAuth2TokenResponseSchema>
export type CredentialPermission = z.infer<typeof CredentialPermissionSchema>
export type CredentialWithPermissions = z.infer<
  typeof CredentialWithPermissionsSchema
>
export type CredentialFilter = z.infer<typeof CredentialFilterSchema>
export type CreateCredentialRequest = z.infer<
  typeof CreateCredentialRequestSchema
>
export type UpdateCredentialRequest = z.infer<
  typeof UpdateCredentialRequestSchema
>
export type CredentialUsageLog = z.infer<typeof CredentialUsageLogSchema>
export type CredentialResponse = z.infer<typeof CredentialResponseSchema>
export type CredentialListResponse = z.infer<
  typeof CredentialListResponseSchema
>
export type CredentialTestResponse = z.infer<
  typeof CredentialTestResponseSchema
>
export type OAuth2InitResponse = z.infer<typeof OAuth2InitResponseSchema>
export type OAuth2Token = z.infer<typeof OAuth2TokenSchema>
export type CredentialStats = z.infer<typeof CredentialStatsSchema>
export type CredentialStatsResponse = z.infer<
  typeof CredentialStatsResponseSchema
>
