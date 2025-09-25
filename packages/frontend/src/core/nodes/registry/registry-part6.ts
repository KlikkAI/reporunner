if (context.hasInputConnections && capabilities.supportedModes.includes('action')) {
  return 'action';
}

// Return first supported mode as fallback
return capabilities.supportedModes[0] || 'action';
}

  /**
   * Dynamic property resolution based on context
   */
  public async resolveNodeProperties(nodeId: string, context: WorkflowContext): Promise<any[]>
{
  const nodeType = await this.getEnhancedNodeType(nodeId, context, context.tenantId);
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
      resolvedContext
    );
}

/**
 * Register a context resolver for dynamic node adaptation
 */
public
registerContextResolver(resolver: ContextResolver)
: void
{
  this.contextResolvers.set(resolver.id, resolver);
}

/**
 * Plugin system for runtime extensions
 */
public
async;
installPlugin(plugin: RegistryPlugin)
: Promise<void>
{
  await plugin.initialize(this);
}

/**
 * Feature flag management
 */
public
setFeatureFlag(flag: string, enabled: boolean)
: void
{
  this.featureFlags.set(flag, enabled);
  this.registryVersion++;
}

public
isFeatureEnabled(flag: string)
: boolean
{
  return this.featureFlags.get(flag) ?? false;
}

/**
 * Performance monitoring
 */
public
recordNodeExecution(nodeId: string, executionTime: number, success: boolean)
: void
{
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
    (metrics.averageExecutionTime * (metrics.executionCount - 1) + executionTime) /
    metrics.executionCount;
  metrics.errorRate = success
    ? metrics.errorRate * 0.95 // Decay error rate on success
    : Math.min(1, metrics.errorRate + 0.1); // Increase on failure
  metrics.lastExecuted = Date.now();

  this.performanceMetrics.set(nodeId, metrics);
}

public
getNodeMetrics(nodeId: string)
: NodePerformanceMetrics | undefined
{
  return this.performanceMetrics.get(nodeId);
}

// =============================================================================
// PRIVATE ENTERPRISE METHODS
// =============================================================================

private
setupPerformanceMonitoring();
: void
{
  // Set up periodic metric collection and cleanup
  setInterval(() => {
    this.cleanupOldMetrics();
  }, 60000); // Clean every minute
}

private
initializeFeatureFlags();
: void
{
    // Initialize default feature flags
    this.featureFlags.set('enhanced_ui', true);
    this.featureFlags.set('context_aware_properties', true);
    this.featureFlags.set('performance_monitoring', true);
