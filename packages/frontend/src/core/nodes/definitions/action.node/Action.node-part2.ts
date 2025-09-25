show: {
  actionType: ['http'], method;
  : ['POST', 'PUT', 'PATCH'],
}
,
        },
      },
{
  displayName: 'Transform Expression', name;
  : 'expression',
  type: 'expression',
  default: '{{$json}}',
        description: 'Expression to transform the data',
        displayOptions:
  {
    show: {
      actionType: ['transform'],
    }
    ,
  }
  ,
}
,
{
  displayName: 'Variable Name', name;
  : 'variableName',
  type: 'string',
  default: 'myVariable',
        description: 'Name of the variable to set',
        displayOptions:
  {
    show: {
      actionType: ['set'],
    }
    ,
  }
  ,
}
,
{
  displayName: 'Variable Value', name;
  : 'variableValue',
  type: 'expression',
  default: '{{$json}}',
        description: 'Value to set for the variable',
        displayOptions:
  {
    show: {
      actionType: ['set'],
    }
    ,
  }
  ,
}
,
    ],
    subtitle:
      '={{$parameter["actionType"] === "http" ? $parameter["method"] + " " + $parameter["url"] : $parameter["actionType"]}}',
  }

async
execute(this: any)
: Promise<any>
{
    const actionType = this.getNodeParameter('actionType', 'transform');
    const inputData = this.getInputData();

    switch (actionType) {
      case 'http': {
        const url = this.getNodeParameter('url', '') as string;
        const method = this.getNodeParameter('method', 'GET') as string;
        const headers = JSON.parse(this.getNodeParameter('headers', '{}') as string);
        const body =
          method !== 'GET' ? JSON.parse(this.getNodeParameter('body', '{}') as string) : undefined;

        // Mock HTTP request for now
        return [
          {
            json: {
              url,
              method,
              headers,
              body,
              response: { status: 200, data: 'Mock response' },
              timestamp: new Date().toISOString(),
            },
          },
        ];
      }

      case 'transform': {
        const expression = this.getNodeParameter('expression', '{{$json}}') as string;
        // Mock transformation - in real implementation, would evaluate expression
        return inputData.map((item: any) => ({
          json: {
            ...item.json,
            transformed: true,
            expression,
            timestamp: new Date().toISOString(),
          },
        }));
      }

      case 'log': {
        return inputData.map((item: any) => ({
          json: {
            ...item.json,
            logged: true,
            timestamp: new Date().toISOString(),
          },
        }));
      }

      case 'set': {
        const variableName = this.getNodeParameter('variableName', 'myVariable') as string;
        const variableValue = this.getNodeParameter('variableValue', '{{$json}}') as string;
