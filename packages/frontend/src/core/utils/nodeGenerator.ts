// Node Generator Utility
// Helps developers quickly scaffold new nodes with proper separation of concerns

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface NodeGeneratorOptions {
  name: string; // e.g., 'discord'
  displayName: string; // e.g., 'Discord'
  category: string; // e.g., 'communication'
  icon: string; // Icon URL or emoji
  description: string; // Node description
  nodeTypes: Array<{
    // Types of nodes to generate
    id: string; // e.g., 'send-message'
    displayName: string; // e.g., 'Send Message'
    type: 'trigger' | 'action' | 'condition';
    description: string;
  }>;
  credentials?: Array<{
    // Required credentials
    name: string;
    required: boolean;
    description: string;
  }>;
  properties?: Array<{
    // Basic properties to include
    name: string;
    displayName: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Generates node.ts file content
 */
function generateNodeFile(options: NodeGeneratorOptions): string {
  const { name, displayName, icon, category, description } = options;

  return `// ${displayName} Node - Core Definition
import { UNIFIED_CATEGORIES } from '../../../../constants/categories'

export const ${name}NodeMetadata = {
  id: '${name}',
  name: '${displayName}',
  displayName: '${displayName}',
  icon: '${icon}',
  category: UNIFIED_CATEGORIES.${category.toUpperCase()},
  description: '${description}',
  version: 1,
  
  // Input/Output definitions
  inputs: [
    {
      name: 'main',
      type: 'main',
      displayName: 'Input Data',
      description: 'Input data for the node',
      required: false
    }
  ],
  
  outputs: [
    {
      name: 'main', 
      type: 'main',
      displayName: 'Output Data',
      description: 'Output data from the node'
    }
  ],
  
  // Execution settings
  continueOnFail: false,
  retryOnFail: false,
  
  // UI categorization
  codex: {
    categories: ['${category}']
  }
}`;
}

/**
 * Generates credentials.ts file content
 */
function generateCredentialsFile(options: NodeGeneratorOptions): string {
  const { name, credentials = [] } = options;

  const credentialsArray =
    credentials.length > 0
      ? credentials
          .map(
            (cred) => `  {
    name: '${cred.name}',
    required: ${cred.required},
    description: '${cred.description}'
  }`
          )
          .join(',\n')
      : '  // No credentials required';

  return `// ${options.displayName} Node - Credentials Configuration

export const ${name}Credentials = [
${credentialsArray}
]`;
}

/**
 * Generates properties.ts file content
 */
function generatePropertiesFile(options: NodeGeneratorOptions): string {
  const { name, displayName, nodeTypes, properties = [] } = options;

  let content = `// ${displayName} Node - Dynamic Properties Configuration
import type { NodeProperty } from '../../../../types/dynamicProperties'

`;

  nodeTypes.forEach((nodeType) => {
    const propertiesArray = properties
      .map(
        (prop) => `  {
    name: '${prop.name}',
    displayName: '${prop.displayName}',
    type: '${prop.type}',
    description: '${prop.description}',
    required: ${prop.required}${prop.type === 'text' ? ',\n    rows: 4' : ''}${
      prop.type === 'select' ? ',\n    options: [\n      // Add options here\n    ]' : ''
    }
  }`
      )
      .join(',\n');

    content += `// ${displayName} ${nodeType.displayName} Properties
export const ${name}${nodeType.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Properties: NodeProperty[] = [
${propertiesArray || '  // Add properties here'}
]

`;
  });

  return content;
}

/**
 * Generates actions.ts file content
 */
function generateActionsFile(options: NodeGeneratorOptions): string {
  const { displayName, nodeTypes } = options;

  let content = `// ${displayName} Node - Action Logic
import type { PropertyFormState } from '../../../../types/dynamicProperties'

`;

  nodeTypes.forEach((nodeType) => {
    const functionName = `execute${displayName}${nodeType.displayName.replace(/\s+/g, '')}`;

    content += `/**
 * Execute ${displayName} ${nodeType.displayName}
 */
export async function ${functionName}(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing ${displayName} ${nodeType.displayName} with parameters:', parameters)
  console.log('Using credentials:', credentials)
  
  // TODO: Implement actual ${displayName} API integration
  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    // Add your result data here
  }
  
  return result
}

`;
  });

  content += `/**
 * Test ${displayName} connection
 */
export async function test${displayName}Connection(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  console.log('Testing ${displayName} connection with credentials:', credentials)
  
  // TODO: Implement actual ${displayName} connection test
  return {
    success: true,
    message: 'Successfully connected to ${displayName}'
  }
}`;

  return content;
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
  )
  .join(',\n')}
  ],
  
  // Action executors
  actions: {
${nodeTypes
  .map((nodeType) => {
    const actionName = nodeType.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const functionName = `execute${displayName}${nodeType.displayName.replace(/\s+/g, '')}`;
    return `    ${actionName}: ${functionName}`;
  })
  .join(',\n')},
    test: test${displayName}Connection
  }
}

// Export individual components
export {
  ${name}NodeMetadata,
  ${name}Credentials,
  ${propertyImports},
  ${actionImports},
  test${displayName}Connection
}`;

  return content;
}

/**
 * Main function to generate a complete node structure
 */
export function generateNode(
  options: NodeGeneratorOptions,
  basePath: string = './src/nodes/definitions'
) {
  const { name, category } = options;
  const nodePath = join(basePath, category, name);

  // Create directory structure
  mkdirSync(nodePath, { recursive: true });

  // Generate files
  const files = {
    'node.ts': generateNodeFile(options),
    'credentials.ts': generateCredentialsFile(options),
    'properties.ts': generatePropertiesFile(options),
    'actions.ts': generateActionsFile(options),
    'index.ts': generateIndexFile(options),
  };

  // Write files
  Object.entries(files).forEach(([filename, content]) => {
    writeFileSync(join(nodePath, filename), content);
  });
  Object.keys(files).forEach((_filename) => {});

  return nodePath;
}

// Example usage:
export const exampleDiscordNode: NodeGeneratorOptions = {
  name: 'discord',
  displayName: 'Discord',
  category: 'communication',
  icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
  description: 'Discord server and messaging integration',
  nodeTypes: [
    {
      id: 'send-message',
      displayName: 'Send Message',
      type: 'action',
      description: 'Send messages to Discord channels',
    },
    {
      id: 'create-channel',
      displayName: 'Create Channel',
      type: 'action',
      description: 'Create new Discord channels',
    },
  ],
  credentials: [
    {
      name: 'discord',
      required: true,
      description: 'Discord Bot Token',
    },
  ],
  properties: [
    {
      name: 'channel',
      displayName: 'Channel',
      type: 'string',
      description: 'Discord channel ID or name',
      required: true,
    },
    {
      name: 'message',
      displayName: 'Message',
      type: 'text',
      description: 'Message content to send',
      required: true,
    },
  ],
};

// CLI usage (if running directly):
// generateNode(exampleDiscordNode)`
