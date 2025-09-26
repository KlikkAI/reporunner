}>
{
  const suggestions = [];

  // Add $json field suggestions
  if (context.$json) {
    Object.keys(context.$json).forEach((key) => {
      suggestions.push({
        label: `$json.${key}`,
        value: `{{ $json.${key} }}`,
        description: `Access ${key} field from input data`,
        type: 'field',
      });
    });
  }

  // Add built-in functions
  suggestions.push(
    {
      label: 'now()',
      value: '{{ now() }}',
      description: 'Current date and time',
      type: 'function',
    },
    {
      label: 'today()',
      value: '{{ today() }}',
      description: 'Current date (no time)',
      type: 'function',
    },
    {
      label: 'trim()',
      value: '{{ trim($json.field) }}',
      description: 'Remove whitespace',
      type: 'function',
    },
    {
      label: 'upper()',
      value: '{{ upper($json.field) }}',
      description: 'Convert to uppercase',
      type: 'function',
    },
    {
      label: 'lower()',
      value: '{{ lower($json.field) }}',
      description: 'Convert to lowercase',
      type: 'function',
    }
  );

  return suggestions;
}
}

// Export everything
export type { ExpressionEvaluator, ExpressionFunctions, ExpressionUtils, ExpressionType };
