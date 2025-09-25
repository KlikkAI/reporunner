}

/**
 * Generates index.ts file content
 */
function generateIndexFile(options: NodeGeneratorOptions): string {
  const { name, displayName, nodeTypes } = options;

  let content = `// ${displayName} Node - Main Export
import type { EnhancedIntegrationNodeType } from '../../../../types/dynamicProperties'
import { ${name}NodeMetadata } from './node'
import { ${name}Credentials } from './credentials'
import { `;

  // Import properties
  const propertyImports = nodeTypes
    .map(
      (nodeType) =>
        `${name}${nodeType.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Properties`
    )
    .join(', ');

  content += `${propertyImports} } from './properties'
import { `;

  // Import actions
  const actionImports = nodeTypes
    .map((nodeType) => `execute${displayName}${nodeType.displayName.replace(/\s+/g, '')}`)
    .join(', ');

  content += `${actionImports}, test${displayName}Connection } from './actions'

`;

  // Generate node type exports
  nodeTypes.forEach((nodeType) => {
    const nodeName = `${name}${nodeType.displayName.replace(/\s+/g, '')}Node`;
    const propertiesName = `${name}${nodeType.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Properties`;

    content += `// ${displayName} ${nodeType.displayName} Node
export const ${nodeName}: EnhancedIntegrationNodeType = {
  ...${name}NodeMetadata,
  id: '${name}-${nodeType.id}',
  name: '${name}-${nodeType.id}',
  displayName: '${displayName} ${nodeType.displayName}',
  type: '${nodeType.type}',
  description: '${nodeType.description}',
  
  configuration: {
    properties: ${propertiesName},
    credentials: ${name}Credentials${
      nodeType.type === 'trigger'
        ? `,
    polling: {
      enabled: true,
      defaultInterval: 60000, // 1 minute
      minInterval: 30000,     // 30 seconds
      maxInterval: 3600000    // 1 hour
    }`
        : ''
    }
  }
}

`;
  });

  // Generate combined integration export
  const nodeNames = nodeTypes.map(
    (nodeType) => `${name}${nodeType.displayName.replace(/\s+/g, '')}Node`
  );

  content += `// Combined ${displayName} Integration
export const ${name}Integration = {
  id: '${name}',
  name: '${displayName}',
  icon: ${name}NodeMetadata.icon,
  category: ${name}NodeMetadata.category,
  description: ${name}NodeMetadata.description,
  isConnected: false,
  credentials: ${name}Credentials,
  
  // Enhanced node types
  enhancedNodeTypes: [
    ${nodeNames.join(',\n    ')}
  ],
  
  // Legacy node types (for backward compatibility)
  nodeTypes: [
${nodeTypes
  .map(
    (nodeType) => `    {
      id: '${name}-${nodeType.id}',
      name: '${displayName} ${nodeType.displayName}',
      type: '${nodeType.type}',
      icon: ${name}NodeMetadata.icon,
      description: '${nodeType.description}',
      inputs: [],
      outputs: []
    }`
