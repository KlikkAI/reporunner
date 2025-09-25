expectedValue: rule.value, actualValue;
: fieldValue,
          matched: conditionMet,
        })

// Return immediately if condition is met (first match wins)
if (conditionMet) {
  return {
            matchedRule: rule.id,
            outputPath: rule.outputName,
            conditionMet: true,
            field: rule.field,
            actualValue: fieldValue,
            expectedValue: rule.value,
            operator: rule.operator,
            allResults: results,
            executionFlow: 'condition_met',
          };
}
} catch (error: any)
{
  logger.error(`Error evaluating rule ${rule.id}:`, error);
  results.push({
    ruleId: rule.id,
    outputName: rule.outputName,
    matched: false,
    field: rule.field,
    operator: rule.operator,
    expectedValue: rule.value,
    actualValue: undefined,
    error: error.message,
  });
}
}

// No conditions matched, use default output
return {
      matchedRule: null,
      outputPath: defaultOutput,
      conditionMet: false,
      allResults: results,
      executionFlow: 'default_path',
      message: `No conditions matched, using default output: ${defaultOutput}`,
    };
}

  /**
   * Get field value from inputs using dot notation path
   */
  private getFieldValue(inputs: Record<string, any>, fieldPath: string): any
{
  if (!fieldPath || !inputs) {
    return undefined;
  }

  try {
    const pathParts = fieldPath.split('.');
    let currentValue = inputs;

    for (let i = 0; i < pathParts.length; i++) {
      const key = pathParts[i];

      if (currentValue === null || currentValue === undefined) {
        return undefined;
      }

      // Handle array index notation (e.g., "messages.0" or "emails[1]")
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
        const index = parseInt(indexStr, 10);

        if (arrayKey && !Number.isNaN(index)) {
          currentValue = currentValue[arrayKey]?.[index];
        }
      } else {
        currentValue = currentValue[key];
      }

      // If we hit a JSON string and there are more path parts, try to parse it
      if (typeof currentValue === 'string' && i < pathParts.length - 1) {
        const parsed = this.tryParseJsonString(currentValue);
        if (parsed !== null) {
          currentValue = parsed;
          // Continue with the remaining path parts in the parsed object
          const remainingPath = pathParts.slice(i + 1).join('.');
          return this.getFieldValue({ parsed: currentValue }, `parsed.${remainingPath}`);
        }
      }
    }

    return currentValue;
  } catch (error) {
    logger.warn(`Error accessing field path: ${fieldPath}`, error);
    return undefined;
  }
}

/**
 * Try to parse a JSON string
 */
private
tryParseJsonString(str: string)
: any
{
