default:
return true;
}
  }

  private compareValues(value1: any, value2: any, ignoreCase = false): boolean
{
  if (ignoreCase && typeof value1 === 'string' && typeof value2 === 'string') {
    return value1.toLowerCase() === value2.toLowerCase();
  }
  return value1 === value2;
}

private
evaluateValidationRules(
    property: EnhancedNodeProperty,
    currentValue: PropertyValue,
    evaluation: EnhancedPropertyEvaluation
  )
: EnhancedPropertyEvaluation
{
  if (!property.validation) {
    return evaluation;
  }

  for (const rule of property.validation) {
    const error = this.validateRule(rule, currentValue, property);
    if (error) {
      evaluation.error = error;
      break; // Stop at first error
    }
  }

  return evaluation;
}

private
validateRule(
    rule: ValidationRule,
    value: PropertyValue,
    property: EnhancedNodeProperty
  )
: string | null
{
  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return rule.message || `${property.displayName || property.name} is required`;
      }
      break;

    case 'minLength':
      if (typeof value === 'string' && value.length < (rule.value || 0)) {
        return rule.message || `Minimum length is ${rule.value}`;
      }
      break;

    case 'maxLength':
      if (typeof value === 'string' && value.length > (rule.value || Infinity)) {
        return rule.message || `Maximum length is ${rule.value}`;
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return rule.message || 'Invalid format';
        }
      }
      break;

    case 'custom':
      if (rule.validator && !rule.validator(value, this.formState)) {
        return rule.message || 'Validation failed';
      }
      break;
  }

  return null;
}

private
generateAISuggestion(
    property: EnhancedNodeProperty,
    currentValue: PropertyValue
  )
: string | undefined
{
    // Generate contextual AI suggestions based on property type and current value
    if (!property.aiPrompt && !currentValue) {
      // Generate default suggestions based on property type
      switch (property.type) {
        case 'string':
          if (property.name.toLowerCase().includes('prompt')) {
            return 'Try: "Analyze the following data and provide insights..."';
          }
          if (property.name.toLowerCase().includes('subject')) {
            return 'Try: "Important update from your workflow"';
          }
          if (property.name.toLowerCase().includes('message')) {
            return 'Try: "Here are the results from your automation..."';
          }
          break;

        case 'select':
          if (property.options && property.options.length > 0) {
            const firstOption = property.options[0];
            return `Suggested: ${typeof firstOption === 'object' ? firstOption.value : firstOption}`;
          }
