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
