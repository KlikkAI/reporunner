// Check cache first
if (this.validationCache.has(cacheKey)) {
  return this.validationCache.get(cacheKey)!;
}

const evaluation = this.performEvaluation(property);
this.validationCache.set(cacheKey, evaluation);

return evaluation;
}

  /**
   * Evaluate multiple properties and resolve dependencies
   */
  evaluateProperties(properties: EnhancedNodeProperty[]): Map<string, EnhancedPropertyEvaluation>
{
  this.buildDependencyGraph(properties);
  const results = new Map<string, EnhancedPropertyEvaluation>();

  // Sort properties by dependency order
  const sortedProperties = this.topologicalSort(properties);

  for (const property of sortedProperties) {
    const evaluation = this.evaluateProperty(property);
    results.set(property.name, evaluation);

    // Update form state if property has a default value
    if (evaluation.defaultValue !== undefined && this.formState[property.name] === undefined) {
      this.formState[property.name] = evaluation.defaultValue;
    }
  }

  return results;
}

/**
 * Validate all properties and return error summary
 */
async;
validateAllProperties(properties: EnhancedNodeProperty[])
: Promise<
{
  isValid: boolean;
  errors: Map<string, string>;
  warnings: Map<string, string>;
}
>
{
  const errors = new Map<string, string>();
  const warnings = new Map<string, string>();

  for (const property of properties) {
    const evaluation = this.evaluateProperty(property);

    if (evaluation.error) {
      errors.set(property.name, evaluation.error);
    }

    if (evaluation.warning) {
      warnings.set(property.name, evaluation.warning);
    }

    // Async validation removed to align with base types
  }

  return {
      isValid: errors.size === 0,
      errors,
      warnings,
    };
}

/**
 * Get properties that depend on a specific property
 */
getDependentProperties(propertyName: string)
: string[]
{
  return Array.from(this.dependencyGraph.get(propertyName) || []);
}

/**
 * Clear validation cache (call when form state changes)
 */
clearCache();
: void
{
  this.validationCache.clear();
}

/**
 * Update form state and invalidate cache
 */
updateFormState(updates: Partial<PropertyFormState>)
: void
{
  this.formState = { ...this.formState, ...updates };
  this.clearCache();
}

private
performEvaluation(property: EnhancedNodeProperty)
: EnhancedPropertyEvaluation
{
    const currentValue = this.formState[property.name];

    // Start with default evaluation
    let evaluation: EnhancedPropertyEvaluation = {
      visible: true,
      disabled: false,
      required: property.required || false,
    };

// Evaluate display conditions
