errors,
}
}

  private extractAssignmentValue(assignment: IAssignmentValue): any
{
  // For backward compatibility with the enhanced assignment structure
  switch (assignment.type) {
    case 'stringValue':
      return assignment.value;
    case 'numberValue':
      return assignment.value;
    case 'booleanValue':
      return assignment.value;
    case 'arrayValue':
      return assignment.value;
    case 'objectValue':
      return assignment.value;
    default:
      return assignment.value;
  }
}
}

// Batch Validation for Performance
class BatchTypeValidator {
  private typeValidator: AdvancedTypeValidator;

  constructor(options?: ITypeConversionOptions) {
    this.typeValidator = new AdvancedTypeValidator(options);
  }

  async validateBatch(
    items: Array<{ value: any; type: string; id: string }>,
    context?: IExpressionContext,
    batchSize: number = 100
  ): Promise<Map<string, ITypeValidationResult>> {
    const results = new Map<string, ITypeValidationResult>();

    // Process in batches to avoid blocking UI
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = batch.map((item) => ({
        id: item.id,
        result: this.typeValidator.validate(item.value, item.type, context),
      }));

      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Yield control to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }
}

// Type Compatibility Checker
class TypeCompatibilityChecker {
  static isCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === targetType) return true;

    const compatibilityMatrix: Record<string, string[]> = {
      [FieldType.STRING]: [FieldType.NUMBER, FieldType.BOOLEAN, FieldType.DATE],
      [FieldType.NUMBER]: [FieldType.STRING, FieldType.BOOLEAN],
      [FieldType.BOOLEAN]: [FieldType.STRING, FieldType.NUMBER],
      [FieldType.DATE]: [FieldType.STRING, FieldType.NUMBER],
      [FieldType.ARRAY]: [FieldType.STRING],
      [FieldType.OBJECT]: [FieldType.STRING],
      [FieldType.NULL]: [FieldType.STRING],
      [FieldType.UNDEFINED]: [FieldType.STRING],
    };

    return compatibilityMatrix[sourceType]?.includes(targetType) ?? false;
  }

  static getConversionRisk(sourceType: string, targetType: string): 'low' | 'medium' | 'high' {
    if (sourceType === targetType) return 'low';

    const lowRiskConversions = [
      [FieldType.STRING, FieldType.NUMBER],
      [FieldType.NUMBER, FieldType.STRING],
      [FieldType.BOOLEAN, FieldType.STRING],
    ];

    const mediumRiskConversions = [
      [FieldType.STRING, FieldType.BOOLEAN],
      [FieldType.STRING, FieldType.DATE],
      [FieldType.ARRAY, FieldType.STRING],
      [FieldType.OBJECT, FieldType.STRING],
    ];

    // Conversion key for future extensibility
    // const _conversionKey = [sourceType, targetType];

    if (lowRiskConversions.some(([s, t]) => s === sourceType && t === targetType)) {
      return 'low';
    }
