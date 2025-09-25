// Property Evaluation Utilities
// Handles conditional property display, validation, and dynamic option loading

import type {
  ConditionalPropertyResult,
  DisplayOptions,
  NodeProperty,
  PropertyEvaluationContext,
  PropertyFormState,
  PropertyValue,
  ValidationRule,
} from '../types/dynamicProperties';

/**
 * Evaluates display conditions for a property based on current form state
 */
export function evaluateDisplayOptions(
  displayOptions: DisplayOptions | undefined,
  context: PropertyEvaluationContext
): { visible: boolean; disabled: boolean } {
  if (!displayOptions) {
    return { visible: true, disabled: false };
  }

  const { formState } = context;
  let visible = true;
  const disabled = false;

  // Handle 'show' conditions
  if (displayOptions.show) {
    visible = false;
    for (const [propertyName, allowedValues] of Object.entries(displayOptions.show)) {
      const currentValue = formState[propertyName];
      if (allowedValues.includes(currentValue as any)) {
        visible = true;
        break;
      }
    }
  }

  // Handle 'hide' conditions
  if (displayOptions.hide && visible) {
    for (const [propertyName, hiddenValues] of Object.entries(displayOptions.hide)) {
      const currentValue = formState[propertyName];
      if (hiddenValues.includes(currentValue as any)) {
        visible = false;
        break;
      }
    }
  }

  return { visible, disabled };
}

/**
 * Validates a property value against its validation rules
 */
export function validateProperty(
  property: NodeProperty,
  value: PropertyValue,
  _context: PropertyEvaluationContext
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required validation
  if (property.required && (value === null || value === undefined || value === '')) {
    errors.push(`${property.displayName} is required`);
  }

  // Check custom validation rules
  if (property.validation && value !== null && value !== undefined) {
    for (const rule of property.validation) {
      const error = validateRule(rule, value, property.displayName);
      if (error) {
        errors.push(error);
      }
    }
  }

  // Type-specific validation
  if (value !== null && value !== undefined && value !== '') {
    const typeError = validatePropertyType(property, value);
    if (typeError) {
      errors.push(typeError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single validation rule
 */
function validateRule(
  rule: ValidationRule,
  value: PropertyValue,
  displayName: string
