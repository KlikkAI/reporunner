autoCreateIssues: z.boolean().default(false), syncComments;
: z.boolean().default(true),
      customFields: z.record(z.any()).optional(),
    })
    .optional(),
})

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
