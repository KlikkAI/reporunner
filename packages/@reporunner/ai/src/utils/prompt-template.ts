export interface PromptTemplateOptions {
  inputVariables: string[];
  template: string;
  templateFormat?: 'f-string' | 'jinja2';
  partialVariables?: Record<string, string>;
}

export class PromptTemplate {
  private inputVariables: string[];
  private template: string;
  private templateFormat: string;
  private partialVariables: Record<string, string>;

  constructor(options: PromptTemplateOptions) {
    this.inputVariables = options.inputVariables;
    this.template = options.template;
    this.templateFormat = options.templateFormat || 'f-string';
    this.partialVariables = options.partialVariables || {};
  }

  format(values: Record<string, any>): string {
    // Merge partial variables with provided values
    const allValues = { ...this.partialVariables, ...values };
    
    // Validate that all required variables are provided
    for (const variable of this.inputVariables) {
      if (!(variable in allValues)) {
        throw new Error(`Missing required variable: ${variable}`);
      }
    }
    
    // Format the template
    if (this.templateFormat === 'f-string') {
      return this.formatFString(allValues);
    } else if (this.templateFormat === 'jinja2') {
      return this.formatJinja2(allValues);
    }
    
    throw new Error(`Unsupported template format: ${this.templateFormat}`);
  }

  private formatFString(values: Record<string, any>): string {
    let formatted = this.template;
    
    // Replace {variable} with values
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      formatted = formatted.replace(pattern, String(value));
    }
    
    return formatted;
  }

  private formatJinja2(values: Record<string, any>): string {
    let formatted = this.template;
    
    // Simple jinja2-like replacement (not full implementation)
    // Replace {{ variable }} with values
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      formatted = formatted.replace(pattern, String(value));
    }
    
    return formatted;
  }

  partial(values: Record<string, string>): PromptTemplate {
    const newPartialVariables = { ...this.partialVariables, ...values };
    const newInputVariables = this.inputVariables.filter(
      v => !(v in newPartialVariables)
    );
    
    return new PromptTemplate({
      inputVariables: newInputVariables,
      template: this.template,
      templateFormat: this.templateFormat as any,
      partialVariables: newPartialVariables,
    });
  }

  static fromTemplate(template: string): PromptTemplate {
    // Extract variables from template
    const variables = new Set<string>();
    
    // Match {variable} pattern
    const fStringMatches = template.match(/\{(\w+)\}/g) || [];
    for (const match of fStringMatches) {
      variables.add(match.slice(1, -1));
    }
    
    // Match {{ variable }} pattern
    const jinjaMatches = template.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    for (const match of jinjaMatches) {
      const variable = match.replace(/\{\{|\}\}|\s/g, '');
      variables.add(variable);
    }
    
    return new PromptTemplate({
      inputVariables: Array.from(variables),
      template,
      templateFormat: jinjaMatches.length > 0 ? 'jinja2' : 'f-string',
    });
  }
}

export class ChatPromptTemplate {
  private systemTemplate?: PromptTemplate;
  private humanTemplate: PromptTemplate;
  private aiTemplate?: PromptTemplate;

  constructor(
    systemTemplate: string | undefined,
    humanTemplate: string,
    aiTemplate?: string
  ) {
    this.systemTemplate = systemTemplate 
      ? PromptTemplate.fromTemplate(systemTemplate)
      : undefined;
    this.humanTemplate = PromptTemplate.fromTemplate(humanTemplate);
    this.aiTemplate = aiTemplate 
      ? PromptTemplate.fromTemplate(aiTemplate)
      : undefined;
  }

  formatMessages(values: Record<string, any>): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    if (this.systemTemplate) {
      messages.push({
        role: 'system',
        content: this.systemTemplate.format(values),
      });
    }
    
    messages.push({
      role: 'user',
      content: this.humanTemplate.format(values),
    });
    
    if (this.aiTemplate) {
      messages.push({
        role: 'assistant',
        content: this.aiTemplate.format(values),
      });
    }
    
    return messages;
  }

  static fromMessages(messages: Array<[string, string]>): ChatPromptTemplate {
    let systemTemplate: string | undefined;
    let humanTemplate = '';
    let aiTemplate: string | undefined;
    
    for (const [role, template] of messages) {
      if (role === 'system') {
        systemTemplate = template;
      } else if (role === 'human' || role === 'user') {
        humanTemplate = template;
      } else if (role === 'ai' || role === 'assistant') {
        aiTemplate = template;
      }
    }
    
    return new ChatPromptTemplate(systemTemplate, humanTemplate, aiTemplate);
  }
}