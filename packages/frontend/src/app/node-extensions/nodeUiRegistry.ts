/**
 * Enhanced Node UI Registry
 * Integrates with ComponentFactory for advanced component management and lazy loading
 */

import type { ComponentType } from "react";
import { componentFactory } from "./ComponentFactory";
import AIAgentNodeBody from "./AIAgentNodeBody";
import ConditionNodeBody from "./ConditionNodeBody";
import GmailNodeBody from "./custom-nodes/GmailNodeBody";
import { GmailPropertiesPanel } from "../../design-system/components/nodes/GmailNode";

// Re-export types from the main types file
export type {
  CustomNodeBodyProps,
  CustomPropertiesPanelProps,
  EnhancedNodeTypeDescription,
  NodeTheme,
  NodeVisualConfig,
  ToolbarAction,
  NodeBadge,
  CustomHandle,
} from "./types";

// Enhanced Registry Implementation
class NodeUIRegistry {
  private initialized = false;

  constructor() {
    // Don't initialize immediately - wait until first use
    console.log("🏗️ NodeUIRegistry: Constructor called (lazy initialization)");
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      console.log("🔄 NodeUIRegistry: Performing lazy initialization...");
      this.initializeComponents();
      this.initialized = true;
    }
  }

  private initializeComponents(): void {
    console.log("🔧 NodeUIRegistry: Starting component initialization...");

    // Register existing components with the factory
    console.log("📝 Registering core components...");
    componentFactory.registerBodyComponent("AIAgentNodeBody", AIAgentNodeBody);
    componentFactory.registerBodyComponent(
      "ConditionNodeBody",
      ConditionNodeBody,
    );
    console.log("✅ Core components registered:", [
      "AIAgentNodeBody",
      "ConditionNodeBody",
    ]);

    // Register Gmail components directly (no lazy loading to ensure immediate availability)
    console.log("📧 Registering Gmail components directly...");
    console.log("📧 Gmail imports:", { GmailNodeBody, GmailPropertiesPanel });

    try {
      // Register our custom Gmail node body that matches old UI
      componentFactory.registerBodyComponent("GmailNodeBody", GmailNodeBody);
      console.log("✅ GmailNodeBody (custom UI) registered successfully");

      // Keep the original for backward compatibility if needed
      componentFactory.registerBodyComponent(
        "GmailTriggerNodeBody",
        GmailNodeBody,
      );
      console.log(
        "✅ GmailTriggerNodeBody registered successfully (using custom UI)",
      );

      componentFactory.registerPropertiesPanel(
        "GmailPropertiesPanel",
        GmailPropertiesPanel,
      );
      console.log("✅ GmailPropertiesPanel registered successfully");

      // Verify registration immediately
      const gmailBodyComponent = componentFactory.createNodeBody(
        "GmailTriggerNodeBody",
      );
      const gmailPropertiesPanel = componentFactory.createPropertiesPanel(
        "GmailPropertiesPanel",
      );

      console.log("🔍 Gmail registration verification:", {
        bodyComponent: !!gmailBodyComponent,
        bodyComponentName: gmailBodyComponent?.name,
        propertiesPanel: !!gmailPropertiesPanel,
        propertiesPanelName: gmailPropertiesPanel?.name,
      });
    } catch (error) {
      console.error("❌ Gmail component registration failed:", error);
    }

    console.log(
      "📧 Gmail components registered directly for immediate availability",
    );

    // Register other specialized components with lazy loading
    componentFactory.registerLazyBodyComponent(
      "DatabaseNodeBody",
      () => import("./bodies/DatabaseNodeBody"),
    );

    componentFactory.registerLazyPropertiesPanel(
      "AIAgentPropertiesPanel",
      () => import("./panels/AIAgentPropertiesPanel"),
    );

    // Final registry state logging
    console.log(
      "🏁 Component Factory Statistics:",
      componentFactory.getStatistics(),
    );
    console.log(
      "🏁 Registered Component Types:",
      componentFactory.listRegisteredTypes(),
    );
    console.log("🔧 NodeUIRegistry initialization completed");
  }

  // ============================================================================
  // Primary Interface Methods
  // ============================================================================

  getCustomBodyComponent(
    componentName?: string,
  ): ComponentType<any> | null | undefined {
    this.ensureInitialized(); // Ensure components are registered before lookup

    if (!componentName) return undefined;
    const component = componentFactory.createNodeBody(componentName);
    console.log(
      `🔍 Custom body component lookup: "${componentName}" → ${component ? "FOUND" : "NOT FOUND"}`,
    );

    // Additional debug logging for Gmail specifically
    if (componentName === "GmailTriggerNodeBody") {
      console.log("📧 Gmail component lookup details:", {
        componentName,
        componentFound: !!component,
        componentType: component?.name || "unknown",
        factoryStats: componentFactory.getStatistics(),
      });
    }

    return component;
  }

  getCustomPropertiesPanel(
    componentName?: string,
  ): ComponentType<any> | null | undefined {
    this.ensureInitialized(); // Ensure components are registered before lookup

    if (!componentName) return undefined;
    return componentFactory.createPropertiesPanel(componentName);
  }

  registerCustomBodyComponent(
    name: string,
    component: ComponentType<any>,
  ): void {
    componentFactory.registerBodyComponent(name, component);
  }

  registerCustomPropertiesPanel(
    name: string,
    component: ComponentType<any>,
  ): void {
    componentFactory.registerPropertiesPanel(name, component);
  }

  // ============================================================================
  // Advanced Methods
  // ============================================================================

  registerLazyBodyComponent(
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>,
  ): void {
    componentFactory.registerLazyBodyComponent(name, loader);
  }

  registerLazyPropertiesPanel(
    name: string,
    loader: () => Promise<{ default: ComponentType<any> }>,
  ): void {
    componentFactory.registerLazyPropertiesPanel(name, loader);
  }

  async preloadComponents(nodeTypes: string[]): Promise<void> {
    return componentFactory.preloadComponents(nodeTypes);
  }

  hasCustomBody(typeName: string): boolean {
    return componentFactory.hasCustomBody(typeName);
  }

  hasCustomPropertiesPanel(typeName: string): boolean {
    return componentFactory.hasCustomPropertiesPanel(typeName);
  }

  getStatistics() {
    return componentFactory.getStatistics();
  }

  listRegisteredTypes() {
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
export function getCustomBodyComponent(
  componentName?: string,
): ComponentType<any> | undefined {
  return registryInstance.getCustomBodyComponent(componentName);
}

/**
 * Get a custom properties panel component from the enhanced registry
 */
export function getCustomPropertiesPanelComponent(
  componentName?: string,
): ComponentType<any> | undefined {
  return registryInstance.getCustomPropertiesPanel(componentName);
}

/**
 * Register a custom body component at runtime
 */
export function registerCustomBodyComponent(
  name: string,
  component: ComponentType<any>,
): void {
  registryInstance.registerCustomBodyComponent(name, component);
}

/**
 * Register a custom properties panel component at runtime
 */
export function registerCustomPropertiesPanelComponent(
  name: string,
  component: ComponentType<any>,
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
  name: string,
  loader: () => Promise<{ default: ComponentType<any> }>,
): void {
  registryInstance.registerLazyBodyComponent(name, loader);
}

/**
 * Register a lazy-loaded properties panel component
 */
export function registerLazyPropertiesPanel(
  name: string,
  loader: () => Promise<{ default: ComponentType<any> }>,
): void {
  registryInstance.registerLazyPropertiesPanel(name, loader);
}

/**
 * Preload components for specified node types
 */
export async function preloadNodeComponents(
  nodeTypes: string[],
): Promise<void> {
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
