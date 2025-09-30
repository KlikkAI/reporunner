/**
 * Prompt Template implementation
 * Reusing patterns from workflow data transformation and expression evaluation
 */

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
  };
}

export interface PromptTemplateConfig {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  category?: string;
  tags?: string[];
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PromptTemplate {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly template: string;
  public readonly variables: PromptVariable[];
  public readonly category?: string;
  public readonly tags?: string[];
  public readonly version?: string;

  constructor(config: PromptTemplateConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.template = config.template;
    this.variables = config.variables;
    this.category = config.category;
    this.tags = config.tags;
    this.version = config.version;
  }

  render(variables: Record<string, any> = {}): string {
    let renderedTemplate = this.template;

    // Validate required variables
    this.validateVariables(variables);

    // Replace variables in template
    for (const variable of this.variables) {
      const value = variables[variable.name] ?? variable.default;
      const processedValue = this.processVariableValue(value, variable);

      // Support both {{variable}} and {variable} syntax
      const patterns = [
        new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g'),
        new RegExp(`\\{\\s*${variable.name}\\s*\\}`, 'g'),
      ];

      for (const pattern of patterns) {
        renderedTemplate = renderedTemplate.replace(pattern, processedValue);
      }
    }

    return renderedTemplate;
  }

  validate(variables: Record<string, any> = {}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateVariables(variables);
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      return { valid: false, errors };
    }
  }

  getRequiredVariables(): PromptVariable[] {
    return this.variables.filter((v) => v.required !== false);
  }

  getOptionalVariables(): PromptVariable[] {
    return this.variables.filter((v) => v.required === false);
  }

  private validateVariables(variables: Record<string, any>): void {
    for (const variable of this.variables) {
      const value = variables[variable.name];

      // Check required variables
      if (variable.required !== false && (value === undefined || value === null)) {
        throw new Error(`Required variable '${variable.name}' is missing`);
      }

      // Skip validation for undefined optional variables
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      this.validateVariableType(value, variable);

      // Custom validation rules
      this.validateVariableRules(value, variable);
    }
  }

  private validateVariableType(value: any, variable: PromptVariable): void {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== variable.type) {
      throw new Error(
        `Variable '${variable.name}' expected type '${variable.type}' but got '${actualType}'`
      );
    }
  }

  private validateVariableRules(value: any, variable: PromptVariable): void {
    const validation = variable.validation;
    if (!validation) {
      return;
    }

    // Pattern validation for strings
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(
          `Variable '${variable.name}' does not match pattern '${validation.pattern}'`
        );
      }
    }

    // Min/max validation for numbers and strings
    if (validation.min !== undefined) {
      if (typeof value === 'number' && value < validation.min) {
        throw new Error(`Variable '${variable.name}' must be at least ${validation.min}`);
      }
      if (typeof value === 'string' && value.length < validation.min) {
        throw new Error(
          `Variable '${variable.name}' must be at least ${validation.min} characters`
        );
      }
    }

    if (validation.max !== undefined) {
      if (typeof value === 'number' && value > validation.max) {
        throw new Error(`Variable '${variable.name}' must be at most ${validation.max}`);
      }
      if (typeof value === 'string' && value.length > validation.max) {
        throw new Error(`Variable '${variable.name}' must be at most ${validation.max} characters`);
      }
    }

    // Options validation
    if (validation.options && !validation.options.includes(value)) {
      throw new Error(
        `Variable '${variable.name}' must be one of: ${validation.options.join(', ')}`
      );
    }
  }

  private processVariableValue(value: any, variable: PromptVariable): string {
    if (value === undefined || value === null) {
      return '';
    }

    switch (variable.type) {
      case 'string':
        return String(value);
      case 'number':
        return String(value);
      case 'boolean':
        return String(value);
      case 'object':
      case 'array':
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  }
}

export class PromptTemplateManager {
  private templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getByCategory(category: string): PromptTemplate[] {
    return this.getAll().filter((t) => t.category === category);
  }

  getByTag(tag: string): PromptTemplate[] {
    return this.getAll().filter((t) => t.tags?.includes(tag));
  }

  search(query: string): PromptTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAll().filter(
      (t) =>
        t.name.toLowerCase().includes(lowercaseQuery) ||
        t.description?.toLowerCase().includes(lowercaseQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  remove(id: string): boolean {
    return this.templates.delete(id);
  }

  clear(): void {
    this.templates.clear();
  }
}
