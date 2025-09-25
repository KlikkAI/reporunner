/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class VectorStoreToolNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vector Store Tool',
    name: 'vectorstoretool',
    icon: '🔍',
    group: ['ai'],
    version: 1,
    description: 'AI tool for intelligent vector store operations and semantic search',
    defaults: {
      name: 'Vector Store Tool',
      color: '#8b5cf6',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'openai',
        required: false,
        displayOptions: {
          show: {
            embeddingProvider: ['openai'],
          },
        },
      },
      {
        name: 'pinecone',
        required: false,
        displayOptions: {
          show: {
            vectorStore: ['pinecone'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Tool Mode',
        name: 'toolMode',
        type: 'options',
        default: 'semantic-search',
        required: true,
        options: [
          {
            name: 'Semantic Search',
            value: 'semantic-search',
            description: 'Search for semantically similar content',
          },
          {
            name: 'Smart Retrieval',
            value: 'smart-retrieval',
            description: 'Intelligent document retrieval with context',
          },
          {
            name: 'Question Answering',
            value: 'qa',
            description: 'Answer questions using vector store knowledge',
          },
          {
            name: 'Content Recommendation',
            value: 'recommendation',
            description: 'Recommend similar content',
          },
          {
            name: 'Knowledge Extraction',
            value: 'extraction',
            description: 'Extract specific knowledge from stored vectors',
          },
        ],
        description: 'Type of AI-powered vector store operation',
      },
      {
        displayName: 'Vector Store Provider',
        name: 'vectorStore',
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
          },
          {
            name: 'Chroma',
            value: 'chroma',
          },
        ],
        description: 'Vector database provider',
      },
      {
