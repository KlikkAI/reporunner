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
): string | null {
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
          if (isNaN(numValue)) {
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
      if (!Array.isArray(value)) {
        return `${displayName} must be an array`;
      }
      if (property.options) {
        const validOptions = property.options.map((opt) => opt.value);
        const invalidValues = (value as any[]).filter((v) => !validOptions.includes(v));
        if (invalidValues.length > 0) {
          return `${displayName} contains invalid options: ${invalidValues.join(', ')}`;
        }
      }
      break;
  }

  return null;
}

/**
 * Evaluates all conditions for a property and returns complete evaluation result
 */
export function evaluateProperty(
  property: NodeProperty,
  context: PropertyEvaluationContext
): ConditionalPropertyResult {
  const { visible, disabled } = evaluateDisplayOptions(property.displayOptions, context);
  const currentValue = context.formState[property.name];
  validateProperty(property, currentValue, context);

  // Evaluate dynamic options if needed
  let options = property.options;
  if (property.typeOptions?.loadOptionsMethod) {
    // This would trigger dynamic option loading
    // For now, return the static options
    options = property.options;
  }

  return {
    visible,
    disabled,
    required: property.required || false,
    options,
  };
}

/**
 * Gets the default value for a property based on its type and configuration
 */
export function getPropertyDefaultValue(property: NodeProperty): PropertyValue {
  if (property.default !== undefined && property.default !== null) {
    return property.default as PropertyValue;
  }

  switch (property.type) {
    case 'string':
    case 'text':
    case 'expression':
      return '';
    case 'number':
      return property.min || 0;
    case 'boolean':
      return false;
    case 'select':
      return property.options?.[0]?.value || '';
    case 'multiSelect':
      return [];
    case 'collection':
    case 'fixedCollection':
      return property.typeOptions?.multipleValues ? [] : {};
    case 'json':
      return '{}';
    case 'dateTime':
      return new Date().toISOString();
    case 'color':
      return '#000000';
    default:
      return null;
  }
}

/**
 * Initializes form state for a set of properties
 */
export function initializeFormState(properties: NodeProperty[]): PropertyFormState {
  const formState: PropertyFormState = {};

  for (const property of properties) {
    formState[property.name] = getPropertyDefaultValue(property);
  }

  return formState;
}

/**
 * Filters visible properties based on current form state
 */
export function getVisibleProperties(
  properties: NodeProperty[],
  context: PropertyEvaluationContext
): NodeProperty[] {
  return properties.filter((property) => {
    const { visible } = evaluateDisplayOptions(property.displayOptions, context);
    return visible;
  });
}

/**
 * Gets all validation errors for the current form state
 */
export function validateFormState(
  properties: NodeProperty[],
  context: PropertyEvaluationContext
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const property of properties) {
    const { visible } = evaluateDisplayOptions(property.displayOptions, context);
    if (!visible) continue;

    const value = context.formState[property.name];
    const { errors: propertyErrors } = validateProperty(property, value, context);

    if (propertyErrors.length > 0) {
      errors[property.name] = propertyErrors;
    }
  }

  return errors;
}

/**
 * Checks if the entire form is valid
 */
export function isFormValid(
  properties: NodeProperty[],
  context: PropertyEvaluationContext
): boolean {
  const errors = validateFormState(properties, context);
  return Object.keys(errors).length === 0;
}

/**
 * Creates property evaluation context for node configuration
 */
export function createPropertyContext(
  nodeType: string,
  parameters: Record<string, any>,
  credentials?: any,
  workflow?: any
): Record<string, any> {
  return {
    nodeType,
    parameters,
    credentials,
    workflow,
    // Add runtime context variables
    $now: new Date().toISOString(),
    $timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    $env: 'development', // Could be configured
  };
}
