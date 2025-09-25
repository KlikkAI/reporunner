return {
          valid: true,
          value: this.getDefaultValue(targetType),
          originalValue,
          type: targetType,
          warnings: [
            `Conversion failed, using default value: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
}

return {
        valid: false,
        value: originalValue,
        originalValue,
        type: targetType,
        error: error instanceof Error ? error.message : String(error),
      };
}
  }

  convertToType(value: any, targetType: string): any
{
  switch (targetType) {
    case FieldType.STRING:
      return this.convertToString(value);

    case FieldType.NUMBER:
      return this.convertToNumber(value);

    case FieldType.BOOLEAN:
      return this.convertToBoolean(value);

    case FieldType.ARRAY:
      return this.convertToArray(value);

    case FieldType.OBJECT:
      return this.convertToObject(value);

    case FieldType.DATE:
      return this.convertToDate(value);

    case FieldType.NULL:
      return null;

    case FieldType.UNDEFINED:
      return undefined;

    default:
      return value;
  }
}

private
convertToString(value: any)
: string
{
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

private
convertToNumber(value: any)
: number
{
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    // Handle different number formats
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);

    if (Number.isNaN(parsed)) {
      throw new Error(`Cannot convert "${value}" to number`);
    }

    return parsed;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to number`);
  }

  return parsed;
}
