export function getCredentialsTemplate(credentialTypes: string[]): string {
  if (!credentialTypes || credentialTypes.length === 0) {
    return `// No credentials required for this node
export {};`;
  }

  return `import {
  ICredentialType,
  INodeProperties,
} from '@klikkflow/core';

export class {{name}}Api implements ICredentialType {
  name = '{{name}}Api';
  displayName = '{{name}} API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'API key for {{name}}',
    },
  ];

  test() {
    // TODO: Implement credential test
    return Promise.resolve();
  }
}`;
}

export function getPropertiesTemplate(_template: string): string {
  return `import { INodeProperties } from '@klikkflow/core';

export const {{name}}Properties: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    options: [
      {
        name: 'Get Data',
        value: 'getData',
        description: 'Get data from {{name}}',
        action: 'Get data',
      },
    ],
    default: 'getData',
  },
  // Add more properties here
];`;
}
