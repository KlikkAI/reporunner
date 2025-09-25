details: errors,
},
      })
return;
}

    // Attach validated data to request
    (req as any).validated = validatedData
next()
}
}

/**
 * Validate type of value
 */
function validateType(value: any, type?: string): string | null {
  if (!type) return null;

  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return `Expected string, got ${typeof value}`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return `Expected number, got ${typeof value}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return `Expected boolean, got ${typeof value}`;
      }
      break;

    case 'email':
      if (!validator.isEmail(value)) {
        return 'Invalid email address';
      }
      break;

    case 'url':
      if (!validator.isURL(value)) {
        return 'Invalid URL';
      }
      break;

    case 'uuid':
      if (!validator.isUUID(value)) {
        return 'Invalid UUID';
      }
      break;

    case 'json':
      try {
        JSON.parse(value);
      } catch {
        return 'Invalid JSON';
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return 'Expected array';
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return 'Expected object';
      }
      break;
  }

  return null;
}

/**
 * Validate constraints
 */
function validateConstraints(value: any, rule: ValidationRule): string[] {
  const errors: string[] = [];

  // Min/Max for numbers
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`Value must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`Value must be at most ${rule.max}`);
    }
  }

  // Length for strings and arrays
  if (typeof value === 'string' || Array.isArray(value)) {
    const length = value.length;
    if (rule.minLength !== undefined && length < rule.minLength) {
      errors.push(`Length must be at least ${rule.minLength}`);
