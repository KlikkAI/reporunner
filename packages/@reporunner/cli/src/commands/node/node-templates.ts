export function getNodeTemplate(template: string): string {
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
    oauth: `import {
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
        name: '{{name}}OAuth2Api',
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
            name: 'Get Profile',
            value: 'getProfile',
            description: 'Get user profile from {{name}}',
            action: 'Get profile',
          },
        ],
        default: 'getProfile',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'getProfile') {
          const credentials = await this.getCredentials('{{name}}OAuth2Api', i);

          // TODO: Implement OAuth API logic here
          const responseData = {
            user: 'Example User',
            email: 'user@example.com',
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
    webhook: `import {
  IWebhookFunctions,
  IWebhookResponseData,
  INodeType,
  INodeTypeDescription,
} from '@reporunner/core';

export class {{name}} implements INodeType {
  description: INodeTypeDescription = {
    displayName: '{{name}}',
    name: '{{name}}',
    icon: 'file:{{name}}.svg',
    group: ['trigger'],
    version: 1,
    description: '{{description}}',
    defaults: {
      name: '{{name}}',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: '{{name}}',
      },
    ],
    properties: [
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: [
          {
            name: 'All Events',
            value: '*',
          },
          {
            name: 'Custom Event',
            value: 'custom',
          },
        ],
        default: ['*'],
        description: 'Events to listen for',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData();
    const headerData = this.getHeaderData();

    // TODO: Process webhook data
    return {
      workflowData: [
        [
          {
            json: {
              body: bodyData,
              headers: headerData,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      ],
    };
  }
}`,
    ai: `import {
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
    group: ['ai'],
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
            name: 'Generate Text',
            value: 'generateText',
            description: 'Generate text using AI',
            action: 'Generate text',
          },
          {
            name: 'Analyze Text',
            value: 'analyzeText',
            description: 'Analyze text content',
            action: 'Analyze text',
          },
        ],
        default: 'generateText',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: {
          rows: 3,
        },
        default: '',
        description: 'The prompt to send to the AI',
        displayOptions: {
          show: {
            operation: ['generateText'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials('{{name}}Api', i);

        if (operation === 'generateText') {
          const prompt = this.getNodeParameter('prompt', i) as string;

          // TODO: Implement AI text generation logic
          const responseData = {
            prompt,
            generated_text: 'This is generated text from {{name}}',
            timestamp: new Date().toISOString(),
          };

          returnData.push({
            json: responseData,
            pairedItem: { item: i },
          });
        } else if (operation === 'analyzeText') {
          const text = items[i].json.text as string;

          // TODO: Implement AI text analysis logic
          const responseData = {
            text,
            analysis: {
              sentiment: 'positive',
              confidence: 0.85,
              entities: [],
            },
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
    database: `import {
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
    group: ['database'],
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
            name: 'Find',
            value: 'find',
            description: 'Find records',
            action: 'Find records',
          },
          {
            name: 'Insert',
            value: 'insert',
            description: 'Insert record',
            action: 'Insert record',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update record',
            action: 'Update record',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete record',
            action: 'Delete record',
          },
        ],
        default: 'find',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const credentials = await this.getCredentials('{{name}}Api', i);

        // TODO: Implement database operations
        const responseData = {
          operation,
          result: 'Database operation completed',
          timestamp: new Date().toISOString(),
        };

        returnData.push({
          json: responseData,
          pairedItem: { item: i },
        });
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
    file: `import {
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
    group: ['file'],
    version: 1,
    description: '{{description}}',
    defaults: {
      name: '{{name}}',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Read File',
            value: 'readFile',
            description: 'Read a file',
            action: 'Read file',
          },
          {
            name: 'Write File',
            value: 'writeFile',
            description: 'Write to a file',
            action: 'Write file',
          },
          {
            name: 'Delete File',
            value: 'deleteFile',
            description: 'Delete a file',
            action: 'Delete file',
          },
        ],
        default: 'readFile',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        default: '',
        description: 'Path to the file',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const filePath = this.getNodeParameter('filePath', i) as string;

        // TODO: Implement file operations
        const responseData = {
          operation,
          filePath,
          result: 'File operation completed',
          timestamp: new Date().toISOString(),
        };

        returnData.push({
          json: responseData,
          pairedItem: { item: i },
        });
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
  };

  return templates[template as keyof typeof templates] || templates.basic;
}