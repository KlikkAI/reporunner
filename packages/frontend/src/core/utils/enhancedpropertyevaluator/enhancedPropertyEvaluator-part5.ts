break;

case 'number':
if (property.name.toLowerCase().includes('temperature')) {
  return 'Suggested: 0.7 (balanced creativity)';
}
if (property.name.toLowerCase().includes('token')) {
  return 'Suggested: 1000 (moderate length)';
}
if (property.name.toLowerCase().includes('timeout')) {
  return 'Suggested: 30000 (30 seconds)';
}
break;

case 'boolean':
return 'Suggested: true (enabled)';
}
    }

// Use custom AI prompt if available
if (property.aiPrompt) {
  return `AI Suggestion: ${property.aiPrompt}`;
}

// Contextual suggestions based on current value
if (currentValue) {
  if (property.type === 'string' && typeof currentValue === 'string') {
    if (currentValue.length < 10 && property.name.toLowerCase().includes('prompt')) {
      return 'Consider adding more detail to improve AI responses';
    }
  }
}

return undefined;
}

  private calculateDefaultValue(property: EnhancedNodeProperty): PropertyValue | undefined
{
  // Use existing default if available
  if (property.default !== undefined) {
    return property.default as PropertyValue;
  }

  // Generate smart defaults based on property type
  switch (property.type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'select':
    case 'multiSelect':
      return [];
    case 'collection':
      return undefined;
    case 'fixedCollection':
      return undefined;
    default:
      return undefined;
  }
}

private
buildDependencyGraph(properties: EnhancedNodeProperty[])
: void
{
  this.dependencyGraph.clear();

  properties.forEach((property) => {
    const dependencies = this.extractDependencies(property);
    dependencies.forEach((dep) => {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)?.add(property.name);
    });
  });
}

private
extractDependencies(property: EnhancedNodeProperty)
: string[]
{
  const dependencies = new Set<string>();

  // Extract from display options
  if (property.displayOptions) {
    ['show', 'hide', 'enable', 'disable'].forEach((key) => {
      const conditions = (property.displayOptions as any)?.[key];
      if (Array.isArray(conditions)) {
        conditions.forEach((dep: PropertyDependency) => {
          dependencies.add(dep.property);
        });
      }
    });
  }

  // Extract from explicit dependencies
  if (property.dependencies) {
    property.dependencies.forEach((dep) => dependencies.add(dep));
  }

  return Array.from(dependencies);
}

private
topologicalSort(properties: EnhancedNodeProperty[])
: EnhancedNodeProperty[]
{
