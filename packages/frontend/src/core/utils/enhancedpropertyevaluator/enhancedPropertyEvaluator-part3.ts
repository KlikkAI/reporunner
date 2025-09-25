evaluation = this.evaluateDisplayConditions(property, evaluation);

// Evaluate validation rules
evaluation = this.evaluateValidationRules(property, currentValue, evaluation);

// Generate AI suggestions if enabled
if (property.aiSuggestions) {
  evaluation.suggestion = this.generateAISuggestion(property, currentValue);
}

// Calculate default value if needed
if (currentValue === undefined || currentValue === null) {
  evaluation.defaultValue = this.calculateDefaultValue(property);
}

return evaluation;
}

  private evaluateDisplayConditions(
    property: EnhancedNodeProperty,
    evaluation: EnhancedPropertyEvaluation
  ): EnhancedPropertyEvaluation
{
  const displayOptions = property.displayOptions;

  if (!displayOptions) {
    return evaluation;
  }

  // Evaluate show conditions
  if (displayOptions.show) {
    evaluation.visible = this.evaluateDependencies(displayOptions.show);
  }

  // Evaluate hide conditions
  if (displayOptions.hide) {
    const shouldHide = this.evaluateDependencies(displayOptions.hide);
    if (shouldHide) {
      evaluation.visible = false;
    }
  }

  // Evaluate enable conditions
  if (displayOptions.enable) {
    evaluation.disabled = !this.evaluateDependencies(displayOptions.enable);
  }

  // Evaluate disable conditions
  if (displayOptions.disable) {
    const shouldDisable = this.evaluateDependencies(displayOptions.disable);
    if (shouldDisable) {
      evaluation.disabled = true;
    }
  }

  return evaluation;
}

private
evaluateDependencies(dependencies: PropertyDependency[])
: boolean
{
  return dependencies.every((dep) => this.evaluateDependency(dep));
}

private
evaluateDependency(dependency: PropertyDependency)
: boolean
{
    const currentValue = this.formState[dependency.property];

    switch (dependency.operator) {
      case 'equals':
        return this.compareValues(currentValue, dependency.value, dependency.ignoreCase);

      case 'notEquals':
        return !this.compareValues(currentValue, dependency.value, dependency.ignoreCase);

      case 'in':
        return (
          Array.isArray(dependency.value) &&
          dependency.value.some((val) =>
            this.compareValues(currentValue, val, dependency.ignoreCase)
          )
        );

      case 'notIn':
        return (
          !Array.isArray(dependency.value) ||
          !dependency.value.some((val) =>
            this.compareValues(currentValue, val, dependency.ignoreCase)
          )
        );

      case 'exists':
        return currentValue !== undefined && currentValue !== null;

      case 'empty':
        return currentValue === undefined || currentValue === null || currentValue === '';

      case 'regex':
        if (typeof dependency.value === 'string' && typeof currentValue === 'string') {
          const regex = new RegExp(dependency.value, dependency.ignoreCase ? 'i' : '');
          return regex.test(currentValue);
        }
        return false;
