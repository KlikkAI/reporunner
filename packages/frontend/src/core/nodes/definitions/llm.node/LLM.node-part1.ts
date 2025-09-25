/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class LLMNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'LLM',
    name: 'llm',
    icon: '🧠',
    group: ['ai'],
    version: 1,
    description: 'Direct interface to Large Language Models for text generation and completion',
    defaults: {
      name: 'LLM',
      color: '#4f46e5',
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
        name: 'anthropic',
        required: false,
        displayOptions: {
          show: {
            provider: ['anthropic'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'generate',
        required: true,
        options: [
          {
            name: 'Generate Text',
            value: 'generate',
            description: 'Generate text based on a prompt',
          },
          {
            name: 'Complete Text',
            value: 'complete',
            description: 'Complete partial text',
          },
          {
            name: 'Chat Completion',
            value: 'chat',
            description: 'Conversational chat completion',
          },
          {
            name: 'Summarize',
            value: 'summarize',
            description: 'Summarize long text',
          },
          {
            name: 'Classify',
            value: 'classify',
            description: 'Classify or categorize text',
          },
        ],
        description: 'Type of LLM operation to perform',
      },
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
            name: 'Anthropic',
            value: 'anthropic',
          },
          {
            name: 'Local (Ollama)',
            value: 'ollama',
          },
        ],
        description: 'LLM provider',
      },
      {
        displayName: 'Model',
        name: 'model',
        type: 'string',
        default: 'gpt-3.5-turbo',
