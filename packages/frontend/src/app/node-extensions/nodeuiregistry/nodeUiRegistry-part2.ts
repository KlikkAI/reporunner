registerLazyBodyComponent(
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>
  )
: void
{
  componentFactory.registerLazyBodyComponent(name, loader);
}

registerLazyPropertiesPanel(
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>
  )
: void
{
  componentFactory.registerLazyPropertiesPanel(name, loader);
}

async;
preloadComponents(nodeTypes: string[])
: Promise<void>
{
  return componentFactory.preloadComponents(nodeTypes);
}

hasCustomBody(typeName: string)
: boolean
{
  return componentFactory.hasCustomBody(typeName);
}

hasCustomPropertiesPanel(typeName: string)
: boolean
{
  return componentFactory.hasCustomPropertiesPanel(typeName);
}

getStatistics();
{
  return componentFactory.getStatistics();
}

listRegisteredTypes();
{
  return componentFactory.listRegisteredTypes();
}
}

// Create singleton instance
const registryInstance = new NodeUIRegistry();

// Legacy compatibility - maintain the old interface
export const nodeUiRegistry = {
  bodyComponents: {
    get AIAgentNodeBody() {
      return AIAgentNodeBody;
    },
    get ConditionNodeBody() {
      return ConditionNodeBody;
    },
    // Gmail components are lazy-loaded, use the registry functions instead
  },
  propertiesPanelComponents: {
    // Gmail properties panel is lazy-loaded, use the registry functions instead
  },
};

// ============================================================================
// Enhanced Helper Functions
// ============================================================================

/**
 * Get a custom body component from the enhanced registry
 */
export function getCustomBodyComponent(componentName?: string): ComponentType<any> | undefined {
  return registryInstance.getCustomBodyComponent(componentName) || undefined;
}

/**
 * Get a custom properties panel component from the enhanced registry
 */
export function getCustomPropertiesPanelComponent(
  componentName?: string
): ComponentType<any> | undefined {
  return registryInstance.getCustomPropertiesPanel(componentName) || undefined;
}

/**
 * Register a custom body component at runtime
 */
export function registerCustomBodyComponent(name: string, component: ComponentType<any>): void {
  registryInstance.registerCustomBodyComponent(name, component);
}

/**
 * Register a custom properties panel component at runtime
 */
export function registerCustomPropertiesPanelComponent(
  name: string,
  component: ComponentType<any>
): void {
  registryInstance.registerCustomPropertiesPanel(name, component);
}

// ============================================================================
// Enhanced Registry Features
// ============================================================================

/**
 * Register a lazy-loaded body component
 */
export function registerLazyBodyComponent(
