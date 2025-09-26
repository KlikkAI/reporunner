multipleValues: true,
},
            description: 'Headers to add to the response',
            placeholder: 'Add Response Header',
            options: [
{
  name: 'headers', displayName;
  : 'Header',
                options: [
    displayName: 'Name', name
  : 'name',
  type: 'string',
  default: '',
                    description: 'Name of the header',
                    required: true,
  ,
    displayName: 'Value', name
  : 'value',
  type: 'string',
  default: '',
                    description: 'Value of the header',
                    required: true,
  ,
                ],
}
,
            ],
          },
        ],
      },
{
  displayName: 'Notice', name;
  : 'webhookNotice',
  type: 'notice',
  default: '',
        description: 'Production webhook URL will be displayed after workflow activation',
        displayOptions:
      ('@_nodeVersion')
  : [1],
    ,
  ,
}
,
    ],
  }

/**
 * Webhook method - handles incoming webhook requests
 */
async
webhook(this: any)
: Promise<any>
{
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
