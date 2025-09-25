return undefined;
}

  /**
   * Get a credential type by its name
   * @param typeName The name of the credential type
   * @returns The credential type or undefined if not found
   */
  public getCredentialType(typeName: string): ICredentialType | undefined
{
  return this.credentialTypes.get(typeName);
}

/**
 * Get all registered node types
 * @returns Array of all node types
 */
public
getAllNodeTypes();
: INodeType[]
{
  return Array.from(this.nodeTypes.values());
}

/**
 * Get all node type descriptions
 * @returns Array of all node type descriptions including enhanced nodes
 */
public
getAllNodeTypeDescriptions();
: INodeTypeDescription[]
{
  // Get regular node descriptions
  const regularNodes = Array.from(this.nodeTypes.values()).map((nodeType) => nodeType.description);

  // Get enhanced node descriptions (convert to INodeTypeDescription format)
  const enhancedNodes = Array.from(this.enhancedNodeTypes.values()).map(
    (enhancedNode): INodeTypeDescription => ({
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
    })
  );

  return [...regularNodes, ...enhancedNodes];
}

/**
 * Get all credential types
 * @returns Array of all credential types
 */
public
getAllCredentialTypes();
: ICredentialType[]
{
  return Array.from(this.credentialTypes.values());
}

/**
 * Test a node type with given parameters and credentials
 * @param typeName The name of the node type
 * @param parameters The parameters to test with
 * @param credentials The credentials to use
 * @returns Test result
 */
public
async;
testNodeType(
    typeName: string,
    parameters: Record<string, any> = {},
    credentials: Record<string, any> = {}
  )
: Promise<
{
  success: boolean;
  message: string;
  data?: any
}
>
{
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
          const keys = name.split('.');
