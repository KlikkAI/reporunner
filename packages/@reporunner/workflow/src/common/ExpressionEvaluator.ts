// Expression evaluator reusing patterns from workflow-engine
export class ExpressionEvaluator {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  evaluate(expression: string): any {
    if (!expression || typeof expression !== 'string') {
      return expression;
    }

    // Simple expression evaluation - placeholder implementation
    try {
      // Handle basic template literals
      if (expression.includes('{{') && expression.includes('}}')) {
        return this.evaluateTemplate(expression);
      }

      // Handle simple property access
      if (expression.startsWith('$')) {
        return this.evaluateProperty(expression);
      }

      return expression;
    } catch (_error) {
      return expression;
    }
  }

  private evaluateTemplate(expression: string): any {
    // Replace {{variable}} with context values
    return expression.replace(/\{\{(.+?)\}\}/g, (match, variable) => {
      const trimmed = variable.trim();
      return this.getContextValue(trimmed) || match;
    });
  }

  private evaluateProperty(expression: string): any {
    // Handle $node.property syntax
    const path = expression.substring(1); // Remove $
    return this.getContextValue(path);
  }

  private getContextValue(path: string): any {
    const keys = path.split('.');
    let result = this.context;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }

    return result;
  }

  setContext(context: Record<string, any>): void {
    this.context = context;
  }

  updateContext(updates: Record<string, any>): void {
    this.context = { ...this.context, ...updates };
  }
}
