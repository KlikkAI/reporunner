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
