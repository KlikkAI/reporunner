clearAll();
: void
{
  // Destroy all instances
  const instanceIds = Array.from(this.instances.keys());
  for (const id of instanceIds) {
    this.destroyInstance(id);
  }

  // Clear definitions
  this.definitions.clear();
  this.categories.clear();
  this.tags.clear();
  this.capabilities.clear();
}
}

// Singleton instance
export const integrationRegistry = new IntegrationRegistry();

export default IntegrationRegistry;
