}

  static min(...args: number[]): number
{
  return Math.min(...args);
}

static
max(...args: number[])
: number
{
  return Math.max(...args);
}

// Array Functions
static
first(arr: any[])
: any
{
  return Array.isArray(arr) ? arr[0] : arr;
}

static
last(arr: any[])
: any
{
  return Array.isArray(arr) ? arr[arr.length - 1] : arr;
}

static
sum(arr: number[])
: number
{
  return Array.isArray(arr) ? arr.reduce((sum, val) => sum + (Number(val) || 0), 0) : 0;
}

static
average(arr: number[])
: number
{
  return Array.isArray(arr) && arr.length > 0 ? ExpressionFunctions.sum(arr) / arr.length : 0;
}

// Object Functions
static
keys(obj: object)
: string[]
{
  return Object.keys(obj || {});
}

static
values(obj: object)
: any[]
{
  return Object.values(obj || {});
}

// Utility Functions
static
isEmpty(value: any)
: boolean
{
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

static
isNotEmpty(value: any)
: boolean
{
  return !ExpressionFunctions.isEmpty(value);
}

static
typeOf(value: any)
: string
{
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}
}

// Main Expression Evaluator Class
class ExpressionEvaluator {
  private context: IExpressionContext;

  constructor(context: IExpressionContext, options: IExpressionOptions = {}) {
    this.context = context;
    this._options = options;
  }

  // Detect expression type and patterns
  static detectExpressionType(expression: string): ExpressionType {
    if (!ExpressionEvaluator.isExpression(expression)) {
      return ExpressionType.STRING;
    }

    const content = ExpressionEvaluator.extractExpressionContent(expression);

    // Check for conditional (ternary) operator
    if (content.includes('?') && content.includes(':')) {
      return ExpressionType.CONDITIONAL;
    }

    // Check for function calls
    if (content.includes('(') && content.includes(')')) {
      return ExpressionType.FUNCTION_CALL;
    }

    // Check for operators (complex expressions)
    if (/[+\-*/%<>=!&|]/.test(content)) {
      return ExpressionType.COMPLEX;
    }

    // Simple field access
    return ExpressionType.SIMPLE;
  }

  static isExpression(value: string): boolean {
    return typeof value === 'string' && value.includes('{{') && value.includes('}}');
  }

  static extractExpressionContent(expression: string): string {
    const match = expression.match(/\{\{\s*(.*?)\s*\}\}/s);
    return match ? match[1] : expression;
  }
