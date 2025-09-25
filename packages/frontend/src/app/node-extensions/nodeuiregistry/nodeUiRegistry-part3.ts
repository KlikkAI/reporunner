name: string, loader;
: () => Promise<
{
  default: ComponentType<any>
}
>
): void
{
  registryInstance.registerLazyBodyComponent(name, loader);
}

/**
 * Register a lazy-loaded properties panel component
 */
export function registerLazyPropertiesPanel(
  name: string,
  loader: () => Promise<{ default: ComponentType<any> }>
): void {
  registryInstance.registerLazyPropertiesPanel(name, loader);
}

/**
 * Preload components for specified node types
 */
export async function preloadNodeComponents(nodeTypes: string[]): Promise<void> {
  return registryInstance.preloadComponents(nodeTypes);
}

/**
 * Check if a node type has a custom body component
 */
export function hasCustomBody(typeName: string): boolean {
  return registryInstance.hasCustomBody(typeName);
}

/**
 * Check if a node type has a custom properties panel
 */
export function hasCustomPropertiesPanel(typeName: string): boolean {
  return registryInstance.hasCustomPropertiesPanel(typeName);
}

/**
 * Get registry statistics
 */
export function getRegistryStatistics() {
  return registryInstance.getStatistics();
}

/**
 * List all registered component types
 */
export function listRegisteredComponentTypes() {
  return registryInstance.listRegisteredTypes();
}

// Export the enhanced registry instance for advanced usage
export { registryInstance as enhancedRegistry };
