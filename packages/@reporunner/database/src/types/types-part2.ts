startTime: z.date(), endTime;
: z.date().optional(),
  executionTime: z.number().optional(),
  nodeExecutions: z.record(
    z.object(
{
  nodeId: z.string(), status;
  : z.
  enum(['pending', 'running', 'success', 'error', 'skipped', 'waiting']),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      inputData: z.array(
        z.object(
  {
    json: z.record(z.unknown()), binary;
    : z.record(z.unknown()).optional(),
  }
  )
      ),
      outputData: z.array(
        z.object(
  {
    json: z.record(z.unknown()), binary;
    : z.record(z.unknown()).optional(),
  }
  )
      ),
      error: z
        .object(
  {
    message: z.string(), stack;
    : z.string().optional(),
          timestamp: z.date(),
  }
  )
        .optional(),
      retryCount: z.number().default(0),
}
)
  ),
  data: z.object(
{
  startData: z.record(z.unknown()).optional(), resultData;
  : z.record(z.unknown()).optional(),
}
),
  finished: z.boolean().default(false),
  workflowData: z.any(), // Snapshot of workflow at execution time
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
})

export const UserDocumentSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
  password: z.string(), // Hashed
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().optional(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  organizationId: z.string().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  preferences: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).optional(),
});

export const OrganizationDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  logo: z.string().url().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
  memberCount: z.number().default(1),
  limits: z.object({
    workflows: z.number().default(10),
    executions: z.number().default(1000),
    storage: z.number().default(1073741824), // 1GB in bytes
  }),
});

export const CredentialDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  type: z.string(),
  data: z.record(z.unknown()), // Encrypted credential data
  userId: z.string(),
  organizationId: z.string().optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastUsed: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Entity types for MongoDB
export type WorkflowDocument = z.infer<typeof WorkflowDocumentSchema>;
