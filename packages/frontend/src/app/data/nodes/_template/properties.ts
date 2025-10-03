/**
 * {INTEGRATION_NAME} Node Properties
 *
 * Define the configuration UI for this integration
 */

import type { NodeProperty } from '@/core/types/dynamicProperties';

export const {INTEGRATION_NAME}Properties: NodeProperty[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'select',
    default: '',
    required: true,
    description: 'Operation to perform',
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get resource',
      },
      {
        name: 'Create',
        value: 'create',
        description: 'Create resource',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update resource',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete resource',
      },
    ],
  },

  // Add more properties as needed
  {
    displayName: 'Resource ID',
    name: 'resourceId',
    type: 'string',
    default: '',
    required: true,
    description: 'ID of the resource',
    displayOptions: {
      show: {
        operation: ['get', 'update', 'delete'],
      },
    },
  },
];
