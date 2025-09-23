export interface TemplateEngine {
  render(template: string, variables: Record<string, any>): string;
}

export class HandlebarsEngine implements TemplateEngine {
  render(template: string, variables: Record<string, any>): string {
    // Simple template replacement - would use handlebars in real implementation
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });
    return result;
  }
}

export class MustacheEngine implements TemplateEngine {
  render(template: string, variables: Record<string, any>): string {
    // Simple template replacement - would use mustache in real implementation
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });
    return result;
  }
}

export interface TemplateValidator {
  validate(template: string): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  variables: string[];
}

export class DefaultTemplateValidator implements TemplateValidator {
  validate(template: string): ValidationResult {
    const errors: string[] = [];
    const variables: string[] = [];

    // Extract variables from template
    const variableMatches = template.match(/\{\{([^}]+)\}\}/g);
    if (variableMatches) {
      variableMatches.forEach((match) => {
        const variable = match.replace(/\{\{|\}\}/g, '').trim();
        if (!variables.includes(variable)) {
          variables.push(variable);
        }
      });
    }

    // Basic validation
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Mismatched template braces');
    }

    return {
      valid: errors.length === 0,
      errors,
      variables,
    };
  }
}

export class TemplateManager {
  private engine: TemplateEngine;
  private validator: TemplateValidator;

  constructor(engine?: TemplateEngine, validator?: TemplateValidator) {
    this.engine = engine || new HandlebarsEngine();
    this.validator = validator || new DefaultTemplateValidator();
  }

  render(template: string, variables: Record<string, any>): string {
    const validation = this.validator.validate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    return this.engine.render(template, variables);
  }

  validateTemplate(template: string): ValidationResult {
    return this.validator.validate(template);
  }

  extractVariables(template: string): string[] {
    return this.validator.validate(template).variables;
  }
}
