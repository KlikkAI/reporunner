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
