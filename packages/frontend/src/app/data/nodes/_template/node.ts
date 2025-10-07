/**
 * {INTEGRATION_NAME} Node Definition
 */


export const {INTEGRATION_NAME}Node: NodeDefinition = {
  id: '{integration-id}',
  name: '{INTEGRATION_NAME}',
  category: '{CATEGORY}', // ai-ml, communication, data-storage, etc.
  description: 'Brief description of what this integration does',

  icon: {
    type: 'lucide', // or 'custom'
    name: 'IconName', // Lucide icon name
  },

  version: '1.0.0',

  inputs: {
    default: {
      type: 'main',
      displayName: 'Input',
      required: false,
    },
  },

  outputs: {
    default: {
      type: 'main',
      displayName: 'Output',
    },
  },

  credentials: [
    {
      name: '{integration-id}',
      required: true,
      displayName: '{INTEGRATION_NAME} Credentials',
    },
  ],

  properties: [], // Imported from properties.ts

  execute: async (input, context) => {
    // Implementation in actions.ts
    const { default: actions } = await import('./actions');
    return actions.execute(input, context);
  },
};
