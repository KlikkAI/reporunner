}

  // Resolve dot-notation paths: json.user.name
  private resolvePath(path: string): any
{
  const cleanPath = path.replace(/^\$/, ''); // Remove leading $
  const parts = cleanPath.split('.');

  let current: any = this.context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indexing: items[0]
    const arrayMatch = part.match(/^(.+)\[([0-9]+)\]$/);
    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      current = current[arrayName];
      if (Array.isArray(current)) {
        current = current[index];
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

// Extract variable references from expression content
private
extractVariableReferences(content: string)
: string[]
{
  const regex = /\$([a-zA-Z_][a-zA-Z0-9_.[\]]*)/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1]);
  }

  return [...new Set(variables)]; // Remove duplicates
}

// Serialize values for safe evaluation
private
serializeValue(value: any)
: string
{
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  return JSON.stringify(value);
}

// Safe evaluation with limited scope
private
safeEval(expression: string)
: any
{
  try {
    // Create a safe evaluation context
    const safeContext = {
      ...ExpressionFunctions,
      Math: Math,
      Date: Date,
      JSON: JSON,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: Number.isNaN,
      undefined: undefined,
      null: null,
    };

    // Create function with limited scope
    const func = new Function(...Object.keys(safeContext), `return ${expression}`);
    return func(...Object.values(safeContext));
  } catch (_error) {
    return expression;
  }
}

// Check if value is truthy for conditional evaluation
private
isTruthy(value: any)
: boolean
{
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

// Preprocess function calls for evaluation
private
preprocessFunctions(content: string)
: string
{
    // Replace method calls with function calls
    let processed = content;

    // Handle .toDate(), .toString(), etc.
    processed = processed.replace(/(\\$[a-zA-Z0-9_.]+)\\.toDate\\(\\)/g, 'new Date($1)');
