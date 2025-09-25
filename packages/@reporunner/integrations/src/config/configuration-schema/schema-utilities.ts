}

  /**
   * Get all schema names
   */
  getSchemaNames(): string[]
{
  return Array.from(this.schemas.keys());
}

/**
 * Generate default configuration
 */
generateDefault(name: string)
: any
{
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
mergeConfigs(base: any, override: any)
: any
{
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
sanitize(config: any)
: any
{
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
