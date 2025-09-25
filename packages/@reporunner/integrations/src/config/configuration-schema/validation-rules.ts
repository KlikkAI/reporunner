type: z.literal('bearer'), config;
: z.object(
{
  token: z.string(),
}
),
      }),
      z.object(
{
  type: z.literal('custom'), config;
  : z.record(z.any()),
}
),
    ])
    .optional(),

  // Connection settings
  connection: ConnectionConfigSchema.optional(),

  // Webhooks
  webhooks: z
    .object(
{
  enabled: z.boolean().default(false), basePath;
  : z.string().default('/webhooks'),
      configs: z.array(WebhookConfigSchema).optional(),
}
)
    .optional(),

  // Rate limiting
  rateLimit: RateLimitConfigSchema.optional(),

  // Feature flags
  features: z.record(z.boolean()).optional(),

  // Custom settings
  settings: z.record(z.any()).optional(),

  // Permissions
  requiredPermissions: z.array(z.string()).optional(),

  // Dependencies
  dependencies: z.array(z.string()).optional(),
})

// Specific integration schemas
export const GitHubIntegrationConfigSchema = BaseIntegrationConfigSchema.extend({
  name: z.literal('github'),
  authentication: z.object({
    type: z.literal('oauth2'),
    config: OAuth2ConfigSchema.extend({
      authorizationUrl: z.literal('https://github.com/login/oauth/authorize'),
      tokenUrl: z.literal('https://github.com/login/oauth/access_token'),
      scopes: z.array(z.enum(['repo', 'user', 'gist', 'notifications', 'admin:org'])),
    }),
  }),
  settings: z
    .object({
      organization: z.string().optional(),
      repository: z.string().optional(),
      defaultBranch: z.string().default('main'),
      autoMerge: z.boolean().default(false),
      requireReviews: z.number().min(0).default(1),
      protectedBranches: z.array(z.string()).default(['main', 'master']),
    })
    .optional(),
});

export const SlackIntegrationConfigSchema = BaseIntegrationConfigSchema.extend({
  name: z.literal('slack'),
  authentication: z.object({
    type: z.literal('oauth2'),
    config: OAuth2ConfigSchema.extend({
      authorizationUrl: z.literal('https://slack.com/oauth/v2/authorize'),
      tokenUrl: z.literal('https://slack.com/api/oauth.v2.access'),
      scopes: z.array(z.string()),
    }),
  }),
  settings: z
    .object({
      workspace: z.string().optional(),
      defaultChannel: z.string().optional(),
      notificationTypes: z
        .array(z.enum(['message', 'mention', 'reaction', 'thread']))
        .default(['message', 'mention']),
      botName: z.string().default('RepoRunner Bot'),
      botIcon: z.string().optional(),
    })
    .optional(),
});

export const JiraIntegrationConfigSchema = BaseIntegrationConfigSchema.extend({
  name: z.literal('jira'),
  authentication: z.object({
    type: z.literal('api_key'),
    config: ApiKeySchema.extend({
      domain: z.string().url(),
      email: z.string().email(),
    }),
  }),
  settings: z
    .object({
      project: z.string().optional(),
      issueTypes: z.array(z.string()).default(['Bug', 'Task', 'Story']),
      defaultAssignee: z.string().optional(),
