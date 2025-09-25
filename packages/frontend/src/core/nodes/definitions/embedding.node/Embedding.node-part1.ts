/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class EmbeddingNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Embedding',
    name: 'embedding',
    icon: '🔢',
    group: ['ai'],
    version: 1,
    description: 'Generate vector embeddings from text using AI models',
    defaults: {
      name: 'Embedding',
      color: '#10b981',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'openai',
        required: false,
        displayOptions: {
          show: {
            provider: ['openai'],
          },
        },
      },
      {
        name: 'huggingface',
        required: false,
        displayOptions: {
          show: {
            provider: ['huggingface'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Provider',
        name: 'provider',
        type: 'options',
        default: 'openai',
        required: true,
        options: [
          {
            name: 'OpenAI',
            value: 'openai',
          },
          {
            name: 'Hugging Face',
            value: 'huggingface',
          },
          {
            name: 'Local (SentenceTransformers)',
            value: 'local',
          },
          {
            name: 'Cohere',
            value: 'cohere',
          },
        ],
        description: 'Embedding provider to use',
      },
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        default: 'text-embedding-ada-002',
        required: true,
        options: [
          {
            name: 'text-embedding-ada-002',
            value: 'text-embedding-ada-002',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'text-embedding-3-small',
            value: 'text-embedding-3-small',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'text-embedding-3-large',
            value: 'text-embedding-3-large',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'all-MiniLM-L6-v2',
