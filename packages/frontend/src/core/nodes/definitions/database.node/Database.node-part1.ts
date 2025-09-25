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
