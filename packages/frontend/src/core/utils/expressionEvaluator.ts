/**
 * Expression Evaluator
 * 
 * Safely evaluates JavaScript expressions in node properties
 */

export interface ExpressionContext {
  [key: string]: any;
}

export interface ExpressionResult {
  success: boolean;
  value: any;
  error?: string;
}

class ExpressionEvaluator {
  /**
   * Evaluate a JavaScript expression safely
   */
  evaluate(expression: string, context: ExpressionContext = {}): ExpressionResult {
    try {
      // Basic security check - prevent dangerous operations
      if (this.containsDangerousOperations(expression)) {
        return {
          success: false,
          value: null,
          error: 'Expression contains potentially unsafe operations',
        };
      }

      // Create a safe evaluation context
      const safeContext = this.createSafeContext(context);
      
      // Evaluate the expression
      const func = new Function(...Object.keys(safeContext), `return ${expression}`);
      const value = func(...Object.values(safeContext));

      return {
        success: true,
        value,
      };
    } catch (error) {
      return {
        success: false,
        value: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if expression contains dangerous operations
   */
  private containsDangerousOperations(expression: string): boolean {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /require\s*\(/,
      /import\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./,
    ];

    return dangerousPatterns.some(pattern => pattern.test(expression));
  }

  /**
   * Create a safe evaluation context
   */
  private createSafeContext(context: ExpressionContext): ExpressionContext {
    // Remove potentially dangerous properties
    const safeContext = { ...context };
    delete safeContext.eval;
    delete safeContext.Function;
    delete safeContext.setTimeout;
    delete safeContext.setInterval;
    delete safeContext.require;
    delete safeContext.import;
    delete safeContext.process;
    delete safeContext.global;
    delete safeContext.window;
    delete safeContext.document;

    // Add safe utility functions
    safeContext.Math = Math;
    safeContext.JSON = JSON;
    safeContext.Date = Date;
    safeContext.String = String;
    safeContext.Number = Number;
    safeContext.Boolean = Boolean;
    safeContext.Array = Array;
    safeContext.Object = Object;

    return safeContext;
  }

  /**
   * Validate an expression syntax
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      new Function(`return ${expression}`);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid expression',
      };
    }
  }
}

export const expressionEvaluator = new ExpressionEvaluator();