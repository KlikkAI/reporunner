import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

/**
 * WebhookTrigger node - Blueprint node for the new architecture
 * This node demonstrates the declarative approach for defining nodes
 */
export class WebhookTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Webhook Trigger',
    name: 'webhookTrigger',
    icon: '🌐',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["httpMethod"]}} {{$parameter["path"]}}',
    description: 'Starts the workflow when a webhook is received',
    defaults: {
      name: 'Webhook Trigger',
      color: '#ff8c00',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [],
    categories: ['Development', 'Core'],
    eventTriggerDescription: 'Waiting for webhook calls',
    activationMessage: 'Webhook is now active and listening',
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        default: 'GET',
        required: true,
        description: 'The HTTP method to listen for',
        options: [
          {
            name: 'GET',
            value: 'GET',
            description: 'GET request',
          },
          {
            name: 'POST',
            value: 'POST',
            description: 'POST request',
          },
          {
            name: 'PUT',
            value: 'PUT',
            description: 'PUT request',
          },
          {
            name: 'PATCH',
            value: 'PATCH',
            description: 'PATCH request',
          },
          {
            name: 'DELETE',
            value: 'DELETE',
            description: 'DELETE request',
          },
          {
            name: 'HEAD',
            value: 'HEAD',
            description: 'HEAD request',
          },
        ],
      },
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'webhook',
        placeholder: 'webhook-path',
        required: true,
        description: 'The path for the webhook endpoint',
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        default: 'onReceived',
        description: 'When and how to respond to the webhook',
        options: [
          {
            name: 'On Received',
            value: 'onReceived',
            description: 'Response immediately when webhook is received',
          },
          {
            name: 'Last Node',
            value: 'lastNode',
            description: 'Response with data from last node',
          },
          {
            name: 'Using Response Node',
            value: 'responseNode',
            description: 'Response defined by Response node',
          },
        ],
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        default: 200,
        description: 'The HTTP response code to return',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        typeOptions: {
          minValue: 100,
          maxValue: 599,
        },
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'options',
        default: 'allEntries',
        description: 'What data to return',
        displayOptions: {
          show: {
            responseMode: ['lastNode'],
          },
        },
        options: [
          {
            name: 'All Entries',
            value: 'allEntries',
            description: 'Returns all entries of the last node',
          },
          {
            name: 'First Entry JSON',
            value: 'firstEntryJson',
            description: 'Returns the JSON data of the first entry',
          },
          {
            name: 'First Entry Binary',
            value: 'firstEntryBinary',
            description: 'Returns the binary data of the first entry',
          },
          {
            name: 'No Response Body',
            value: 'noData',
            description: 'Returns without a body',
          },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        description: 'Additional options',
        values: [
          {
            displayName: 'Binary Property',
            name: 'binaryPropertyName',
            type: 'string',
            default: 'data',
            description: 'Name of the binary property to write the data to',
          },
          {
            displayName: 'Ignore Bots',
            name: 'ignoreBots',
            type: 'boolean',
            default: false,
            description: 'Whether to ignore requests from bots',
          },
          {
            displayName: 'IP Whitelist',
            name: 'ipWhitelist',
            type: 'string',
            default: '',
            placeholder: '192.168.1.1, 10.0.0.0/8',
            description: 'Comma-separated list of allowed IP addresses or CIDR ranges',
          },
          {
            displayName: 'Raw Body',
            name: 'rawBody',
            type: 'boolean',
            default: false,
            description: 'Whether to return the request body raw',
          },
          {
            displayName: 'Response Headers',
            name: 'responseHeaders',
            type: 'fixedCollection',
            default: {},
            typeOptions: {
              multipleValues: true,
            },
            description: 'Headers to add to the response',
            placeholder: 'Add Response Header',
            options: [
              {
                name: 'headers',
                displayName: 'Header',
                options: [
                  {
                    displayName: 'Name',
                    name: 'name',
                    type: 'string',
                    default: '',
                    description: 'Name of the header',
                    required: true,
                  },
                  {
                    displayName: 'Value',
                    name: 'value',
                    type: 'string',
                    default: '',
                    description: 'Value of the header',
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        displayName: 'Notice',
        name: 'webhookNotice',
        type: 'notice',
        default: '',
        description: 'Production webhook URL will be displayed after workflow activation',
        displayOptions: {
          show: {
            '@_nodeVersion': [1],
          },
        },
      },
    ],
  };

  /**
   * Webhook method - handles incoming webhook requests
   */
  async webhook(this: any): Promise<any> {
    const req = this.getRequestObject();
    const resp = this.getResponseObject();
    const headers = this.getHeaderData();
    const params = this.getParamsData();
    const body = this.getBodyData();
    const query = this.getQueryData();

    const nodeParameters = this.getNodeParameter('options', {}) as any;

    // Check IP whitelist if configured
    if (nodeParameters.ipWhitelist) {
      const clientIp = req.ip || req.connection.remoteAddress;
      const allowedIps = nodeParameters.ipWhitelist.split(',').map((ip: string) => ip.trim());

      if (!this.isIpAllowed(clientIp, allowedIps)) {
        resp.status(403).json({ error: 'Forbidden' });
        return { noWebhookResponse: true };
      }
    }

    // Check for bots if configured
    if (nodeParameters.ignoreBots) {
      const userAgent = headers['user-agent'] || '';
      const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];

      if (botPatterns.some((pattern) => pattern.test(userAgent))) {
        resp.status(403).json({ error: 'Bot detected' });
        return { noWebhookResponse: true };
      }
    }

    const returnData: INodeExecutionData[] = [
      {
        json: {
          headers,
          params,
          query,
          body: nodeParameters.rawBody ? body : this.getBodyJson(),
          method: req.method,
          url: req.url,
        },
      },
    ];

    // Add binary data if configured
    if (nodeParameters.binaryPropertyName && Buffer.isBuffer(body)) {
      returnData[0].binary = {
        [nodeParameters.binaryPropertyName]: {
          data: body.toString('base64'),
          mimeType: headers['content-type'] || 'application/octet-stream',
        },
      };
    }

    const responseMode = this.getNodeParameter('responseMode', 'onReceived') as string;

    if (responseMode === 'onReceived') {
      const responseCode = this.getNodeParameter('responseCode', 200) as number;

      // Add custom response headers if configured
      if (nodeParameters.responseHeaders?.headers) {
        for (const header of nodeParameters.responseHeaders.headers) {
          resp.setHeader(header.name, header.value);
        }
      }

      resp.status(responseCode).json({
        message: 'Webhook received',
        timestamp: new Date().toISOString(),
      });
    }

    return [returnData];
  }
}
