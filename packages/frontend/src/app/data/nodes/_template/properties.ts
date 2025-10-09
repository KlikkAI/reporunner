/**
 * Template Integration Node Properties
 * Template: Replace TemplateIntegration with your integration name
 *
 * Define the configuration UI for this integration
 */

type NodeProperty = {
  displayName: string;
  name: string;
  type: string;
  default: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string; description?: string }>;
  displayOptions?: any;
};

// Template: Replace TemplateIntegration with your integration name
export const TemplateIntegrationProperties: NodeProperty[] = [
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
