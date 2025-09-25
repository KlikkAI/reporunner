let value = parameters;
for (const key of keys) {
  value = value?.[key];
}
return value !== undefined ? value : defaultValue;
},
        getCredentials: (credentialType: string) =>
{
  return credentials[credentialType] || credentials;
}
,
      }

return await nodeType.test.call(mockContext);
} catch (error: any)
{
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
  public getNodeTypesByCategory(category: string): INodeType[]
{
  return Array.from(this.nodeTypes.values()).filter((nodeType) =>
      nodeType.description.categories?.includes(category)
    );
}

/**
 * Get all categories
 * @returns Array of all registered categories
 */
public
getAllCategories();
: string[]
{
  return Array.from(this.categories);
}

/**
 * Check if a node type is registered
 * @param typeName The name of the node type
 * @returns True if the node type is registered
 */
public
hasNodeType(typeName: string)
: boolean
{
  return this.nodeTypes.has(typeName);
}

/**
 * Check if a credential type is registered
 * @param typeName The name of the credential type
 * @returns True if the credential type is registered
 */
public
hasCredentialType(typeName: string)
: boolean
{
  return this.credentialTypes.has(typeName);
}

/**
 * Search for node types by display name or description
 * @param query The search query
 * @returns Array of matching node types
 */
public
searchNodeTypes(query: string)
: INodeType[]
{
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
public
clear();
: void
{
  this.nodeTypes.clear();
  this.credentialTypes.clear();
  this.categories.clear();
}

/**
 * Get all enhanced node types for debugging
 */
public
getAllEnhancedNodeTypes();
: EnhancedIntegrationNodeType[]
{
  return Array.from(this.enhancedNodeTypes.values());
}

/**
 * Get enhanced node type synchronously
 * @param nodeId The node type ID to get
 * @returns Enhanced node type or undefined if not found
 */
public
getEnhancedNodeTypeSync(nodeId: string)
: EnhancedIntegrationNodeType | undefined
{
  return this.enhancedNodeTypes.get(nodeId);
}
