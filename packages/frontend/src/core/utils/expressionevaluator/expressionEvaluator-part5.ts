processed = processed.replace(/(\\$[a-zA-Z0-9_.]+)\\.toString\\(\\)/g, 'String($1)');
processed = processed.replace(/(\\$[a-zA-Z0-9_.]+)\\.toNumber\\(\\)/g, 'Number($1)');

return processed;
}

  // Batch evaluate multiple expressions
  evaluateObject(obj: any): any
{
  if (typeof obj === 'string' && ExpressionEvaluator.isExpression(obj)) {
    return this.evaluate(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => this.evaluateObject(item));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.evaluateObject(value);
    }
    return result;
  }

  return obj;
}
}

// Utility functions for expression handling
class ExpressionUtils {
  // Check if a string contains expressions
  static hasExpressions(value: any): boolean {
    return typeof value === 'string' && ExpressionEvaluator.isExpression(value);
  }

  // Extract all variable names used in expressions
  static extractVariables(expressions: string[]): string[] {
    const variables = new Set<string>();

    for (const expr of expressions) {
      if (ExpressionEvaluator.isExpression(expr)) {
        const content = ExpressionEvaluator.extractExpressionContent(expr);
        const regex = /\\$([a-zA-Z_][a-zA-Z0-9_.]*)/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
          variables.add(match[1]);
        }
      }
    }

    return Array.from(variables);
  }

  // Validate expression syntax
  static validateExpression(expression: string): {
    valid: boolean;
    error?: string;
  } {
    if (!ExpressionEvaluator.isExpression(expression)) {
      return { valid: true };
    }

    try {
      const content = ExpressionEvaluator.extractExpressionContent(expression);

      // Basic syntax validation
      if (content.includes('{{') || content.includes('}}')) {
        return { valid: false, error: 'Nested expressions are not allowed' };
      }

      // Check for balanced parentheses
      let parentheses = 0;
      for (const char of content) {
        if (char === '(') parentheses++;
        if (char === ')') parentheses--;
        if (parentheses < 0) {
          return { valid: false, error: 'Unmatched closing parenthesis' };
        }
      }

      if (parentheses !== 0) {
        return { valid: false, error: 'Unmatched opening parenthesis' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Get expression suggestions based on available context
  static getExpressionSuggestions(context: IExpressionContext): Array<{
    label: string;
    value: string;
    description: string;
    type: string;
