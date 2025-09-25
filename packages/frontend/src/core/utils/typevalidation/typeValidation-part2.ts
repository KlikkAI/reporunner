// Common date patterns
const datePatterns = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, // ISO datetime
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, // ISO with Z
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
];

return datePatterns.some((pattern) => pattern.test(value)) && !Number.isNaN(Date.parse(value));
}

  static inferFromContext(value: any, context?: IExpressionContext): FieldType
{
  const basicType = TypeInferenceEngine.inferType(value);

  // If we have context, we can make smarter inferences
  if (context) {
    // Check if value looks like an expression
    if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      // Try to evaluate and infer from result
      try {
        const evaluator = new ExpressionEvaluator(context);
        const evaluated = evaluator.evaluate(value);
        return TypeInferenceEngine.inferType(evaluated);
      } catch {
        return basicType;
      }
    }
  }

  return basicType;
}

static
getCompatibleTypes(primaryType: FieldType)
: FieldType[]
{
  const compatibilityMap: Record<FieldType, FieldType[]> = {
    [FieldType.STRING]: [FieldType.STRING, FieldType.NUMBER, FieldType.BOOLEAN, FieldType.DATE],
    [FieldType.NUMBER]: [FieldType.NUMBER, FieldType.STRING, FieldType.BOOLEAN],
    [FieldType.BOOLEAN]: [FieldType.BOOLEAN, FieldType.STRING, FieldType.NUMBER],
    [FieldType.ARRAY]: [FieldType.ARRAY, FieldType.STRING],
    [FieldType.OBJECT]: [FieldType.OBJECT, FieldType.STRING],
    [FieldType.DATE]: [FieldType.DATE, FieldType.STRING, FieldType.NUMBER],
    [FieldType.NULL]: [FieldType.NULL, FieldType.STRING],
    [FieldType.UNDEFINED]: [FieldType.UNDEFINED, FieldType.STRING],
    [FieldType.BINARY]: [FieldType.BINARY, FieldType.STRING],
    [FieldType.FUNCTION]: [FieldType.FUNCTION, FieldType.STRING],
  };

  return compatibilityMap[primaryType] || [primaryType];
}
}

// Advanced Type Validator
class AdvancedTypeValidator {
  private options: ITypeConversionOptions;

  constructor(
    options: ITypeConversionOptions = {
      ignoreConversionErrors: false,
      strictMode: false,
    }
  ) {
    this.options = options;
  }

  validate(value: any, targetType: string, context?: IExpressionContext): ITypeValidationResult {
    const originalValue = value;
    let processedValue = value;

    // Handle expressions first
    if (context && typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      try {
        const evaluator = new ExpressionEvaluator(context);
        processedValue = evaluator.evaluate(value);
      } catch (error) {
        if (!this.options.ignoreConversionErrors) {
          return {
            valid: false,
            value: originalValue,
            originalValue,
            type: targetType,
            error: `Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    }

    try {
      const convertedValue = this.convertToType(processedValue, targetType);
      const validationResult = this.validateConvertedValue(convertedValue, targetType);

      return {
        valid: validationResult.valid,
        value: convertedValue,
        originalValue,
        type: targetType,
        error: validationResult.error,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      if (this.options.ignoreConversionErrors) {
