/* eslint-disable @typescript-eslint/no-explicit-any */

import { UNIFIED_CATEGORIES } from '../../constants/categories';
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../../nodes/types';
import type { PropertyFormState } from '../../types/dynamicProperties';

export class AIAgent implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'AI Agent',
    name: 'ai-agent',
    icon: '🤖',
    group: ['action'],
    version: 1,
    description: 'Process data using AI models like OpenAI GPT, Claude, and Gemini',
    defaults: {
      name: 'AI Agent',
      color: '#6366f1',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'credentials',
        required: true,
        displayOptions: {
          show: {
            provider: ['openai', 'anthropic', 'google', 'azure_openai', 'aws_bedrock'],
          },
        },
      },
    ],
    properties: [
      {
        name: 'provider',
        displayName: 'AI Provider',
        type: 'select',
        required: true,
        description: 'Choose the AI service provider',
        default: 'Google (Gemini)',
        options: [
          { name: 'OpenAI', value: 'openai' },
          { name: 'Anthropic', value: 'anthropic' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'Ollama (Local)', value: 'ollama' },
          { name: 'Azure OpenAI', value: 'azure_openai' },
          { name: 'AWS Bedrock', value: 'aws_bedrock' },
        ],
      },
      {
        name: 'model',
        displayName: 'AI Model',
        type: 'select',
        required: true,
        description: 'AI model to use for processing',
        default: 'gpt-3.5-turbo',
        options: [
          { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { name: 'GPT-4', value: 'gpt-4' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-4o', value: 'gpt-4o' },
        ],
        displayOptions: {
          show: {
            provider: ['openai'],
          },
        },
      },
      {
        name: 'model',
        displayName: 'AI Model',
        type: 'select',
        required: true,
        description: 'Anthropic Claude model to use',
        default: 'claude-3-5-sonnet-20241022',
        options: [
          { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
          { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
          { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
        ],
        displayOptions: {
          show: {
            provider: ['anthropic'],
          },
        },
      },
      {
        name: 'model',
        displayName: 'AI Model',
        type: 'select',
        required: true,
        description: 'Google Gemini model to use',
        default: 'gemini-2.5-Flash',
        options: [
          { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
          { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
          { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
          { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
          { name: 'Gemini Pro', value: 'gemini-pro' },
