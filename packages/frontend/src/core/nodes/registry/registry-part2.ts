* Get singleton instance of NodeRegistry
   */
  public static getInstance(): NodeRegistry
{
  if (!NodeRegistry.instance) {
    NodeRegistry.instance = new NodeRegistry();
    NodeRegistry.instance.initializeEnterpriseFeatures();
  }
  return NodeRegistry.instance;
}

/**
 * Initialize enterprise-grade features
 */
private
initializeEnterpriseFeatures();
: void
{
  // Initialize default tenant
  this.tenantRegistries.set('default', new Map());

  // Set up performance monitoring
  this.setupPerformanceMonitoring();

  // Initialize feature flags
  this.initializeFeatureFlags();
}

/**
 * Register a new node type
 * @param nodeType The node type to register
 */
public
registerNodeType(nodeType: INodeType)
: void
{
  const { name } = nodeType.description;
  if (this.nodeTypes.has(name)) {
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
public
registerCredentialType(credentialType: ICredentialType)
: void
{
  const { name } = credentialType;
  if (this.credentialTypes.has(name)) {
  }
  this.credentialTypes.set(name, credentialType);
}

/**
 * Get a node type by its name
 * @param typeName The name of the node type
 * @returns The node type or undefined if not found
 */
public
getNodeType(typeName: string)
: INodeType | undefined
{
  return this.nodeTypes.get(typeName);
}

/**
 * Get a node type description by its name
 * @param typeName The name of the node type
 * @returns The node type description or undefined if not found
 */
public
getNodeTypeDescription(typeName: string)
: INodeTypeDescription | undefined
{
    // First try regular node types
    const regularNode = this.nodeTypes.get(typeName);
    if (regularNode) {
      return regularNode.description;
    }

    // Then try enhanced node types (convert to INodeTypeDescription format)
    const enhancedNode = this.enhancedNodeTypes.get(typeName);
    if (enhancedNode) {
      return {
        displayName: enhancedNode.displayName || enhancedNode.name,
        name: enhancedNode.name,
        icon: enhancedNode.icon || 'fa:envelope',
        group: [enhancedNode.type === 'trigger' ? 'trigger' : 'transform'],
        version: 1,
        description: enhancedNode.description || '',
        defaults: {
          name: enhancedNode.displayName || enhancedNode.name,
          color: (enhancedNode as any).color || '#DD4B39',
        },
        inputs: (enhancedNode.inputs || [{ type: 'main' }]).map((input) =>
          typeof input === 'string' ? input : input.type || 'main'
        ),
        outputs: (enhancedNode.outputs || [{ type: 'main' }]).map((output) =>
          typeof output === 'string' ? output : output.type || 'main'
        ),
        categories: enhancedNode.codex?.categories || [],
        properties: [], // Enhanced nodes use different property system
        // Preserve custom UI components from enhanced nodes
        customBodyComponent: (enhancedNode as any).customBodyComponent,
        // customPropertiesPanel: (enhancedNode as any).customPropertiesPanel,
      };
    }
