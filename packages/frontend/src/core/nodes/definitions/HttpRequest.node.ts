import type { INodeType, INodeTypeDescription } from '../types';

export class HttpRequestNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'HTTP Request',
    name: 'http',
    icon: '🌐',
    group: ['action'],
    version: 1,
    description: 'Make HTTP requests to web services and APIs',
    defaults: {
      name: 'HTTP Request',
      color: '#2563eb',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'select',
        default: 'GET',
        required: true,
        description: 'HTTP method to use',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'OPTIONS', value: 'OPTIONS' },
        ],
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        placeholder: 'https://api.example.com/data',
        description: 'The URL to make the request to',
        required: true,
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'select',
        default: 'none',
        description: 'Authentication method',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basicAuth' },
          { name: 'Bearer Token', value: 'bearerToken' },
          { name: 'API Key', value: 'apiKey' },
        ],
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        default: '',
        description: 'Username for basic authentication',
        displayOptions: {
          show: {
            authentication: ['basicAuth'],
          },
        },
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        default: '',
        description: 'Password for basic authentication',
        displayOptions: {
          show: {
            authentication: ['basicAuth'],
          },
        },
      },
      {
        displayName: 'Token',
        name: 'token',
        type: 'string',
        default: '',
        description: 'Bearer token',
        displayOptions: {
          show: {
            authentication: ['bearerToken'],
          },
        },
      },
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        default: '',
        description: 'API key value',
        displayOptions: {
          show: {
            authentication: ['apiKey'],
          },
        },
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'collection',
        default: [],
        description: 'HTTP headers to send',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Header name',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'expression',
            default: '',
            description: 'Header value',
          },
        ],
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'json',
        default: '{}',
        description: 'Request body as JSON',
        displayOptions: {
          show: {
            method: ['POST', 'PUT', 'PATCH'],
          },
        },
      },
      {
        displayName: 'Timeout',
        name: 'timeout',
        type: 'number',
        default: 30000,
        description: 'Request timeout in milliseconds',
        min: 1000,
        max: 300000,
      },
      {
        displayName: 'Response Format',
        name: 'responseFormat',
        type: 'select',
        default: 'json',
        description: 'How to parse the response',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'Text', value: 'text' },
          { name: 'Binary', value: 'binary' },
        ],
      },
    ],
    subtitle: '={{$parameter["method"] + " " + $parameter["url"]}}',
  };

  async execute(this: any): Promise<any> {
    const method = this.getNodeParameter('method', 'GET') as string;
    const url = this.getNodeParameter('url', '') as string;
    const authentication = this.getNodeParameter('authentication', 'none') as string;
    const headers = this.getNodeParameter('headers', []) as Array<{
      name: string;
      value: string;
    }>;
    const timeout = this.getNodeParameter('timeout', 30000) as number;
    const responseFormat = this.getNodeParameter('responseFormat', 'json') as string;

    // Build headers
    const requestHeaders: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.name && header.value) {
        requestHeaders[header.name] = header.value;
      }
    });

    // Add authentication headers
    switch (authentication) {
      case 'basicAuth': {
        const username = this.getNodeParameter('username', '') as string;
        const password = this.getNodeParameter('password', '') as string;
        const credentials = btoa(`${username}:${password}`);
        requestHeaders['Authorization'] = `Basic ${credentials}`;
        break;
      }
      case 'bearerToken': {
        const token = this.getNodeParameter('token', '') as string;
        requestHeaders['Authorization'] = `Bearer ${token}`;
        break;
      }
      case 'apiKey': {
        const apiKey = this.getNodeParameter('apiKey', '') as string;
        requestHeaders['X-API-Key'] = apiKey;
        break;
      }
    }

    // Build request body for POST/PUT/PATCH
    let body: any;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyParam = this.getNodeParameter('body', '{}') as string;
      try {
        body = JSON.parse(bodyParam);
        requestHeaders['Content-Type'] = 'application/json';
      } catch (error) {
        body = bodyParam;
        requestHeaders['Content-Type'] = 'text/plain';
      }
    }

    // Mock HTTP request for demo purposes
    // In real implementation, would use fetch() or axios
    return [
      {
        json: {
          request: {
            method,
            url,
            headers: requestHeaders,
            body: body || null,
            timeout,
          },
          response: {
            status: 200,
            statusText: 'OK',
            headers: {
              'content-type': 'application/json',
              'x-mock': 'true',
            },
            data:
              responseFormat === 'json'
                ? {
                    success: true,
                    message: 'Mock HTTP response',
                    timestamp: new Date().toISOString(),
                  }
                : 'Mock response text',
          },
          executionTime: Math.floor(Math.random() * 1000) + 100, // Mock execution time
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }
}
