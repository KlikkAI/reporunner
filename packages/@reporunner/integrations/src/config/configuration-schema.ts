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
        type: z.literal('bearer'),
        config: z.object({
          token: z.string(),
        }),
      }),
      z.object({
        type: z.literal('custom'),
        config: z.record(z.any()),
      }),
    ])
    .optional(),

  // Connection settings
  connection: ConnectionConfigSchema.optional(),

  // Webhooks
  webhooks: z
    .object({
      enabled: z.boolean().default(false),
      basePath: z.string().default('/webhooks'),
      configs: z.array(WebhookConfigSchema).optional(),
    })
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
});

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
      autoCreateIssues: z.boolean().default(false),
      syncComments: z.boolean().default(true),
      customFields: z.record(z.any()).optional(),
    })
    .optional(),
});

// Configuration validator
export class ConfigurationValidator {
  private schemas: Map<string, z.ZodSchema> = new Map();

  constructor() {
    // Register default schemas
    this.registerSchema('base', BaseIntegrationConfigSchema);
    this.registerSchema('github', GitHubIntegrationConfigSchema);
    this.registerSchema('slack', SlackIntegrationConfigSchema);
    this.registerSchema('jira', JiraIntegrationConfigSchema);
  }

  /**
   * Register a schema
   */
  registerSchema(name: string, schema: z.ZodSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Validate configuration
   */
  validate(name: string, config: any): { success: boolean; data?: any; errors?: any[] } {
    const schema = this.schemas.get(name) || this.schemas.get('base');

    if (!schema) {
      return {
        success: false,
        errors: [{ message: `No schema found for ${name}` }],
      };
    }

    try {
      const data = schema.parse(config);
      return { success: true, data };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: false,
        errors: [{ message: error.message }],
      };
    }
  }

  /**
   * Validate partial configuration (for updates)
   */
  validatePartial(name: string, config: any): { success: boolean; data?: any; errors?: any[] } {
    const schema = this.schemas.get(name) || this.schemas.get('base');

    if (!schema) {
      return {
        success: false,
        errors: [{ message: `No schema found for ${name}` }],
      };
    }

    try {
      const partialSchema = schema.partial();
      const data = partialSchema.parse(config);
      return { success: true, data };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        };
      }
      return {
        success: false,
        errors: [{ message: error.message }],
      };
    }
  }

  /**
   * Get schema
   */
  getSchema(name: string): z.ZodSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Generate default configuration
   */
  generateDefault(name: string): any {
    const schema = this.schemas.get(name) || this.schemas.get('base');

    if (!schema) {
      throw new Error(`No schema found for ${name}`);
    }

    // This is a simplified default generator
    // In a real implementation, you'd walk the schema and generate appropriate defaults
    try {
      return schema.parse({});
    } catch (_error: any) {
      // Return a minimal valid config
      return {
        name,
        enabled: true,
        version: '1.0.0',
      };
    }
  }

  /**
   * Merge configurations
   */
  mergeConfigs(base: any, override: any): any {
    return {
      ...base,
      ...override,
      authentication: override.authentication || base.authentication,
      connection: { ...base.connection, ...override.connection },
      webhooks: { ...base.webhooks, ...override.webhooks },
      rateLimit: { ...base.rateLimit, ...override.rateLimit },
      features: { ...base.features, ...override.features },
      settings: { ...base.settings, ...override.settings },
    };
  }

  /**
   * Sanitize configuration (remove sensitive data)
   */
  sanitize(config: any): any {
    const sanitized = { ...config };

    // Remove sensitive fields
    if (sanitized.authentication?.config) {
      if (sanitized.authentication.config.clientSecret) {
        sanitized.authentication.config.clientSecret = '***';
      }
      if (sanitized.authentication.config.key) {
        sanitized.authentication.config.key = '***';
      }
      if (sanitized.authentication.config.password) {
        sanitized.authentication.config.password = '***';
      }
      if (sanitized.authentication.config.token) {
        sanitized.authentication.config.token = '***';
      }
    }

    if (sanitized.webhooks?.configs) {
      sanitized.webhooks.configs = sanitized.webhooks.configs.map((wh: any) => ({
        ...wh,
        secret: wh.secret ? '***' : undefined,
      }));
    }

    return sanitized;
  }
}

// Singleton instance
export const configValidator = new ConfigurationValidator();

// Export types
export type BaseIntegrationConfig = z.infer<typeof BaseIntegrationConfigSchema>;
export type GitHubIntegrationConfig = z.infer<typeof GitHubIntegrationConfigSchema>;
export type SlackIntegrationConfig = z.infer<typeof SlackIntegrationConfigSchema>;
export type JiraIntegrationConfig = z.infer<typeof JiraIntegrationConfigSchema>;

export default ConfigurationValidator;
