/**
 * Disable integration
 */
disableIntegration(name: string)
: boolean
{
  const definition = this.definitions.get(name);
  if (!definition) {
    return false;
  }

  // Destroy all instances
  const instancesToDestroy: string[] = [];
  for (const [id, instance] of this.instances.entries()) {
    if (instance.definition.name === name) {
      instancesToDestroy.push(id);
    }
  }

  for (const id of instancesToDestroy) {
    this.destroyInstance(id);
  }

  definition.isEnabled = false;

  this.emit('definition:disabled', { name });

  return true;
}

/**
 * Get categories
 */
getCategories();
: string[]
{
  return Array.from(this.categories);
}

/**
 * Get tags
 */
getTags();
: string[]
{
  return Array.from(this.tags);
}

/**
 * Get capabilities
 */
getCapabilities();
: string[]
{
  return Array.from(this.capabilities);
}

/**
 * Get statistics
 */
getStatistics();
:
{
  totalDefinitions: number;
  enabledDefinitions: number;
  totalInstances: number;
  instancesByIntegration: Record<string, number>;
  instancesByUser: Record<string, number>;
  categories: number;
  tags: number;
  capabilities: number;
}
{
  const stats = {
    totalDefinitions: this.definitions.size,
    enabledDefinitions: 0,
    totalInstances: this.instances.size,
    instancesByIntegration: {} as Record<string, number>,
    instancesByUser: {} as Record<string, number>,
    categories: this.categories.size,
    tags: this.tags.size,
    capabilities: this.capabilities.size,
  };

  this.definitions.forEach((def) => {
    if (def.isEnabled !== false) {
      stats.enabledDefinitions++;
    }
  });

  this.instances.forEach((instance) => {
    const name = instance.definition.name;
    stats.instancesByIntegration[name] = (stats.instancesByIntegration[name] || 0) + 1;

    const userId = instance.context.userId;
    stats.instancesByUser[userId] = (stats.instancesByUser[userId] || 0) + 1;
  });

  return stats;
}

/**
 * Generate instance ID
 */
private
generateInstanceId();
: string
{
  return `int_instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all
 */
