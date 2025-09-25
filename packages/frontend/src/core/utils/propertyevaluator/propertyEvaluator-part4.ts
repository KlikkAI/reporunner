return visible;
})
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
