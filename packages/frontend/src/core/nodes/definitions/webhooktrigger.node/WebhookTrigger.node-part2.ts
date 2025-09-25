{
  name: 'Using Response Node', value;
  : 'responseNode',
            description: 'Response defined by Response node',
}
,
        ],
      },
{
  displayName: 'Response Code', name;
  : 'responseCode',
  type: 'number',
  default: 200,
        description: 'The HTTP response code to return',
        displayOptions:
  {
    show: {
      responseMode: ['onReceived'],
    }
    ,
  }
  ,
        typeOptions:
  {
    minValue: 100, maxValue;
    : 599,
  }
  ,
}
,
{
  displayName: 'Response Data', name;
  : 'responseData',
  type: 'options',
  default: 'allEntries',
        description: 'What data to return',
        displayOptions:
  {
    show: {
      responseMode: ['lastNode'],
    }
    ,
  }
  ,
        options: [
  {
    name: 'All Entries', value;
    : 'allEntries',
            description: 'Returns all entries of the last node',
  }
  ,
  {
    name: 'First Entry JSON', value;
    : 'firstEntryJson',
            description: 'Returns the JSON data of the first entry',
  }
  ,
  {
    name: 'First Entry Binary', value;
    : 'firstEntryBinary',
            description: 'Returns the binary data of the first entry',
  }
  ,
  {
    name: 'No Response Body', value;
    : 'noData',
            description: 'Returns without a body',
  }
  ,
        ],
}
,
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
