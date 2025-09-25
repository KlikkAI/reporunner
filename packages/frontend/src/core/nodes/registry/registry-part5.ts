/**
 * Get registry statistics
 * @returns Object with registry statistics
 */
public
getStatistics();
{
  return {
      nodeTypesCount: this.nodeTypes.size,
      enhancedNodeTypesCount: this.enhancedNodeTypes.size,
      credentialTypesCount: this.credentialTypes.size,
      categoriesCount: this.categories.size,
      triggerNodes: this.getAllNodeTypes().filter((n) => n.description.group.includes('trigger'))
        .length,
      actionNodes: this.getAllNodeTypes().filter((n) => !n.description.group.includes('trigger'))
        .length,
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
public
registerEnhancedNodeType(
    nodeType: EnhancedIntegrationNodeType,
    tenantId = 'default'
  )
: void
{
  // Register in enhanced registry
  this.enhancedNodeTypes.set(nodeType.id, nodeType);

  // Register capability definition
  this.registerNodeCapability({
    id: nodeType.id,
    supportedModes: this.deriveNodeModes(nodeType),
    resources: this.extractResources(nodeType),
    operations: this.extractOperations(nodeType),
    contextAware: true,
    scalingProfile: 'enterprise',
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
}

/**
 * Get enhanced node type with context resolution
 */
public
async;
getEnhancedNodeType(
    nodeId: string,
    context?: WorkflowContext,
    tenantId = 'default'
  )
: Promise<EnhancedIntegrationNodeType | undefined>
{
  // Tenant-aware lookup
  const tenantRegistry = this.tenantRegistries.get(tenantId);
  let nodeType = tenantRegistry?.get(nodeId) || this.enhancedNodeTypes.get(nodeId);

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
public
detectNodeMode(
    nodeId: string,
    context: WorkflowContext
  )
: 'trigger' | 'action' | 'webhook' | 'poll'
{
    // Check capabilities
    const capabilities = this.nodeCapabilities.get(nodeId);
    if (!capabilities) {
      return 'action'; // Default fallback
    }

    // Context-based detection
    if (context.isWorkflowStart && capabilities.supportedModes.includes('trigger')) {
      return 'trigger';
    }
