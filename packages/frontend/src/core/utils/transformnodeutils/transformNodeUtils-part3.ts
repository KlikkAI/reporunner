}

  static applyInputFieldInclusion(
    inputData: any,
    includeMode: 'all' | 'none' | 'selected' | 'except',
    selectedFields: string[] = []
  ): any
{
  switch (includeMode) {
    case 'all':
      return { ...inputData };

    case 'none':
      return {};

    case 'selected': {
      const selectedData: any = {};
      selectedFields.forEach((fieldPath) => {
        if (NestedObjectUtils.hasNestedPath(inputData, fieldPath)) {
          NestedObjectUtils.setNestedValue(
            selectedData,
            fieldPath,
            NestedObjectUtils.getNestedValue(inputData, fieldPath)
          );
        }
      });
      return selectedData;
    }

    case 'except': {
      const exceptData = { ...inputData };
      selectedFields.forEach((fieldPath) => {
        NestedObjectUtils.deleteNestedValue(exceptData, fieldPath);
      });
      return exceptData;
    }

    default:
      return { ...inputData };
  }
}
}

// Expression evaluation utilities (placeholder for future implementation)
class TransformExpressionEvaluator {
  static evaluateExpression(expression: string, _context: any): any {
    // Placeholder for expression evaluation
    // In a full implementation, this would parse and evaluate expressions like:
    // "{{ $json.field1 + $json.field2 }}"
    // "{{ $json.name.toUpperCase() }}"

    // For now, return the expression as-is
    // TODO: Implement proper expression evaluation
    return expression;
  }

  static isExpression(value: string): boolean {
    return typeof value === 'string' && value.includes('{{') && value.includes('}}');
  }

  static extractExpressionVariables(expression: string): string[] {
    // Extract variable references from expressions
    const matches = expression.match(/\{\{\s*\$json\.([a-zA-Z0-9_.]+)\s*\}\}/g);
    if (!matches) return [];

    return matches.map((match) => {
      const variable = match.replace(/\{\{\s*\$json\./, '').replace(/\s*\}\}/, '');
      return variable;
    });
  }
}

// Configuration validation utilities
class ConfigurationValidator {
  static validateTransformConfiguration(parameters: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const mode = parameters.mode || 'manual';

    if (mode === 'manual') {
      // Validate assignments
      const assignments = parameters.assignments?.values || [];
      assignments.forEach((assignment: any, index: number) => {
        if (!assignment.name?.trim()) {
          errors.push(`Assignment ${index + 1}: Field name is required`);
        }

        if (assignment.name?.includes('..')) {
          errors.push(`Assignment ${index + 1}: Invalid dot notation syntax`);
        }

        if (!assignment.type) {
          errors.push(`Assignment ${index + 1}: Field type is required`);
        }
      });

      // Check for duplicate field names
      const fieldNames = assignments.map((a: any) => a.name).filter((name: string) => name?.trim());
      const uniqueNames = new Set(fieldNames);
