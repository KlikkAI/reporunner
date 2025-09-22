/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class DatabaseNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Database',
    name: 'database',
    icon: '🗄️',
    group: ['database'],
    version: 1,
    description: 'Execute database operations like SELECT, INSERT, UPDATE, DELETE',
    defaults: {
      name: 'Database',
      color: '#059669',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'postgres',
        required: false,
        displayOptions: {
          show: {
            database: ['postgres'],
          },
        },
      },
      {
        name: 'mysql',
        required: false,
        displayOptions: {
          show: {
            database: ['mysql'],
          },
        },
      },
      {
        name: 'mongodb',
        required: false,
        displayOptions: {
          show: {
            database: ['mongodb'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Database Type',
        name: 'database',
        type: 'options',
        default: 'postgres',
        required: true,
        options: [
          {
            name: 'PostgreSQL',
            value: 'postgres',
          },
          {
            name: 'MySQL',
            value: 'mysql',
          },
          {
            name: 'MongoDB',
            value: 'mongodb',
          },
          {
            name: 'SQLite',
            value: 'sqlite',
          },
        ],
        description: 'Type of database to connect to',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'select',
        required: true,
        options: [
          {
            name: 'Select',
            value: 'select',
            description: 'Execute a SELECT query',
          },
          {
            name: 'Insert',
            value: 'insert',
            description: 'Insert new records',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update existing records',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete records',
          },
          {
            name: 'Custom Query',
            value: 'query',
            description: 'Execute custom SQL/query',
          },
        ],
        description: 'Database operation to perform',
      },
      {
        displayName: 'Table/Collection',
        name: 'table',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['select', 'insert', 'update', 'delete'],
          },
        },
        description: 'Name of the table (SQL) or collection (MongoDB)',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'text',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Custom SQL query or MongoDB query',
        placeholder: 'SELECT * FROM users WHERE active = true',
      },
      {
        displayName: 'Columns',
        name: 'columns',
        type: 'string',
        default: '*',
        displayOptions: {
          show: {
            operation: ['select'],
          },
        },
        description: 'Columns to select (comma-separated)',
        placeholder: 'id, name, email',
      },
      {
        displayName: 'Where Condition',
        name: 'where',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['select', 'update', 'delete'],
          },
        },
        description: 'WHERE condition for the query',
        placeholder: 'id = 1 OR active = true',
      },
      {
        displayName: 'Data',
        name: 'data',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            operation: ['insert', 'update'],
          },
        },
        description: 'Data to insert or update (JSON format)',
        placeholder: '{"name": "John", "email": "john@example.com"}',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        min: 1,
        displayOptions: {
          show: {
            operation: ['select'],
          },
        },
        description: 'Maximum number of records to return',
      },
    ],
    categories: ['Data'],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const database = this.getNodeParameter('database', 'postgres') as string;
    const operation = this.getNodeParameter('operation', 'select') as string;

    // Mock database operations - in real implementation would connect to actual databases
    const mockResults: INodeExecutionData[] = [];

    switch (operation) {
      case 'select': {
        const table = this.getNodeParameter('table', '') as string;
        const columns = this.getNodeParameter('columns', '*') as string;
        const where = this.getNodeParameter('where', '') as string;
        const limit = this.getNodeParameter('limit', 100) as number;

        // Mock SELECT results
        for (let i = 0; i < Math.min(5, limit); i++) {
          mockResults.push({
            json: {
              id: i + 1,
              table: table,
              columns: columns,
              where: where,
              database: database,
              operation: 'select',
              mockData: `Sample record ${i + 1}`,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;
      }

      case 'insert': {
        const table = this.getNodeParameter('table', '') as string;
        const data = this.getNodeParameter('data', '{}') as string;

        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (err) {
          parsedData = { error: 'Invalid JSON data', err };
        }

        mockResults.push({
          json: {
            operation: 'insert',
            table: table,
            database: database,
            insertedData: parsedData,
            insertedId: Math.floor(Math.random() * 10000),
            rowsAffected: 1,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'update': {
        const table = this.getNodeParameter('table', '') as string;
        const data = this.getNodeParameter('data', '{}') as string;
        const where = this.getNodeParameter('where', '') as string;

        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (err) {
          parsedData = { error: 'Invalid JSON data', err };
        }

        mockResults.push({
          json: {
            operation: 'update',
            table: table,
            database: database,
            updatedData: parsedData,
            where: where,
            rowsAffected: Math.floor(Math.random() * 5) + 1,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'delete': {
        const table = this.getNodeParameter('table', '') as string;
        const where = this.getNodeParameter('where', '') as string;

        mockResults.push({
          json: {
            operation: 'delete',
            table: table,
            database: database,
            where: where,
            rowsAffected: Math.floor(Math.random() * 3) + 1,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'query': {
        const query = this.getNodeParameter('query', '') as string;

        mockResults.push({
          json: {
            operation: 'query',
            database: database,
            query: query,
            result: 'Custom query executed successfully',
            rowsAffected: Math.floor(Math.random() * 10),
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }
    }

    return [mockResults];
  }
}
