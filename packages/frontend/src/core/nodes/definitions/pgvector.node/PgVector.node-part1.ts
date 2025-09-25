/* eslint-disable @typescript-eslint/no-explicit-any */

import { UNIFIED_CATEGORIES } from '../../constants/categories';
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../../nodes/types';

export class PgVector implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'PGVector',
    name: 'pgvector',
    icon: '📊',
    group: ['database'],
    version: 1,
    description: 'Interact with PostgreSQL vector database for embeddings',
    defaults: {
      name: 'PGVector',
      color: '#336791',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'postgresqlConnection',
        required: true,
      },
    ],
    properties: [
      {
        name: 'operation',
        displayName: 'Operation',
        type: 'select',
        required: true,
        description: 'Operation to perform on the vector database',
        default: 'search',
        options: [
          { name: 'Insert Vector', value: 'insert' },
          { name: 'Search Vectors', value: 'search' },
          { name: 'Delete Vector', value: 'delete' },
          { name: 'Update Vector', value: 'update' },
        ],
      },
      {
        name: 'tableName',
        displayName: 'Table Name',
        type: 'string',
        required: true,
        description: 'Name of the table to store vectors',
        default: 'embeddings',
        placeholder: 'embeddings',
      },
      {
        name: 'vectorColumn',
        displayName: 'Vector Column',
        type: 'string',
        required: true,
        description: 'Column name for vector data',
        default: 'embedding',
        placeholder: 'embedding',
      },
      {
        name: 'vector',
        displayName: 'Vector Data',
        type: 'text',
        required: true,
        description: 'Vector array as JSON string or use {{input}} for dynamic data',
        default: '',
        placeholder: '[0.1, 0.2, 0.3, ...] or {{input}}',
        rows: 3,
        displayOptions: {
          show: {
            operation: ['insert', 'search', 'update'],
          },
        },
      },
      {
        name: 'metadata',
        displayName: 'Metadata',
        type: 'text',
        required: false,
        description: 'Additional metadata as JSON object',
        default: '{}',
        placeholder: '{"text": "sample text", "category": "example"}',
        rows: 3,
        displayOptions: {
          show: {
            operation: ['insert', 'update'],
          },
        },
      },
      {
        name: 'limit',
        displayName: 'Result Limit',
        type: 'number',
        required: false,
        description: 'Maximum number of results to return',
        default: 10,
        min: 1,
        max: 1000,
        displayOptions: {
          show: {
            operation: ['search'],
