): string | null
{
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return rule.message || `${displayName} is required`;
      }
      break;

    case 'minLength':
      if (
        typeof value === 'string' &&
        typeof rule.value === 'number' &&
        value.length < rule.value
      ) {
        return rule.message || `${displayName} must be at least ${rule.value} characters`;
      }
      break;

    case 'maxLength':
      if (
        typeof value === 'string' &&
        typeof rule.value === 'number' &&
        value.length > rule.value
      ) {
        return rule.message || `${displayName} must be no more than ${rule.value} characters`;
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return rule.message || `${displayName} format is invalid`;
        }
      }
      break;

    case 'custom':
      // Custom validation would be handled by external validators
      break;
  }

  return null;
}

/**
 * Validates property value against its type constraints
 */
function validatePropertyType(property: NodeProperty, value: PropertyValue): string | null {
  const { type, min, max, displayName } = property;

  switch (type) {
    case 'number':
      if (typeof value !== 'number') {
        try {
          const numValue = Number(value);
          if (Number.isNaN(numValue)) {
            return `${displayName} must be a valid number`;
          }
          value = numValue;
        } catch {
          return `${displayName} must be a valid number`;
        }
      }

      if (min !== undefined && (value as number) < min) {
        return `${displayName} must be at least ${min}`;
      }

      if (max !== undefined && (value as number) > max) {
        return `${displayName} must be no more than ${max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return `${displayName} must be true or false`;
      }
      break;

    case 'json':
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          return `${displayName} must be valid JSON`;
        }
      }
      break;

    case 'select':
      if (property.options) {
        const validOptions = property.options.map((opt) => opt.value);
        if (!validOptions.includes(value as any)) {
          return `${displayName} must be one of the allowed options`;
        }
      }
      break;

    case 'multiSelect':
