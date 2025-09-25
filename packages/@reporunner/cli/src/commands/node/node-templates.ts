writeFileSync(join(nodeDir, 'src/properties.ts'), Mustache.render(propertiesTemplate, data));

writeFileSync(join(nodeDir, 'README.md'), Mustache.render(readmeTemplate, data));

writeFileSync(join(nodeDir, 'tsconfig.json'), tsConfigTemplate);

// Create src directory
ensureDirSync(join(nodeDir, 'src'));
}

function getNodeTemplate(template: string): string {
  const templates = {
    basic: `import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from '@reporunner/core';

export class {{name}} implements INodeType {
  description: INodeTypeDescription = {
    displayName: '{{name}}',
    name: '{{name}}',
    icon: 'file:{{name}}.svg',
    group: ['{{category}}'],
    version: 1,
    description: '{{description}}',
    defaults: {
      name: '{{name}}',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: '{{name}}Api',
        required: true,
      },
    ],
    properties: [
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'getData') {
          const credentials = await this.getCredentials('{{name}}Api', i);

          // TODO: Implement your API logic here
          const responseData = {
            message: 'Hello from {{name}}',
            timestamp: new Date().toISOString(),
          };

          returnData.push({
            json: responseData,
            pairedItem: { item: i },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}`,
    // Add more templates for oauth, webhook, ai, etc.
  };

  return templates[template as keyof typeof templates] || templates.basic;
}
