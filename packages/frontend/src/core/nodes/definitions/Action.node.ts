/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeType, INodeTypeDescription } from '../types';

export class ActionNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Action',
    name: 'action',
    icon: '⚡',
    group: ['action'],
    version: 1,
    description: 'Generic action node for processing data',
    defaults: {
      name: 'Action',
      color: '#3b82f6',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Action Type',
        name: 'actionType',
        type: 'select',
        default: 'transform',
        required: true,
        description: 'Type of action to perform',
        options: [
          {
            name: 'Transform Data',
            value: 'transform',
            description: 'Transform or modify the input data',
          },
          {
            name: 'HTTP Request',
            value: 'http',
            description: 'Make an HTTP request',
          },
          {
            name: 'Log Data',
            value: 'log',
            description: 'Log the input data',
          },
          {
            name: 'Set Variable',
            value: 'set',
            description: 'Set a variable value',
          },
        ],
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        placeholder: 'https://api.example.com/data',
        description: 'URL to make the HTTP request to',
        required: true,
        displayOptions: {
          show: {
            actionType: ['http'],
          },
        },
      },
      {
        displayName: 'HTTP Method',
        name: 'method',
        type: 'select',
        default: 'GET',
        description: 'HTTP method to use',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
        displayOptions: {
          show: {
            actionType: ['http'],
          },
        },
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'json',
        default: '{}',
        description: 'HTTP headers as JSON object',
        displayOptions: {
          show: {
            actionType: ['http'],
          },
        },
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'json',
        default: '{}',
        description: 'Request body as JSON',
        displayOptions: {
          show: {
            actionType: ['http'],
            method: ['POST', 'PUT', 'PATCH'],
          },
        },
      },
      {
        displayName: 'Transform Expression',
        name: 'expression',
        type: 'expression',
        default: '{{$json}}',
        description: 'Expression to transform the data',
        displayOptions: {
          show: {
            actionType: ['transform'],
          },
        },
      },
      {
        displayName: 'Variable Name',
        name: 'variableName',
        type: 'string',
        default: 'myVariable',
        description: 'Name of the variable to set',
        displayOptions: {
          show: {
            actionType: ['set'],
          },
        },
      },
      {
        displayName: 'Variable Value',
        name: 'variableValue',
        type: 'expression',
        default: '{{$json}}',
        description: 'Value to set for the variable',
        displayOptions: {
          show: {
            actionType: ['set'],
          },
        },
      },
    ],
    subtitle:
      '={{$parameter["actionType"] === "http" ? $parameter["method"] + " " + $parameter["url"] : $parameter["actionType"]}}',
  };

  async execute(this: any): Promise<any> {
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
        console.log('Action Node Log:', inputData);
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

        return inputData.map((item: any) => ({
          json: {
            ...item.json,
            [variableName]: variableValue,
            timestamp: new Date().toISOString(),
          },
        }));
      }

      default:
        return inputData;
    }
  }
}
