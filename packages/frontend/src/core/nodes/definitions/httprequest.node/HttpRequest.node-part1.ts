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
