const warnings: string[] = [];

switch (targetType) {
  case FieldType.NUMBER:
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return { valid: false, error: 'Invalid number value' };
    }
    break;

  case FieldType.DATE:
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return { valid: false, error: 'Invalid date value' };
    }
    break;

  case FieldType.ARRAY:
    if (!Array.isArray(value)) {
      return { valid: false, error: 'Value is not an array' };
    }
    break;

  case FieldType.OBJECT:
    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
      return { valid: false, error: 'Value is not an object' };
    }
    break;
}

return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
}

  getDefaultValue(targetType: string): any
{
  const defaults: Record<string, any> = {
    [FieldType.STRING]: '',
    [FieldType.NUMBER]: 0,
    [FieldType.BOOLEAN]: false,
    [FieldType.ARRAY]: [],
    [FieldType.OBJECT]: {},
    [FieldType.DATE]: new Date(),
    [FieldType.NULL]: null,
    [FieldType.UNDEFINED]: undefined,
    [FieldType.BINARY]: Buffer.alloc(0),
    [FieldType.FUNCTION]: () => {},
  };

  return defaults[targetType] ?? null;
}
}

// Assignment Value Validator
class AssignmentValidator {
  private typeValidator: AdvancedTypeValidator;

  constructor(options?: ITypeConversionOptions) {
    this.typeValidator = new AdvancedTypeValidator(options);
  }

  validateAssignment(
    assignment: IAssignmentValue,
    context?: IExpressionContext
  ): ITypeValidationResult {
    // Extract the appropriate value based on type
    const value = this.extractAssignmentValue(assignment);

    // Validate and convert
    return this.typeValidator.validate(value, assignment.type || 'auto', context);
  }

  validateAssignments(
    assignments: IAssignmentValue[],
    context?: IExpressionContext
  ): {
    valid: boolean;
    results: Array<ITypeValidationResult & { fieldName: string }>;
    errors: string[];
  } {
    const results: Array<ITypeValidationResult & { fieldName: string }> = [];
    const errors: string[] = [];
    let allValid = true;

    for (const assignment of assignments) {
      const result = this.validateAssignment(assignment, context);

      results.push({
        ...result,
        fieldName: assignment.name,
      });

      if (!result.valid) {
        allValid = false;
        errors.push(`Field "${assignment.name}": ${result.error}`);
      }
    }

    return {
      valid: allValid,
      results,
