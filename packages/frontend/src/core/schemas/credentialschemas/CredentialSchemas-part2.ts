testOnCreate: z.boolean().default(true),
})

// Credential test request/response
export const CredentialTestRequestSchema = z.object({
  credentialId: IdSchema,
  testType: z.enum(['connection', 'auth', 'permissions']).default('connection'),
  additionalParams: z.record(z.string(), z.unknown()).optional(),
});

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
});

// OAuth2 flow schemas
export const OAuth2InitRequestSchema = z.object({
  credentialType: CredentialTypeSchema,
  redirectUri: z.string().url(),
  state: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

export const OAuth2CallbackRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
  credentialType: CredentialTypeSchema,
});

export const OAuth2TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().min(0).optional(),
  scope: z.string().optional(),
});

// Credential sharing/permissions
export const CredentialPermissionSchema = z.object({
  userId: z.string(),
  userName: z.string().optional(),
  permissions: z.array(z.enum(['read', 'use', 'modify', 'delete'])),
  grantedAt: TimestampSchema,
  grantedBy: z.string(),
});

export const CredentialWithPermissionsSchema = CredentialSchema.and(
  z.object({
    permissions: z.array(CredentialPermissionSchema).default([]),
    isShared: z.boolean().default(false),
    ownerId: z.string(),
  })
);

// Credential filter schemas
export const CredentialFilterSchema = z.object({
  type: CredentialTypeSchema.optional(),
  status: StatusSchema.optional(),
  integration: z.string().optional(),
  search: z.string().optional(), // Search in name/description
  includeShared: z.boolean().default(true),
  onlyOwned: z.boolean().default(false),
});

// API request schemas
export const CreateCredentialRequestSchema = CredentialConfigSchema;

export const UpdateCredentialRequestSchema = CredentialConfigSchema.partial().and(
  z.object({
    id: IdSchema,
  })
);

export const CredentialUsageLogSchema = z.object({
  id: IdSchema,
  credentialId: IdSchema,
  workflowId: IdSchema.optional(),
  nodeId: z.string().optional(),
  usedAt: TimestampSchema,
  action: z.enum(['authenticate', 'api_call', 'test', 'refresh']),
  success: z.boolean(),
  details: z.record(z.string(), z.unknown()).optional(),
});
