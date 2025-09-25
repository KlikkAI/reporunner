const visited = new Set<string>();
const visiting = new Set<string>();
const result: EnhancedNodeProperty[] = [];
const propertyMap = new Map(properties.map((p) => [p.name, p]));

const visit = (propertyName: string) => {
  if (visiting.has(propertyName)) {
    // Circular dependency detected, skip for now
    return;
  }

  if (visited.has(propertyName)) {
    return;
  }

  visiting.add(propertyName);

  const dependencies = this.extractDependencies(propertyMap.get(propertyName)!);
  dependencies.forEach((dep) => {
    if (propertyMap.has(dep)) {
      visit(dep);
    }
  });

  visiting.delete(propertyName);
  visited.add(propertyName);

  const property = propertyMap.get(propertyName);
  if (property) {
    result.push(property);
  }
};

properties.forEach((property) => {
  if (!visited.has(property.name)) {
    visit(property.name);
  }
});

return result;
}

  private getCacheKey(property: EnhancedNodeProperty): string
{
  // Create a cache key that includes property name and relevant form state
  const dependencies = this.extractDependencies(property);
  const relevantState = dependencies.reduce(
    (acc, dep) => {
      acc[dep] = this.formState[dep];
      return acc;
    },
    {} as Record<string, any>
  );

  return `${property.name}:${JSON.stringify(relevantState)}`;
}
}

/**
 * Hook for using enhanced property evaluation in React components
 */
export function useEnhancedPropertyEvaluator(
  properties: EnhancedNodeProperty[],
  formState: PropertyFormState,
  executionContext: any = {}
) {
  const [evaluator] = React.useState(
    () => new EnhancedPropertyEvaluator(formState, executionContext)
  );
  const [evaluations, setEvaluations] = React.useState<Map<string, EnhancedPropertyEvaluation>>(
    new Map()
  );

  React.useEffect(() => {
    evaluator.updateFormState(formState);
    const newEvaluations = evaluator.evaluateProperties(properties);
    setEvaluations(newEvaluations);
  }, [properties, formState, evaluator]);

  const validateAll = React.useCallback(async () => {
    return evaluator.validateAllProperties(properties);
  }, [evaluator, properties]);

  const getDependents = React.useCallback(
    (propertyName: string) => {
      return evaluator.getDependentProperties(propertyName);
    },
    [evaluator]
  );

  return {
    evaluations,
    validateAll,
    getDependents,
    evaluator,
  };
}

// Import React for the hook
import React from 'react';
