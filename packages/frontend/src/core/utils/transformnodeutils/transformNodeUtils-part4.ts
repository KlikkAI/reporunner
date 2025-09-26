if (fieldNames.length !== uniqueNames.size) {
  errors.push('Duplicate field names are not allowed');
}

// Validate selected fields if needed
const includeInputFields = parameters.includeInputFields;
const selectedInputFields = parameters.selectedInputFields;
if (
  (includeInputFields === 'selected' || includeInputFields === 'except') &&
  !selectedInputFields?.trim()
) {
  errors.push('Selected input fields list is required for this inclusion mode');
}
} else
if (mode === 'json') {
  // Validate JSON syntax
  const jsonObject = parameters.jsonObject;
  if (jsonObject) {
    try {
      JSON.parse(jsonObject);
    } catch (_e) {
      errors.push('Invalid JSON syntax in JSON Object');
    }
  }
}

return {
      valid: errors.length === 0,
      errors,
    };
}
}

// Performance optimization utilities
class TransformPerformanceUtils {
  static shouldUseBulkProcessing(itemCount: number): boolean {
    return itemCount > 1000;
  }

  static chunkArray<T>(array: T[], chunkSize: number = 100): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static async processInChunks<T, R>(
    items: T[],
    processor: (item: T, index: number) => R,
    chunkSize: number = 100
  ): Promise<R[]> {
    const chunks = TransformPerformanceUtils.chunkArray(items, chunkSize);
    const results: R[] = [];

    for (const chunk of chunks) {
      const chunkResults = chunk.map(processor);
      results.push(...chunkResults);

      // Allow other tasks to run between chunks
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }
}

// Export all utilities
export {
  type TransformTypeValidator,
  type NestedObjectUtils,
  type InputFieldManager,
  type TransformExpressionEvaluator,
  type ConfigurationValidator,
  TransformPerformanceUtils,
};
