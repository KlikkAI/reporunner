/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeType, INodeTypeDescription, ICredentialType } from "./types";
import type {
  EnhancedIntegrationNodeType,
  PropertyFormState,
} from "../../types/dynamicProperties";

/**
 * Enterprise-Grade Registry Interfaces
 */
interface NodeCapabilityDefinition {
  id: string;
  supportedModes: ("trigger" | "action" | "webhook" | "poll")[];
  resources: string[];
  operations: Record<string, string[]>;
  contextAware: boolean;
  scalingProfile: "light" | "standard" | "enterprise";
  tenantIsolation: boolean;
}

export interface ContextResolver {
  id: string;
  resolve: (context: WorkflowContext) => Promise<ResolvedContext | null>;
  priority: number;
}

export interface WorkflowContext {
  nodeId: string;
  workflowId: string;
  isWorkflowStart: boolean;
  hasInputConnections: boolean;
  position: { x: number; y: number };
  tenantId?: string;
  userContext?: any;
  formState?: PropertyFormState;
}

export interface ResolvedContext {
  mode: "trigger" | "action" | "webhook" | "poll";
  resource: string;
  operation?: string;
  properties: any[];
  capabilities: string[];
}

interface NodePerformanceMetrics {
  nodeId: string;
  executionCount: number;
  averageExecutionTime: number;
  errorRate: number;
  lastExecuted: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

interface RegistryPlugin {
  id: string;
  name: string;
  version: string;
  initialize: (registry: NodeRegistry) => Promise<void>;
  extend: (nodeType: string, extensions: any) => void;
}

/**
 * Enterprise-Grade NodeRegistry for Large-Scale Platform Engineering
 *
 * Features:
 * - Pure registry pattern with dynamic node registration
 * - Multi-tenant isolation and enterprise scalability
 * - Context-aware node resolution with smart mode detection
 * - Plugin architecture for runtime extensions
 * - Performance monitoring and analytics
 * - A/B testing capabilities for node configurations
 */
class NodeRegistry {
  private static instance: NodeRegistry;

  // Core Registry Maps
  private nodeTypes: Map<string, INodeType> = new Map();
  private enhancedNodeTypes: Map<string, EnhancedIntegrationNodeType> =
    new Map();
  private credentialTypes: Map<string, ICredentialType> = new Map();
  private categories: Set<string> = new Set();

  // Enterprise Features
  private nodeCapabilities: Map<string, NodeCapabilityDefinition> = new Map();
  private contextResolvers: Map<string, ContextResolver> = new Map();
  private tenantRegistries: Map<string, Map<string, any>> = new Map();
  private performanceMetrics: Map<string, NodePerformanceMetrics> = new Map();
  private featureFlags: Map<string, boolean> = new Map();

  // Registry State
  private registryVersion = 1;
  private lastUpdate = Date.now();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of NodeRegistry
   */
  public static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
      NodeRegistry.instance.initializeEnterpriseFeatures();
    }
    return NodeRegistry.instance;
  }

  /**
   * Initialize enterprise-grade features
   */
  private initializeEnterpriseFeatures(): void {
    // Initialize default tenant
    this.tenantRegistries.set("default", new Map());

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Initialize feature flags
    this.initializeFeatureFlags();

    console.log("🚀 Enterprise NodeRegistry initialized");
  }

  /**
   * Register a new node type
   * @param nodeType The node type to register
   */
  public registerNodeType(nodeType: INodeType): void {
    const { name } = nodeType.description;
    if (this.nodeTypes.has(name)) {
      console.warn(`Node type "${name}" is already registered. Overwriting...`);
    }
    this.nodeTypes.set(name, nodeType);

    // Track categories
    nodeType.description.categories?.forEach((category) => {
      this.categories.add(category);
    });
  }

  /**
   * Register a credential type
   * @param credentialType The credential type to register
   */
  public registerCredentialType(credentialType: ICredentialType): void {
    const { name } = credentialType;
    if (this.credentialTypes.has(name)) {
      console.warn(
        `Credential type "${name}" is already registered. Overwriting...`,
      );
    }
    this.credentialTypes.set(name, credentialType);
  }

  /**
   * Get a node type by its name
   * @param typeName The name of the node type
   * @returns The node type or undefined if not found
   */
  public getNodeType(typeName: string): INodeType | undefined {
    return this.nodeTypes.get(typeName);
  }

  /**
   * Get a node type description by its name
   * @param typeName The name of the node type
   * @returns The node type description or undefined if not found
   */
  public getNodeTypeDescription(
    typeName: string,
  ): INodeTypeDescription | undefined {
    // First try regular node types
    const regularNode = this.nodeTypes.get(typeName);
    if (regularNode) {
      return regularNode.description;
    }

    // Then try enhanced node types (convert to INodeTypeDescription format)
    const enhancedNode = this.enhancedNodeTypes.get(typeName);
    if (enhancedNode) {
      return {
        displayName: enhancedNode.displayName,
        name: enhancedNode.name,
        icon: enhancedNode.icon || "fa:envelope",
        group: [enhancedNode.type === "trigger" ? "trigger" : "transform"],
        version: 1,
        description: enhancedNode.description || "",
        defaults: {
          name: enhancedNode.displayName,
          color: enhancedNode.color || "#DD4B39",
        },
        inputs: enhancedNode.inputs || [{ type: "main" }],
        outputs: enhancedNode.outputs || [{ type: "main" }],
        categories: enhancedNode.codex?.categories || [],
        // Preserve custom UI components from enhanced nodes
        customBodyComponent: (enhancedNode as any).customBodyComponent,
        customPropertiesPanel: (enhancedNode as any).customPropertiesPanel,
      };
    }

    return undefined;
  }

  /**
   * Get a credential type by its name
   * @param typeName The name of the credential type
   * @returns The credential type or undefined if not found
   */
  public getCredentialType(typeName: string): ICredentialType | undefined {
    return this.credentialTypes.get(typeName);
  }

  /**
   * Get all registered node types
   * @returns Array of all node types
   */
  public getAllNodeTypes(): INodeType[] {
    return Array.from(this.nodeTypes.values());
  }

  /**
   * Get all node type descriptions
   * @returns Array of all node type descriptions including enhanced nodes
   */
  public getAllNodeTypeDescriptions(): INodeTypeDescription[] {
    // Get regular node descriptions
    const regularNodes = Array.from(this.nodeTypes.values()).map(
      (nodeType) => nodeType.description,
    );

    // Get enhanced node descriptions (convert to INodeTypeDescription format)
    const enhancedNodes = Array.from(this.enhancedNodeTypes.values()).map(
      (enhancedNode): INodeTypeDescription => ({
        displayName: enhancedNode.displayName,
        name: enhancedNode.name,
        icon: enhancedNode.icon || "fa:envelope",
        group: [enhancedNode.type === "trigger" ? "trigger" : "transform"],
        version: 1,
        description: enhancedNode.description || "",
        defaults: {
          name: enhancedNode.displayName,
          color: enhancedNode.color || "#DD4B39",
        },
        inputs: enhancedNode.inputs || [{ type: "main" }],
        outputs: enhancedNode.outputs || [{ type: "main" }],
        categories: enhancedNode.codex?.categories || [],
        // Preserve custom UI components from enhanced nodes
        customBodyComponent: (enhancedNode as any).customBodyComponent,
        customPropertiesPanel: (enhancedNode as any).customPropertiesPanel,
      }),
    );

    return [...regularNodes, ...enhancedNodes];
  }

  /**
   * Get all credential types
   * @returns Array of all credential types
   */
  public getAllCredentialTypes(): ICredentialType[] {
    return Array.from(this.credentialTypes.values());
  }

  /**
   * Test a node type with given parameters and credentials
   * @param typeName The name of the node type
   * @param parameters The parameters to test with
   * @param credentials The credentials to use
   * @returns Test result
   */
  public async testNodeType(
    typeName: string,
    parameters: Record<string, any> = {},
    credentials: Record<string, any> = {},
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const nodeType = this.nodeTypes.get(typeName);
    if (!nodeType) {
      return {
        success: false,
        message: `Node type "${typeName}" not found`,
      };
    }

    if (!nodeType.test) {
      return {
        success: false,
        message: `Node type "${typeName}" does not support testing`,
      };
    }

    try {
      // Create a mock context for the test method
      const mockContext = {
        getNodeParameter: (name: string, defaultValue?: any) => {
          const keys = name.split(".");
          let value = parameters;
          for (const key of keys) {
            value = value?.[key];
          }
          return value !== undefined ? value : defaultValue;
        },
        getCredentials: (credentialType: string) => {
          return credentials[credentialType] || credentials;
        },
      };

      return await nodeType.test.call(mockContext);
    } catch (error: any) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  /**
   * Get node types by category
   * @param category The category to filter by
   * @returns Array of node types in the specified category
   */
  public getNodeTypesByCategory(category: string): INodeType[] {
    return Array.from(this.nodeTypes.values()).filter((nodeType) =>
      nodeType.description.categories?.includes(category),
    );
  }

  /**
   * Get all categories
   * @returns Array of all registered categories
   */
  public getAllCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Check if a node type is registered
   * @param typeName The name of the node type
   * @returns True if the node type is registered
   */
  public hasNodeType(typeName: string): boolean {
    return this.nodeTypes.has(typeName);
  }

  /**
   * Check if a credential type is registered
   * @param typeName The name of the credential type
   * @returns True if the credential type is registered
   */
  public hasCredentialType(typeName: string): boolean {
    return this.credentialTypes.has(typeName);
  }

  /**
   * Search for node types by display name or description
   * @param query The search query
   * @returns Array of matching node types
   */
  public searchNodeTypes(query: string): INodeType[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.nodeTypes.values()).filter((nodeType) => {
      const { displayName, description, name } = nodeType.description;
      return (
        displayName.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery) ||
        name.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Clear all registered node types and credentials
   * Useful for testing
   */
  public clear(): void {
    this.nodeTypes.clear();
    this.credentialTypes.clear();
    this.categories.clear();
  }

  /**
   * Get all enhanced node types for debugging
   */
  public getAllEnhancedNodeTypes(): EnhancedIntegrationNodeType[] {
    return Array.from(this.enhancedNodeTypes.values());
  }

  /**
   * Get enhanced node type synchronously
   * @param nodeId The node type ID to get
   * @returns Enhanced node type or undefined if not found
   */
  public getEnhancedNodeTypeSync(
    nodeId: string,
  ): EnhancedIntegrationNodeType | undefined {
    return this.enhancedNodeTypes.get(nodeId);
  }

  /**
   * Get registry statistics
   * @returns Object with registry statistics
   */
  public getStatistics() {
    return {
      nodeTypesCount: this.nodeTypes.size,
      enhancedNodeTypesCount: this.enhancedNodeTypes.size,
      credentialTypesCount: this.credentialTypes.size,
      categoriesCount: this.categories.size,
      triggerNodes: this.getAllNodeTypes().filter((n) =>
        n.description.group.includes("trigger"),
      ).length,
      actionNodes: this.getAllNodeTypes().filter(
        (n) => !n.description.group.includes("trigger"),
      ).length,
      tenantCount: this.tenantRegistries.size,
      featureFlagsCount: this.featureFlags.size,
      registryVersion: this.registryVersion,
      lastUpdate: this.lastUpdate,
    };
  }

  // =============================================================================
  // ENTERPRISE-GRADE REGISTRY METHODS
  // =============================================================================

  /**
   * Register an enhanced integration node type with enterprise features
   */
  public registerEnhancedNodeType(
    nodeType: EnhancedIntegrationNodeType,
    tenantId = "default",
  ): void {
    // Register in enhanced registry
    this.enhancedNodeTypes.set(nodeType.id, nodeType);

    // Register capability definition
    this.registerNodeCapability({
      id: nodeType.id,
      supportedModes: this.deriveNodeModes(nodeType),
      resources: this.extractResources(nodeType),
      operations: this.extractOperations(nodeType),
      contextAware: true,
      scalingProfile: "enterprise",
      tenantIsolation: true,
    });

    // Tenant isolation
    if (!this.tenantRegistries.has(tenantId)) {
      this.tenantRegistries.set(tenantId, new Map());
    }
    this.tenantRegistries.get(tenantId)?.set(nodeType.id, nodeType);

    // Update registry version
    this.registryVersion++;
    this.lastUpdate = Date.now();

    console.log(
      `🚀 Registered enhanced node: ${nodeType.displayName} (${nodeType.id})`,
      {
        modes: this.deriveNodeModes(nodeType),
        tenant: tenantId,
      },
    );
  }

  /**
   * Get enhanced node type with context resolution
   */
  public async getEnhancedNodeType(
    nodeId: string,
    context?: WorkflowContext,
    tenantId = "default",
  ): Promise<EnhancedIntegrationNodeType | undefined> {
    // Tenant-aware lookup
    const tenantRegistry = this.tenantRegistries.get(tenantId);
    let nodeType =
      tenantRegistry?.get(nodeId) || this.enhancedNodeTypes.get(nodeId);

    if (!nodeType || !context) {
      return nodeType;
    }

    // Context-aware resolution
    const resolvedContext = await this.resolveNodeContext(context);
    if (resolvedContext) {
      nodeType = await this.adaptNodeToContext(nodeType, resolvedContext);
    }

    return nodeType;
  }

  /**
   * Smart mode detection for unified nodes
   */
  public detectNodeMode(
    nodeId: string,
    context: WorkflowContext,
  ): "trigger" | "action" | "webhook" | "poll" {
    // Check capabilities
    const capabilities = this.nodeCapabilities.get(nodeId);
    if (!capabilities) {
      return "action"; // Default fallback
    }

    // Context-based detection
    if (
      context.isWorkflowStart &&
      capabilities.supportedModes.includes("trigger")
    ) {
      return "trigger";
    }

    if (
      context.hasInputConnections &&
      capabilities.supportedModes.includes("action")
    ) {
      return "action";
    }

    // Return first supported mode as fallback
    return capabilities.supportedModes[0] || "action";
  }

  /**
   * Dynamic property resolution based on context
   */
  public async resolveNodeProperties(
    nodeId: string,
    context: WorkflowContext,
  ): Promise<any[]> {
    const nodeType = await this.getEnhancedNodeType(
      nodeId,
      context,
      context.tenantId,
    );
    if (!nodeType) {
      return [];
    }

    const resolvedContext = await this.resolveNodeContext(context);
    if (!resolvedContext) {
      return nodeType.configuration?.properties || [];
    }

    // Filter properties based on resolved context
    return this.filterPropertiesByContext(
      nodeType.configuration?.properties || [],
      resolvedContext,
    );
  }

  /**
   * Register a context resolver for dynamic node adaptation
   */
  public registerContextResolver(resolver: ContextResolver): void {
    this.contextResolvers.set(resolver.id, resolver);
    console.log(`🧠 Registered context resolver: ${resolver.id}`);
  }

  /**
   * Plugin system for runtime extensions
   */
  public async installPlugin(plugin: RegistryPlugin): Promise<void> {
    await plugin.initialize(this);
    console.log(`🔌 Plugin installed: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Feature flag management
   */
  public setFeatureFlag(flag: string, enabled: boolean): void {
    this.featureFlags.set(flag, enabled);
    this.registryVersion++;
    console.log(`🏁 Feature flag ${flag}: ${enabled ? "enabled" : "disabled"}`);
  }

  public isFeatureEnabled(flag: string): boolean {
    return this.featureFlags.get(flag) ?? false;
  }

  /**
   * Performance monitoring
   */
  public recordNodeExecution(
    nodeId: string,
    executionTime: number,
    success: boolean,
  ): void {
    const metrics = this.performanceMetrics.get(nodeId) || {
      nodeId,
      executionCount: 0,
      averageExecutionTime: 0,
      errorRate: 0,
      lastExecuted: 0,
      resourceUsage: { cpu: 0, memory: 0, network: 0 },
    };

    metrics.executionCount++;
    metrics.averageExecutionTime =
      (metrics.averageExecutionTime * (metrics.executionCount - 1) +
        executionTime) /
      metrics.executionCount;
    metrics.errorRate = success
      ? metrics.errorRate * 0.95 // Decay error rate on success
      : Math.min(1, metrics.errorRate + 0.1); // Increase on failure
    metrics.lastExecuted = Date.now();

    this.performanceMetrics.set(nodeId, metrics);
  }

  public getNodeMetrics(nodeId: string): NodePerformanceMetrics | undefined {
    return this.performanceMetrics.get(nodeId);
  }

  // =============================================================================
  // PRIVATE ENTERPRISE METHODS
  // =============================================================================

  private setupPerformanceMonitoring(): void {
    // Set up periodic metric collection and cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Clean every minute
  }

  private initializeFeatureFlags(): void {
    // Initialize default feature flags
    this.featureFlags.set("enhanced_ui", true);
    this.featureFlags.set("context_aware_properties", true);
    this.featureFlags.set("performance_monitoring", true);
    this.featureFlags.set("multi_tenant", true);
  }

  private registerNodeCapability(capability: NodeCapabilityDefinition): void {
    this.nodeCapabilities.set(capability.id, capability);
  }

  private deriveNodeModes(
    nodeType: EnhancedIntegrationNodeType,
  ): ("trigger" | "action" | "webhook" | "poll")[] {
    const modes: ("trigger" | "action" | "webhook" | "poll")[] = [];

    if (nodeType.type === "trigger") modes.push("trigger");
    if (nodeType.type === "action") modes.push("action");
    if (nodeType.type === "webhook") modes.push("webhook");
    if (nodeType.configuration?.polling?.enabled) modes.push("poll");

    // Hybrid nodes support multiple modes
    if (nodeType.type === "hybrid" || !modes.length) {
      modes.push("trigger", "action");
    }

    return modes;
  }

  private extractResources(nodeType: EnhancedIntegrationNodeType): string[] {
    // Extract resource types from node configuration
    const resources = new Set<string>();

    // Analyze properties to detect resource types
    nodeType.configuration?.properties?.forEach((prop) => {
      if (prop.name === "resource" && prop.options) {
        prop.options.forEach((opt) => resources.add(opt.value as string));
      }
    });

    // Default resources if none found
    if (resources.size === 0) {
      if (nodeType.id && nodeType.id.toLowerCase().includes("gmail")) {
        (resources.add("email"),
          resources.add("label"),
          resources.add("draft"),
          resources.add("thread"));
      }
    }

    return Array.from(resources);
  }

  private extractOperations(
    nodeType: EnhancedIntegrationNodeType,
  ): Record<string, string[]> {
    const operations: Record<string, string[]> = {};

    // Extract operations from properties
    nodeType.configuration?.properties?.forEach((prop) => {
      if (prop.name === "operation" && prop.options) {
        prop.options.forEach((opt) => {
          const resource =
            prop.displayOptions?.show?.resource?.[0] || "default";
          if (!operations[resource]) operations[resource] = [];
          operations[resource].push(opt.value as string);
        });
      }
    });

    return operations;
  }

  private async resolveNodeContext(
    context: WorkflowContext,
  ): Promise<ResolvedContext | undefined> {
    // Get all applicable resolvers sorted by priority
    const resolvers = Array.from(this.contextResolvers.values()).sort(
      (a, b) => b.priority - a.priority,
    );

    // Apply first matching resolver
    for (const resolver of resolvers) {
      try {
        const resolved = await resolver.resolve(context);
        if (resolved) {
          return resolved;
        }
      } catch (error) {
        console.warn(`Context resolver ${resolver.id} failed:`, error);
      }
    }

    return undefined;
  }

  private async adaptNodeToContext(
    nodeType: EnhancedIntegrationNodeType,
    context: ResolvedContext,
  ): Promise<EnhancedIntegrationNodeType> {
    // Create adapted copy of node type
    const adaptedNode = { ...nodeType };

    // Adapt properties based on resolved context
    if (adaptedNode.configuration?.properties) {
      adaptedNode.configuration.properties = this.filterPropertiesByContext(
        adaptedNode.configuration.properties,
        context,
      );
    }

    return adaptedNode;
  }

  private filterPropertiesByContext(
    properties: any[],
    context: ResolvedContext,
  ): any[] {
    // Filter and adapt properties based on mode and capabilities
    return properties.filter((prop) => {
      // Context-aware property filtering logic
      if (prop.displayOptions?.show?.mode) {
        return prop.displayOptions.show.mode.includes(context.mode);
      }
      return true;
    });
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const [nodeId, metrics] of this.performanceMetrics) {
      if (metrics.lastExecuted < cutoff) {
        this.performanceMetrics.delete(nodeId);
      }
    }
  }
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance();

// Transform node is now registered automatically via core/nodes/definitions import in main.tsx

// Also export the class for testing purposes
export { NodeRegistry };
