.join(',\n')
      : '  // No credentials required'

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
