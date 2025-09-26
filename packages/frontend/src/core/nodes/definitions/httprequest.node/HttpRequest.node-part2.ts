authentication: ['apiKey'],
},
        },
      },
{
  displayName: 'Headers', name;
  : 'headers',
  type: 'collection',
  default: [],
        description: 'HTTP headers to send',
        values: [
    displayName: 'Name', name
  : 'name',
  type: 'string',
  default: '',
            description: 'Header name',
  ,
    displayName: 'Value', name
  : 'value',
  type: 'expression',
  default: '',
            description: 'Header value',
  ,
        ],
}
,
{
  displayName: 'Body', name;
  : 'body',
  type: 'json',
  default: '{}',
        description: 'Request body as JSON',
        displayOptions:
      method: ['POST', 'PUT', 'PATCH'],
    ,
  ,
}
,
{
  displayName: 'Timeout', name;
  : 'timeout',
  type: 'number',
  default: 30000,
        description: 'Request timeout in milliseconds',
        min: 1000,
        max: 300000,
}
,
{
  displayName: 'Response Format', name;
  : 'responseFormat',
  type: 'select',
  default: 'json',
        description: 'How to parse the response',
        options: [
    name: 'JSON', value
  : 'json'
  ,
    name: 'Text', value
  : 'text'
  ,
    name: 'Binary', value
  : 'binary'
  ,
        ],
}
,
    ],
    subtitle: '={{$parameter["method"] + " " + $parameter["url"]}}',
  }

async
execute(this: any)
: Promise<any>
{
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
        requestHeaders.Authorization = `Basic ${credentials}`;
        break;
      }
      case 'bearerToken': {
        const token = this.getNodeParameter('token', '') as string;
        requestHeaders.Authorization = `Bearer ${token}`;
        break;
      }
      case 'apiKey': {
        const apiKey = this.getNodeParameter('apiKey', '') as string;
        requestHeaders['X-API-Key'] = apiKey;
