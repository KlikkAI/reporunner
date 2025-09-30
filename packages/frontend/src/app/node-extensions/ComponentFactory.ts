/**
 * Component Factory
 * Centralized factory for creating and managing node UI components
 */

import type { ComponentType } from 'react';
import type {
  CustomHandleRendererProps,
  CustomNodeBodyProps,
  CustomPropertiesPanelProps,
  CustomToolbarProps,
  UIComponentFactory,
} from './types';

class ComponentFactory implements UIComponentFactory {
  private bodyComponents: Map<string, ComponentType<CustomNodeBodyProps>> = new Map();
  private propertiesPanels: Map<string, ComponentType<CustomPropertiesPanelProps>> = new Map();
  private handleRenderers: Map<string, ComponentType<CustomHandleRendererProps>> = new Map();
  private toolbars: Map<string, ComponentType<CustomToolbarProps>> = new Map();

  // Lazy loading cache
  private lazyLoaders: Map<string, () => Promise<ComponentType<any>>> = new Map();
  private loadingPromises: Map<string, Promise<ComponentType<any>>> = new Map();

  // ============================================================================
  // Component Creation Methods
  // ============================================================================

  createNodeBody(type: string): ComponentType<CustomNodeBodyProps> | null {
    const component = this.bodyComponents.get(type) || null;

    return component;
  }

  createPropertiesPanel(type: string): ComponentType<CustomPropertiesPanelProps> | null {
    return this.propertiesPanels.get(type) || null;
  }

  createHandleRenderer(type: string): ComponentType<CustomHandleRendererProps> | null {
    return this.handleRenderers.get(type) || null;
  }

  createToolbar(type: string): ComponentType<CustomToolbarProps> | null {
    return this.toolbars.get(type) || null;
  }

  // ============================================================================
  // Registration Methods
  // ============================================================================

  registerBodyComponent(name: string, component: ComponentType<CustomNodeBodyProps>): void {
    if (!component) {
      return;
    }

    this.bodyComponents.set(name, component);

    // Immediate verification
    const _retrieved = this.bodyComponents.get(name);
  }

  registerPropertiesPanel(
    name: string,
    component: ComponentType<CustomPropertiesPanelProps>
  ): void {
    if (!component) {
      return;
    }

    this.propertiesPanels.set(name, component);

    // Immediate verification
    const _retrieved = this.propertiesPanels.get(name);
  }

  registerHandleRenderer(name: string, component: ComponentType<CustomHandleRendererProps>): void {
    this.handleRenderers.set(name, component);
  }

  registerToolbar(name: string, component: ComponentType<CustomToolbarProps>): void {
    this.toolbars.set(name, component);
  }

  // ============================================================================
  // Lazy Loading Methods
  // ============================================================================

  /**
   * Register a component with lazy loading
   */
  registerLazyBodyComponent(
    name: string,
    loader: () => Promise<{ default: ComponentType<CustomNodeBodyProps> }>
  ): void {
    this.lazyLoaders.set(`body-${name}`, async () => {
      const module = await loader();
      const component = module.default;
      this.bodyComponents.set(name, component);
      return component;
    });
  }

  registerLazyPropertiesPanel(
    name: string,
    loader: () => Promise<{
      default: ComponentType<CustomPropertiesPanelProps>;
    }>
  ): void {
    this.lazyLoaders.set(`panel-${name}`, async () => {
      const module = await loader();
      const component = module.default;
      this.propertiesPanels.set(name, component);
      return component;
    });
  }

  /**
   * Load a component asynchronously
   */
  async loadBodyComponent(name: string): Promise<ComponentType<CustomNodeBodyProps> | null> {
    // Check if already loaded
    const existing = this.bodyComponents.get(name);
    if (existing) {
      return existing;
    }

    // Check if lazy loader exists
    const loaderKey = `body-${name}`;
    const loader = this.lazyLoaders.get(loaderKey);
    if (!loader) {
      return null;
    }

    // Check if already loading
    if (this.loadingPromises.has(loaderKey)) {
      return (await this.loadingPromises.get(loaderKey)) as ComponentType<CustomNodeBodyProps>;
    }

    // Start loading
    const promise = loader();
    this.loadingPromises.set(loaderKey, promise);

    try {
      const component = await promise;
      this.loadingPromises.delete(loaderKey);
      return component as ComponentType<CustomNodeBodyProps>;
    } catch (_error) {
      this.loadingPromises.delete(loaderKey);
      return null;
    }
  }

  async loadPropertiesPanel(
    name: string
  ): Promise<ComponentType<CustomPropertiesPanelProps> | null> {
    // Similar implementation to loadBodyComponent
    const existing = this.propertiesPanels.get(name);
    if (existing) {
      return existing;
    }

    const loaderKey = `panel-${name}`;
    const loader = this.lazyLoaders.get(loaderKey);
    if (!loader) {
      return null;
    }

    if (this.loadingPromises.has(loaderKey)) {
      return (await this.loadingPromises.get(
        loaderKey
      )) as ComponentType<CustomPropertiesPanelProps>;
    }

    const promise = loader();
    this.loadingPromises.set(loaderKey, promise);

    try {
      const component = await promise;
      this.loadingPromises.delete(loaderKey);
      return component as ComponentType<CustomPropertiesPanelProps>;
    } catch (_error) {
      this.loadingPromises.delete(loaderKey);
      return null;
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Preload multiple components
   */
  async preloadComponents(nodeTypes: string[]): Promise<void> {
    const loadPromises = nodeTypes.map(async (type) => {
      await Promise.all([this.loadBodyComponent(type), this.loadPropertiesPanel(type)]);
    });

    await Promise.all(loadPromises);
  }

  /**
   * Get component bundle for multiple node types
   */
  async getComponentBundle(nodeTypes: string[]): Promise<Record<string, any>> {
    const bundle: Record<string, any> = {};

    const loadPromises = nodeTypes.map(async (type) => {
      const [bodyComponent, propertiesPanel] = await Promise.all([
        this.loadBodyComponent(type),
        this.loadPropertiesPanel(type),
      ]);

      bundle[type] = {
        bodyComponent,
        propertiesPanel,
        handleRenderer: this.createHandleRenderer(type),
        toolbar: this.createToolbar(type),
      };
    });

    await Promise.all(loadPromises);
    return bundle;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  hasCustomBody(type: string): boolean {
    return this.bodyComponents.has(type) || this.lazyLoaders.has(`body-${type}`);
  }

  hasCustomPropertiesPanel(type: string): boolean {
    return this.propertiesPanels.has(type) || this.lazyLoaders.has(`panel-${type}`);
  }

  hasCustomHandleRenderer(type: string): boolean {
    return this.handleRenderers.has(type);
  }

  hasCustomToolbar(type: string): boolean {
    return this.toolbars.has(type);
  }

  /**
   * Get statistics about registered components
   */
  getStatistics() {
    return {
      bodyComponents: this.bodyComponents.size,
      propertiesPanels: this.propertiesPanels.size,
      handleRenderers: this.handleRenderers.size,
      toolbars: this.toolbars.size,
      lazyLoaders: this.lazyLoaders.size,
      loadingPromises: this.loadingPromises.size,
    };
  }

  /**
   * List all registered component types
   */
  listRegisteredTypes(): {
    bodyComponents: string[];
    propertiesPanels: string[];
    handleRenderers: string[];
    toolbars: string[];
    lazyLoaders: string[];
  } {
    return {
      bodyComponents: Array.from(this.bodyComponents.keys()),
      propertiesPanels: Array.from(this.propertiesPanels.keys()),
      handleRenderers: Array.from(this.handleRenderers.keys()),
      toolbars: Array.from(this.toolbars.keys()),
      lazyLoaders: Array.from(this.lazyLoaders.keys()),
    };
  }

  /**
   * Clear all registered components (useful for testing)
   */
  clear(): void {
    this.bodyComponents.clear();
    this.propertiesPanels.clear();
    this.handleRenderers.clear();
    this.toolbars.clear();
    this.lazyLoaders.clear();
    this.loadingPromises.clear();
  }

  // ============================================================================
  // Advanced Features
  // ============================================================================

  /**
   * Create a component proxy that handles loading states
   */
  createLoadingProxy<T>(
    loadFunction: () => Promise<ComponentType<T> | null>,
    LoadingComponent?: ComponentType<T>,
    ErrorComponent?: ComponentType<T & { error: Error }>
  ): ComponentType<T> {
    return (props: T) => {
      const [component, setComponent] = React.useState<ComponentType<T> | null>(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState<Error | null>(null);

      React.useEffect(() => {
        loadFunction()
          .then((loadedComponent) => {
            setComponent(() => loadedComponent);
            setLoading(false);
          })
          .catch((err) => {
            setError(err);
            setLoading(false);
          });
      }, [loadFunction]);

      if (loading && LoadingComponent) {
        return React.createElement(LoadingComponent as React.ComponentType<any>, props as any);
      }

      if (error && ErrorComponent) {
        return React.createElement(ErrorComponent as React.ComponentType<any>, {
          ...props,
          error,
        });
      }

      if (component) {
        return React.createElement(component as React.ComponentType<any>, props as any);
      }

      return null;
    };
  }

  /**
   * Register component with version support
   */
  registerVersionedBodyComponent(
    name: string,
    version: string,
    component: ComponentType<CustomNodeBodyProps>
  ): void {
    const versionedName = `${name}@${version}`;
    this.bodyComponents.set(versionedName, component);

    // Also register as latest if no version specified
    if (!this.bodyComponents.has(name)) {
      this.bodyComponents.set(name, component);
    }
  }

  /**
   * Get component with fallback chain
   */
  getComponentWithFallback<T>(
    primaryName: string,
    fallbackNames: string[],
    componentMap: Map<string, ComponentType<T>>
  ): ComponentType<T> | null {
    // Try primary name first
    let component = componentMap.get(primaryName);
    if (component) {
      return component;
    }

    // Try fallbacks
    for (const fallbackName of fallbackNames) {
      component = componentMap.get(fallbackName);
      if (component) {
        return component;
      }
    }

    return null;
  }
}

// Import React for the loading proxy
import React from 'react';

// Export singleton instance
export const componentFactory = new ComponentFactory();

// Export class for testing
export { ComponentFactory };
