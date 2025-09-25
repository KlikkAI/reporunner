/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class EmailNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Email',
    name: 'email',
    icon: '📧',
    group: ['communication'],
    version: 1,
    description: 'Send and receive emails via SMTP/IMAP',
    defaults: {
      name: 'Email',
      color: '#ea4335',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'smtp',
        required: false,
        displayOptions: {
          show: {
            operation: ['send'],
          },
        },
      },
      {
        name: 'imap',
        required: false,
        displayOptions: {
          show: {
            operation: ['read'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'send',
        required: true,
        options: [
          {
            name: 'Send Email',
            value: 'send',
            description: 'Send an email message',
          },
          {
            name: 'Read Emails',
            value: 'read',
            description: 'Read emails from inbox',
          },
        ],
        description: 'Email operation to perform',
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['send'],
          },
        },
        description: 'Recipient email address(es), comma-separated',
        placeholder: 'user@example.com, another@example.com',
      },
      {
        displayName: 'CC',
        name: 'cc',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['send'],
          },
        },
        description: 'Carbon copy recipients, comma-separated',
        placeholder: 'cc@example.com',
      },
      {
        displayName: 'BCC',
        name: 'bcc',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['send'],
          },
        },
        description: 'Blind carbon copy recipients, comma-separated',
        placeholder: 'bcc@example.com',
      },
      {
        displayName: 'Subject',
