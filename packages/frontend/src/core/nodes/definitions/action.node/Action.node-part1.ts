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
