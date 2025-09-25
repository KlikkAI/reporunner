// API Response schemas
export const CredentialResponseSchema = ApiResponseSchema(CredentialSchema);
export const CredentialListResponseSchema = ApiResponseSchema(
  z.object({
    credentials: z.array(CredentialSchema),
  })
);
export const CredentialTestResponseSchema = ApiResponseSchema(CredentialTestResultSchema);
export const OAuth2InitResponseSchema = ApiResponseSchema(
  z.object({
    authorizationUrl: z.string().url(),
    state: z.string(),
  })
);
export const OAuth2TokenSchema = ApiResponseSchema(OAuth2TokenResponseSchema);

// Statistics schemas
export const CredentialStatsSchema = z.object({
  total: z.number().int().min(0),
  byType: z.record(CredentialTypeSchema, z.number().int().min(0)),
  byStatus: z.record(StatusSchema, z.number().int().min(0)),
  active: z.number().int().min(0),
  expired: z.number().int().min(0),
  recentlyUsed: z.number().int().min(0),
  needsTesting: z.number().int().min(0),
});

export const CredentialStatsResponseSchema = ApiResponseSchema(CredentialStatsSchema);

// Credential type definition with UI properties
export const CredentialTypeDefinitionSchema = z.object({
  name: CredentialTypeSchema,
  displayName: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  properties: z
    .array(
      z.object({
        name: z.string(),
        displayName: z.string(),
        type: z.string(),
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

// Type exports
export type CredentialType = z.infer<typeof CredentialTypeSchema>;
export type CredentialTypeDefinition = z.infer<typeof CredentialTypeDefinitionSchema>;
export type OAuth2CredentialData = z.infer<typeof OAuth2CredentialDataSchema>;
export type ApiKeyCredentialData = z.infer<typeof ApiKeyCredentialDataSchema>;
export type DatabaseCredentialData = z.infer<typeof DatabaseCredentialDataSchema>;
export type GenericCredentialData = z.infer<typeof GenericCredentialDataSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type CredentialConfig = z.infer<typeof CredentialConfigSchema>;
export type CredentialTestRequest = z.infer<typeof CredentialTestRequestSchema>;
export type CredentialTestResult = z.infer<typeof CredentialTestResultSchema>;
export type OAuth2InitRequest = z.infer<typeof OAuth2InitRequestSchema>;
export type OAuth2CallbackRequest = z.infer<typeof OAuth2CallbackRequestSchema>;
export type OAuth2TokenResponse = z.infer<typeof OAuth2TokenResponseSchema>;
export type CredentialPermission = z.infer<typeof CredentialPermissionSchema>;
export type CredentialWithPermissions = z.infer<typeof CredentialWithPermissionsSchema>;
export type CredentialFilter = z.infer<typeof CredentialFilterSchema>;
export type CreateCredentialRequest = z.infer<typeof CreateCredentialRequestSchema>;
export type UpdateCredentialRequest = z.infer<typeof UpdateCredentialRequestSchema>;
export type CredentialUsageLog = z.infer<typeof CredentialUsageLogSchema>;
export type CredentialResponse = z.infer<typeof CredentialResponseSchema>;
export type CredentialListResponse = z.infer<typeof CredentialListResponseSchema>;
export type CredentialTestResponse = z.infer<typeof CredentialTestResponseSchema>;
export type OAuth2InitResponse = z.infer<typeof OAuth2InitResponseSchema>;
export type OAuth2Token = z.infer<typeof OAuth2TokenSchema>;
export type CredentialStats = z.infer<typeof CredentialStatsSchema>;
export type CredentialStatsResponse = z.infer<typeof CredentialStatsResponseSchema>;
