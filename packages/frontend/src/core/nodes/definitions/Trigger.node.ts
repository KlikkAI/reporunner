import type { INodeType, INodeTypeDescription } from '../types'

export class TriggerNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Trigger',
    name: 'trigger',
    icon: '🚀',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow execution when triggered',
    defaults: {
      name: 'Trigger',
      color: '#10b981',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Trigger Type',
        name: 'triggerType',
        type: 'options',
        default: 'manual',
        required: true,
        description: 'How this workflow should be triggered',
        options: [
          {
            name: 'Manual',
            value: 'manual',
            description: 'Trigger manually from the editor',
          },
          {
            name: 'Webhook',
            value: 'webhook',
            description: 'Trigger via HTTP webhook',
          },
          {
            name: 'Schedule',
            value: 'schedule',
            description: 'Trigger on a schedule',
          },
          {
            name: 'Database Change',
            value: 'database',
            description: 'Trigger on database changes',
          },
        ],
      },
      {
        displayName: 'Schedule',
        name: 'schedule',
        type: 'string',
        default: '0 0 * * *',
        placeholder: '0 0 * * *',
        description: 'Cron expression for scheduled execution',
        displayOptions: {
          show: {
            triggerType: ['schedule'],
          },
        },
      },
      {
        displayName: 'Webhook Path',
        name: 'webhookPath',
        type: 'string',
        default: '/webhook',
        placeholder: '/my-webhook',
        description: 'Path for the webhook endpoint',
        displayOptions: {
          show: {
            triggerType: ['webhook'],
          },
        },
      },
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        default: 'POST',
        description: 'HTTP method for webhook',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
        displayOptions: {
          show: {
            triggerType: ['webhook'],
          },
        },
      },
    ],
    subtitle:
      '={{$parameter["triggerType"] === "webhook" ? "Webhook: " + $parameter["webhookPath"] : $parameter["triggerType"]}}',
  }

  async execute(this: any): Promise<any> {
    // Trigger nodes don't execute in the traditional sense
    // They define how the workflow starts
    return [
      {
        json: {
          triggerType: this.getNodeParameter('triggerType', 'manual'),
          timestamp: new Date().toISOString(),
          trigger: true,
        },
      },
    ]
  }
}
