private
convertToBoolean(value: any)
: boolean
{
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    const truthyStrings = ['true', '1', 'yes', 'on', 'enabled'];
    const falsyStrings = ['false', '0', 'no', 'off', 'disabled', ''];

    if (truthyStrings.includes(lower)) return true;
    if (falsyStrings.includes(lower)) return false;

    // For other strings, check if empty
    return lower !== '';
  }

  return Boolean(value);
}

private
convertToArray(value: any)
: any[]
{
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If JSON parsing fails, split by comma
      return value.split(',').map((item) => item.trim());
    }
  }

  if (value === null || value === undefined) {
    return [];
  }

  // Wrap single values in array
  return [value];
}

private
convertToObject(value: any)
: object
{
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If parsing fails, create object with value property
      return { value };
    }
  }

  // For other types, wrap in object
  return { value };
}

private
convertToDate(value: any)
: Date
{
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Cannot convert "${value}" to date`);
    }
    return parsed;
  }

  throw new Error(`Cannot convert ${typeof value} to date`);
}

private
validateConvertedValue(
    value: any,
    targetType: string
  )
:
{
  valid: boolean;
  error?: string;
  warnings?: string[]
}
{
