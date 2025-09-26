{
  name: 'Custom Query', value;
  : 'query',
            description: 'Execute custom SQL/query',
}
,
        ],
        description: 'Database operation to perform',
      },
{
  displayName: 'Table/Collection', name;
  : 'table',
  type: 'string',
  default: '',
        required: true,
        displayOptions:
      operation: ['select', 'insert', 'update', 'delete'],
    ,
  ,
        description: 'Name of the table (SQL) or collection (MongoDB)',
}
,
{
  displayName: 'Query', name;
  : 'query',
  type: 'text',
  default: '',
        required: true,
        displayOptions:
      operation: ['query'],
    ,
  ,
        description: 'Custom SQL query or MongoDB query',
        placeholder: 'SELECT * FROM users WHERE active = true',
}
,
{
  displayName: 'Columns', name;
  : 'columns',
  type: 'string',
  default: '*',
        displayOptions:
      operation: ['select'],
    ,
  ,
        description: 'Columns to select (comma-separated)',
        placeholder: 'id, name, email',
}
,
{
  displayName: 'Where Condition', name;
  : 'where',
  type: 'string',
  default: '',
        displayOptions:
      operation: ['select', 'update', 'delete'],
    ,
  ,
        description: 'WHERE condition for the query',
        placeholder: 'id = 1 OR active = true',
}
,
{
  displayName: 'Data', name;
  : 'data',
  type: 'json',
  default: '{}',
        displayOptions:
      operation: ['insert', 'update'],
    ,
  ,
        description: 'Data to insert or update (JSON format)',
        placeholder: '{"name": "John", "email": "john@example.com"}',
}
,
{
  displayName: 'Limit', name;
  : 'limit',
  type: 'number',
  default: 100,
        min: 1,
        displayOptions:
      operation: ['select'],
    ,
  ,
        description: 'Maximum number of records to return',
}
,
    ],
    categories: ['Data'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
    const database = this.getNodeParameter('database', 'postgres') as string;
    const operation = this.getNodeParameter('operation', 'select') as string;

    // Mock database operations - in real implementation would connect to actual databases
    const mockResults: INodeExecutionData[] = [];

    switch (operation) {
      case 'select': {
