/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class VectorStoreNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vector Store',
    name: 'vectorstore',
    icon: '🗃️',
    group: ['ai'],
    version: 1,
    description: 'Store and query vector embeddings in vector databases',
    defaults: {
      name: 'Vector Store',
      color: '#7c3aed',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'pinecone',
        required: false,
        displayOptions: {
          show: {
            provider: ['pinecone'],
          },
        },
      },
      {
        name: 'weaviate',
        required: false,
        displayOptions: {
          show: {
            provider: ['weaviate'],
          },
        },
      },
      {
        name: 'qdrant',
        required: false,
        displayOptions: {
          show: {
            provider: ['qdrant'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'upsert',
        required: true,
        options: [
          {
            name: 'Insert/Update (Upsert)',
            value: 'upsert',
            description: 'Add or update vectors in the store',
          },
          {
            name: 'Query',
            value: 'query',
            description: 'Search for similar vectors',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete vectors from the store',
          },
          {
            name: 'Get by ID',
            value: 'get',
            description: 'Retrieve vectors by ID',
          },
          {
            name: 'List Collections',
            value: 'list',
            description: 'List available collections/indexes',
          },
        ],
        description: 'Vector store operation to perform',
      },
      {
        displayName: 'Provider',
        name: 'provider',
        type: 'options',
        default: 'pinecone',
        required: true,
        options: [
          {
            name: 'Pinecone',
            value: 'pinecone',
          },
          {
            name: 'Weaviate',
            value: 'weaviate',
          },
          {
            name: 'Qdrant',
            value: 'qdrant',
