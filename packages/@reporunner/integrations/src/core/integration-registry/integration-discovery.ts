for (const id of instancesToRemove) {
  this.destroyInstance(id);
}

// Remove definition
this.definitions.delete(name);

this.emit('definition:unregistered', { name });

return true;
}

  /**
   * Get integration definition
   */
  getDefinition(name: string): IntegrationDefinition | undefined
{
  return this.definitions.get(name);
}

/**
 * Get all definitions
 */
getAllDefinitions();
: IntegrationDefinition[]
{
  return Array.from(this.definitions.values());
}

/**
 * Find definitions by filter
 */
findDefinitions(filter: IntegrationFilter)
: IntegrationDefinition[]
{
  const results: IntegrationDefinition[] = [];

  this.definitions.forEach((definition) => {
    // Apply filters
    if (filter.category && definition.config.category !== filter.category) {
      return;
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some((tag) => definition.config.tags?.includes(tag));
      if (!hasTag) {
        return;
      }
    }

    if (filter.capabilities && filter.capabilities.length > 0) {
      const hasCap = filter.capabilities.some((cap) =>
        definition.config.supportedFeatures?.includes(cap)
      );
      if (!hasCap) {
        return;
      }
    }

    if (filter.isEnabled !== undefined && definition.isEnabled !== filter.isEnabled) {
      return;
    }

    if (filter.isBuiltIn !== undefined && definition.isBuiltIn !== filter.isBuiltIn) {
      return;
    }

    results.push(definition);
  });

  return results;
}

/**
 * Create integration instance
 */
async;
createInstance(name: string, context: IntegrationContext)
: Promise<string>
{
    const definition = this.definitions.get(name);
    if (!definition) {
      throw new Error(`Integration ${name} is not registered`);
    }

    if (definition.isEnabled === false) {
      throw new Error(`Integration ${name} is disabled`);
    }

    // Check dependencies
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        const depDef = this.definitions.get(dep);
        if (!depDef || depDef.isEnabled === false) {
          throw new Error(`Dependency ${dep} for ${name} is not available`);
        }
      }
    }

    try {
      // Create integration instance
      const IntegrationClass = definition.constructor as any;
      const integration = new IntegrationClass(definition.config) as BaseIntegration;

      // Initialize integration
      await integration.initialize(context);

// Generate instance ID
