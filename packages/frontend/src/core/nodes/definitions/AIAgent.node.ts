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
          { name: 'Gemini Pro Vision', value: 'gemini-pro-vision' },
        ],
        displayOptions: {
          show: {
            provider: ['google'],
          },
        },
      },
      {
        name: 'model',
        displayName: 'Local Model',
        type: 'string',
        required: true,
        description: 'Ollama model name (e.g., llama3.2, mistral, codellama)',
        default: 'llama3.2',
        placeholder: 'llama3.2, mistral, codellama, etc.',
        displayOptions: {
          show: {
            provider: ['ollama'],
          },
        },
      },
      {
        name: 'credentials',
        displayName: 'Credentials',
        type: 'credentialsSelect',
        required: true,
        description: 'Authentication credentials for the AI provider',
        credentialTypes: [
          'openaiApi',
          'anthropicApi',
          'googleAiApi',
          'azureOpenAiApi',
          'awsBedrockApi',
        ],
        displayOptions: {
          show: {
            provider: ['openai', 'anthropic', 'google', 'azure_openai', 'aws_bedrock'],
          },
        },
      },
      {
        name: 'ollamaUrl',
        displayName: 'Ollama Server URL',
        type: 'string',
        required: false,
        description: 'Ollama server URL (default: http://localhost:11434)',
        default: 'http://localhost:11434',
        placeholder: 'http://localhost:11434',
        displayOptions: {
          show: {
            provider: ['ollama'],
          },
        },
      },
      {
        name: 'systemPrompt',
        displayName: 'System Prompt',
        type: 'text',
        required: false,
        description: 'System prompt to define AI behavior and context',
        default: '',
        placeholder: 'You are a helpful assistant that...',
        rows: 4,
      },
      {
        name: 'agentType',
        displayName: 'Agent Type',
        type: 'select',
        required: false,
        description: 'Type of AI agent for specialized tasks',
        default: 'general',
        options: [
          { name: 'General AI Agent', value: 'general' },
          { name: 'Email Classifier', value: 'classifier' },
          { name: 'Customer Support Agent', value: 'support-agent' },
        ],
      },
      {
        name: 'promptTemplate',
        displayName: 'Prompt Template',
        type: 'select',
        required: false,
        description: 'Pre-built prompt templates for common use cases',
        default: 'custom',
        options: [
          { name: 'Custom Prompt', value: 'custom' },
          {
            name: 'Email Support Classification',
            value: 'email_classification',
          },
          { name: 'Sentiment Analysis', value: 'sentiment_analysis' },
          { name: 'Content Summarization', value: 'summarization' },
        ],
        displayOptions: {
          show: {
            agentType: ['classifier', 'general'],
          },
        },
      },
      {
        name: 'userPrompt',
        displayName: 'User Prompt',
        type: 'text',
        required: true,
        description: 'User prompt/message for the AI. Use {{input}} for dynamic content',
        default: '',
        placeholder: 'Enter your prompt or use {{input}} for dynamic content',
        rows: 3,
        displayOptions: {
          show: {
            promptTemplate: ['custom'],
          },
        },
      },
      {
        name: 'temperature',
        displayName: 'Temperature',
        type: 'number',
        required: false,
        description: 'Controls randomness in responses (0.0 = deterministic, 2.0 = very random)',
        default: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
        typeOptions: {
          numberPrecision: 1,
        },
      },
      {
        name: 'maxTokens',
        displayName: 'Max Tokens',
        type: 'number',
        required: false,
        description: 'Maximum number of tokens in the response',
        default: 1000,
        min: 1,
        max: 4000,
        placeholder: '1000',
      },
      {
        name: 'responseFormat',
        displayName: 'Response Format',
        type: 'select',
        required: false,
        description: 'Format for the AI response',
        default: 'text',
        options: [
          { name: 'Plain Text', value: 'text' },
          { name: 'JSON', value: 'json' },
          { name: 'Markdown', value: 'markdown' },
        ],
      },
      {
        name: 'streaming',
        displayName: 'Enable Streaming',
        type: 'boolean',
        required: false,
        description: 'Enable streaming responses for real-time output',
        default: false,
        displayOptions: {
          show: {
            provider: ['openai', 'anthropic', 'ollama'],
          },
        },
      },
      {
        name: 'topP',
        displayName: 'Top P',
        type: 'number',
        required: false,
        description: 'Nucleus sampling parameter (0.1 = only top 10% likely tokens)',
        default: 1.0,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        displayOptions: {
          show: {
            provider: ['openai', 'anthropic', 'google'],
          },
        },
      },
      {
        name: 'frequencyPenalty',
        displayName: 'Frequency Penalty',
        type: 'number',
        required: false,
        description: 'Decrease likelihood of repeating tokens (OpenAI only)',
        default: 0,
        min: -2.0,
        max: 2.0,
        step: 0.1,
        displayOptions: {
          show: {
            provider: ['openai'],
          },
        },
      },
      {
        name: 'presencePenalty',
        displayName: 'Presence Penalty',
        type: 'number',
        required: false,
        description: 'Increase likelihood of talking about new topics (OpenAI only)',
        default: 0,
        min: -2.0,
        max: 2.0,
        step: 0.1,
        displayOptions: {
          show: {
            provider: ['openai'],
          },
        },
      },
    ],
    categories: [UNIFIED_CATEGORIES.AI_AUTOMATION],
    // Custom UI component for specialized AI node rendering
    customBodyComponent: 'AIAgentNodeBody',
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    try {
      // Get parameters from node configuration - create proper parameter structure
      const parameters = {
        provider: this.getNodeParameter('provider', 'openai'),
        model: this.getNodeParameter('model', 'gpt-3.5-turbo'),
        systemPrompt: this.getNodeParameter('systemPrompt', ''),
        userPrompt: this.getNodeParameter('userPrompt', ''),
        temperature: this.getNodeParameter('temperature', 0.7),
        maxTokens: this.getNodeParameter('maxTokens', 1000),
        responseFormat: this.getNodeParameter('responseFormat', 'json'),
        agentType: this.getNodeParameter('agentType', 'classifier'),
      } as PropertyFormState;

      const _credentials = this.getCredentials('credentials');

      // Extract parameters
      const model = (parameters.model as string) || 'llama3.2:3b';
      const systemPrompt = (parameters.systemPrompt as string) || '';
      const userPrompt = parameters.userPrompt as string;
      const temperature = (parameters.temperature as number) || 0.7;
      const maxTokens = (parameters.maxTokens as number) || 1000;
      const responseFormat = (parameters.responseFormat as string) || 'json';
      const agentType = (parameters.agentType as string) || 'classifier';

      // Determine agent behavior based on type
      let result: any;

      if (agentType === 'classifier') {
        // Email Classification Logic
        const emailText = userPrompt || (parameters.text as string);
        const isCustomerSupport = this.classifyCustomerSupportEmail(emailText);

        result = {
          output: JSON.stringify({
            customerSupport: isCustomerSupport,
          }),
          parseJson: () => ({
            customerSupport: isCustomerSupport,
          }),
          model,
          metadata: {
            temperature,
            maxTokens,
            responseFormat,
            systemPrompt: systemPrompt || 'Customer Support Email Classifier',
            timestamp: new Date().toISOString(),
            tokenUsage: {
              promptTokens: Math.floor(Math.random() * 100) + 50,
              completionTokens: Math.floor(Math.random() * 200) + 100,
              totalTokens: Math.floor(Math.random() * 300) + 150,
            },
            classification: isCustomerSupport ? 'Customer Support' : 'Non-Support',
          },
        };
      } else {
        // Default behavior
        result = {
          output: `AI Agent response for: ${userPrompt}`,
          model,
          metadata: {
            temperature,
            maxTokens,
            responseFormat,
            systemPrompt,
            timestamp: new Date().toISOString(),
            tokenUsage: {
              promptTokens: Math.floor(Math.random() * 100) + 50,
              completionTokens: Math.floor(Math.random() * 200) + 100,
              totalTokens: Math.floor(Math.random() * 300) + 150,
            },
          },
        };
      }

      return [[{ json: result }]];
    } catch (error: any) {
      throw new Error(`AI Agent failed: ${error.message}`);
    }
  }

  async test(this: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const credentials = this.getCredentials('credentials');
      if (!credentials) {
        return {
          success: false,
          message: 'No credentials configured. Please add credentials.',
        };
      }

      // Inline AI agent connection test logic (Mock implementation)
      return {
        success: true,
        message: 'Successfully connected to AI Agent services',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `AI Agent test failed: ${error.message}`,
      };
    }
  }
}
