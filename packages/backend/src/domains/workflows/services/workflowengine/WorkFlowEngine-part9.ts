if (typeof str !== 'string') return null;

let cleanStr = str.trim();

// Handle markdown-wrapped JSON (```json ... ```)
if (cleanStr.includes('```json')) {
  const jsonMatch = cleanStr.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleanStr = jsonMatch[1].trim();
  }
}
// Handle code-wrapped JSON (``` ... ```)
else if (cleanStr.startsWith('```') && cleanStr.endsWith('```')) {
  cleanStr = cleanStr.slice(3, -3).trim();
}

// Check if it looks like JSON
if (
  (cleanStr.startsWith('{') && cleanStr.endsWith('}')) ||
  (cleanStr.startsWith('[') && cleanStr.endsWith(']'))
) {
  try {
    return JSON.parse(cleanStr);
  } catch {
    return null;
  }
}

return null;
}

  /**
   * Evaluate condition with comprehensive operator support
   */
  private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean
{
    try {
      // Handle null/undefined field values
      if (fieldValue === null || fieldValue === undefined) {
        switch (operator) {
          case 'is_empty':
          case 'is_null':
            return true;
          case 'is_not_empty':
            return false;
          default:
            return false;
        }
      }

      // Type-aware comparisons
      switch (operator) {
        case 'equals':
          // Handle different types intelligently
          if (typeof fieldValue === typeof compareValue) {
            return fieldValue === compareValue;
          }
          // Loose equality for mixed types
          return fieldValue === compareValue;

        case 'not_equals':
          if (typeof fieldValue === typeof compareValue) {
            return fieldValue !== compareValue;
          }
          return fieldValue !== compareValue;

        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(compareValue);
          }
          return String(fieldValue).includes(String(compareValue));

        case 'not_contains':
          if (Array.isArray(fieldValue)) {
            return !fieldValue.includes(compareValue);
          }
          return !String(fieldValue).includes(String(compareValue));

        case 'starts_with':
          return String(fieldValue).startsWith(String(compareValue));

        case 'ends_with':
          return String(fieldValue).endsWith(String(compareValue));

        case 'greater':
        case 'greater_equal': {
          const numField = Number(fieldValue);
          const numCompare = Number(compareValue);
          if (Number.isNaN(numField) || Number.isNaN(numCompare)) return false;
          return operator === 'greater' ? numField > numCompare : numField >= numCompare;
        }

        case 'less':
        case 'less_equal': {
          const numField2 = Number(fieldValue);
          const numCompare2 = Number(compareValue);
          if (Number.isNaN(numField2) || Number.isNaN(numCompare2)) return false;
          return operator === 'less' ? numField2 < numCompare2 : numField2 <= numCompare2;
        }

        case 'between':
