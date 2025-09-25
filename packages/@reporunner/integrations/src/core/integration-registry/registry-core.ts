import { EventEmitter } from 'node:events';
import type { BaseIntegration, IntegrationConfig, IntegrationContext } from './base-integration';

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
          throw new Error(`Dependency ${dep} for ${definition.name} is not registered`);
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
      definition.config.supportedFeatures.forEach((cap) => this.capabilities.add(cap));
    }

    this.emit('definition:registered', {
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
        throw new Error(`Cannot unregister ${name}: ${otherName} depends on it`);
      }
    }

    // Remove all instances of this integration
    const instancesToRemove: string[] = [];
    for (const [id, instance] of this.instances.entries()) {
      if (instance.definition.name === name) {
        instancesToRemove.push(id);
      }
    }
