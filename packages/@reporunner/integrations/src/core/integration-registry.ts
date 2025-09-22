import { EventEmitter } from "events";
import {
  BaseIntegration,
  IntegrationConfig,
  IntegrationContext,
} from "./base-integration";

export interface IntegrationDefinition {
  name: string;
  version: string;
  constructor: typeof BaseIntegration;
  config: IntegrationConfig;
  dependencies?: string[];
  requiredPermissions?: string[];
  isBuiltIn?: boolean;
  isEnabled?: boolean;
}

export interface IntegrationInstance {
  id: string;
  definition: IntegrationDefinition;
  integration: BaseIntegration;
  context: IntegrationContext;
  createdAt: Date;
  lastActivity?: Date;
}

export interface IntegrationFilter {
  category?: string;
  tags?: string[];
  capabilities?: string[];
  isEnabled?: boolean;
  isBuiltIn?: boolean;
  userId?: string;
}

export class IntegrationRegistry extends EventEmitter {
  private definitions: Map<string, IntegrationDefinition> = new Map();
  private instances: Map<string, IntegrationInstance> = new Map();
  private categories: Set<string> = new Set();
  private tags: Set<string> = new Set();
  private capabilities: Set<string> = new Set();

  constructor() {
    super();
  }

  /**
   * Register integration definition
   */
  registerDefinition(definition: IntegrationDefinition): void {
    if (this.definitions.has(definition.name)) {
      throw new Error(`Integration ${definition.name} is already registered`);
    }

    // Validate dependencies
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (!this.definitions.has(dep)) {
          throw new Error(
            `Dependency ${dep} for ${definition.name} is not registered`,
          );
        }
      }
    }

    // Store definition
    this.definitions.set(definition.name, definition);

    // Update categories, tags, and capabilities
    if (definition.config.category) {
      this.categories.add(definition.config.category);
    }
    if (definition.config.tags) {
      definition.config.tags.forEach((tag) => this.tags.add(tag));
    }
    if (definition.config.supportedFeatures) {
      definition.config.supportedFeatures.forEach((cap) =>
        this.capabilities.add(cap),
      );
    }

    this.emit("definition:registered", {
      name: definition.name,
      version: definition.version,
    });
  }

  /**
   * Unregister integration definition
   */
  unregisterDefinition(name: string): boolean {
    const definition = this.definitions.get(name);
    if (!definition) {
      return false;
    }

    // Check if any other integrations depend on this one
    for (const [otherName, otherDef] of this.definitions.entries()) {
      if (otherDef.dependencies?.includes(name)) {
        throw new Error(
          `Cannot unregister ${name}: ${otherName} depends on it`,
        );
      }
    }

    // Remove all instances of this integration
    const instancesToRemove: string[] = [];
    for (const [id, instance] of this.instances.entries()) {
      if (instance.definition.name === name) {
        instancesToRemove.push(id);
      }
    }

    for (const id of instancesToRemove) {
      this.destroyInstance(id);
    }

    // Remove definition
    this.definitions.delete(name);

    this.emit("definition:unregistered", { name });

    return true;
  }

  /**
   * Get integration definition
   */
  getDefinition(name: string): IntegrationDefinition | undefined {
    return this.definitions.get(name);
  }

  /**
   * Get all definitions
   */
  getAllDefinitions(): IntegrationDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Find definitions by filter
   */
  findDefinitions(filter: IntegrationFilter): IntegrationDefinition[] {
    const results: IntegrationDefinition[] = [];

    this.definitions.forEach((definition) => {
      // Apply filters
      if (filter.category && definition.config.category !== filter.category) {
        return;
      }

      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some((tag) =>
          definition.config.tags?.includes(tag),
        );
        if (!hasTag) {
          return;
        }
      }

      if (filter.capabilities && filter.capabilities.length > 0) {
        const hasCap = filter.capabilities.some((cap) =>
          definition.config.supportedFeatures?.includes(cap),
        );
        if (!hasCap) {
          return;
        }
      }

      if (
        filter.isEnabled !== undefined &&
        definition.isEnabled !== filter.isEnabled
      ) {
        return;
      }

      if (
        filter.isBuiltIn !== undefined &&
        definition.isBuiltIn !== filter.isBuiltIn
      ) {
        return;
      }

      results.push(definition);
    });

    return results;
  }

  /**
   * Create integration instance
   */
  async createInstance(
    name: string,
    context: IntegrationContext,
  ): Promise<string> {
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
      const integration = new IntegrationClass(
        definition.config,
      ) as BaseIntegration;

      // Initialize integration
      await integration.initialize(context);

      // Generate instance ID
      const instanceId = this.generateInstanceId();

      // Store instance
      const instance: IntegrationInstance = {
        id: instanceId,
        definition,
        integration,
        context,
        createdAt: new Date(),
      };

      this.instances.set(instanceId, instance);

      // Set up event listeners
      this.setupInstanceListeners(instanceId, integration);

      this.emit("instance:created", {
        id: instanceId,
        name: definition.name,
        userId: context.userId,
      });

      return instanceId;
    } catch (error: any) {
      this.emit("instance:creation_failed", {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup instance event listeners
   */
  private setupInstanceListeners(
    instanceId: string,
    integration: BaseIntegration,
  ): void {
    // Forward integration events
    integration.on("state:changed", (data) => {
      this.emit("instance:state_changed", { instanceId, ...data });
    });

    integration.on("error", (data) => {
      this.emit("instance:error", { instanceId, ...data });
    });

    integration.on("action:executed", (data) => {
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.lastActivity = new Date();
      }
      this.emit("instance:action_executed", { instanceId, ...data });
    });
  }

  /**
   * Get integration instance
   */
  getInstance(instanceId: string): IntegrationInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances
   */
  getAllInstances(): IntegrationInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances by integration name
   */
  getInstancesByName(name: string): IntegrationInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.definition.name === name,
    );
  }

  /**
   * Get instances by user
   */
  getInstancesByUser(userId: string): IntegrationInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.context.userId === userId,
    );
  }

  /**
   * Execute action on instance
   */
  async executeAction(
    instanceId: string,
    action: string,
    params: any,
  ): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    try {
      const result = await instance.integration.execute(action, params);

      this.emit("instance:action_executed", {
        instanceId,
        action,
        params,
      });

      return result;
    } catch (error: any) {
      this.emit("instance:action_failed", {
        instanceId,
        action,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Destroy integration instance
   */
  async destroyInstance(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return false;
    }

    try {
      // Cleanup integration
      await instance.integration.cleanup();

      // Remove instance
      this.instances.delete(instanceId);

      this.emit("instance:destroyed", {
        id: instanceId,
        name: instance.definition.name,
      });

      return true;
    } catch (error: any) {
      this.emit("instance:destroy_failed", {
        id: instanceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Suspend instance
   */
  suspendInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return false;
    }

    instance.integration.suspend();

    this.emit("instance:suspended", {
      id: instanceId,
      name: instance.definition.name,
    });

    return true;
  }

  /**
   * Resume instance
   */
  async resumeInstance(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return false;
    }

    await instance.integration.resume();

    this.emit("instance:resumed", {
      id: instanceId,
      name: instance.definition.name,
    });

    return true;
  }

  /**
   * Enable integration
   */
  enableIntegration(name: string): boolean {
    const definition = this.definitions.get(name);
    if (!definition) {
      return false;
    }

    definition.isEnabled = true;

    this.emit("definition:enabled", { name });

    return true;
  }

  /**
   * Disable integration
   */
  disableIntegration(name: string): boolean {
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

    this.emit("definition:disabled", { name });

    return true;
  }

  /**
   * Get categories
   */
  getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Get tags
   */
  getTags(): string[] {
    return Array.from(this.tags);
  }

  /**
   * Get capabilities
   */
  getCapabilities(): string[] {
    return Array.from(this.capabilities);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDefinitions: number;
    enabledDefinitions: number;
    totalInstances: number;
    instancesByIntegration: Record<string, number>;
    instancesByUser: Record<string, number>;
    categories: number;
    tags: number;
    capabilities: number;
  } {
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
      stats.instancesByIntegration[name] =
        (stats.instancesByIntegration[name] || 0) + 1;

      const userId = instance.context.userId;
      stats.instancesByUser[userId] = (stats.instancesByUser[userId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Generate instance ID
   */
  private generateInstanceId(): string {
    return `int_instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all
   */
  clearAll(): void {
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
