this.featureFlags.set('multi_tenant', true);
}

  private registerNodeCapability(capability: NodeCapabilityDefinition): void
{
  this.nodeCapabilities.set(capability.id, capability);
}

private
deriveNodeModes(
    nodeType: EnhancedIntegrationNodeType
  )
: ('trigger' | 'action' | 'webhook' | 'poll')[]
{
  const modes: ('trigger' | 'action' | 'webhook' | 'poll')[] = [];

  if (nodeType.type === 'trigger') modes.push('trigger');
  if (nodeType.type === 'action') modes.push('action');
  if (nodeType.type === 'webhook') modes.push('webhook');
  if (nodeType.configuration?.polling?.enabled) modes.push('poll');

  // Default modes if none specified
  if (!modes.length) {
    modes.push('action');
  }

  return modes;
}

private
extractResources(nodeType: EnhancedIntegrationNodeType)
: string[]
{
  // Extract resource types from node configuration
  const resources = new Set<string>();

  // Analyze properties to detect resource types
  nodeType.configuration?.properties?.forEach((prop: any) => {
    if (prop.name === 'resource' && prop.options) {
      prop.options.forEach((opt: any) => resources.add(opt.value as string));
    }
  });

  // Default resources if none found
  if (resources.size === 0) {
    if (nodeType.id?.toLowerCase().includes('gmail')) {
      resources.add('email'),
        resources.add('label'),
        resources.add('draft'),
        resources.add('thread');
    }
  }

  return Array.from(resources);
}

private
extractOperations(nodeType: EnhancedIntegrationNodeType)
: Record<string, string[]>
{
  const operations: Record<string, string[]> = {};

  // Extract operations from properties
  nodeType.configuration?.properties?.forEach((prop: any) => {
    if (prop.name === 'operation' && prop.options) {
      prop.options.forEach((opt: any) => {
        const resource = prop.displayOptions?.show?.resource?.[0] || 'default';
        if (!operations[resource]) operations[resource] = [];
        operations[resource].push(opt.value as string);
      });
    }
  });

  return operations;
}

private
async;
resolveNodeContext(context: WorkflowContext)
: Promise<ResolvedContext | undefined>
{
  // Get all applicable resolvers sorted by priority
  const resolvers = Array.from(this.contextResolvers.values()).sort(
    (a, b) => b.priority - a.priority
  );

  // Apply first matching resolver
  for (const resolver of resolvers) {
    try {
      const resolved = await resolver.resolve(context);
      if (resolved) {
        return resolved;
      }
    } catch (_error) {}
  }

  return undefined;
}

private
async;
adaptNodeToContext(
    nodeType: EnhancedIntegrationNodeType,
    context: ResolvedContext
  )
: Promise<EnhancedIntegrationNodeType>
{
    // Create adapted copy of node type
    const adaptedNode = { ...nodeType };

    // Adapt properties based on resolved context
    if (adaptedNode.configuration?.properties) {
      adaptedNode.configuration.properties = this.filterPropertiesByContext(
        adaptedNode.configuration.properties,
        context
      );
    }
