import { UNIFIED_CATEGORIES } from '../../constants/categories';
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../../nodes/types';

export class Ollama implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ollama',
    name: 'ollama',
    icon: '🦙',
    group: ['ai'],
    version: 1,
    description: 'Interact with local Ollama language models',
    defaults: {
      name: 'Ollama',
      color: '#322c2b',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [], // Ollama typically runs locally without authentication
    properties: [
      {
        name: 'baseUrl',
        displayName: 'Ollama Base URL',
        type: 'string',
        required: false,
        description: 'Base URL for Ollama API (default: http://localhost:11434)',
        default: 'http://localhost:11434',
        placeholder: 'http://localhost:11434',
      },
      {
        name: 'model',
        displayName: 'Model',
        type: 'string',
        required: true,
        description: 'Ollama model name (e.g., llama2, mistral, codellama)',
        default: 'llama2',
        placeholder: 'llama2',
      },
      {
        name: 'prompt',
        displayName: 'Prompt',
        type: 'text',
        required: true,
        description: 'Prompt for the AI model. Use {{input}} for dynamic content',
        default: '',
        placeholder: 'Enter your prompt or use {{input}} for dynamic content',
        rows: 4,
      },
      {
        name: 'system',
        displayName: 'System Message',
        type: 'text',
        required: false,
        description: 'System message to set context and behavior',
        default: '',
        placeholder: 'You are a helpful assistant...',
        rows: 3,
      },
      {
        name: 'temperature',
        displayName: 'Temperature',
        type: 'number',
        required: false,
        description: 'Controls randomness (0.0 = deterministic, 1.0 = very random)',
        default: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        typeOptions: {
          numberPrecision: 1,
        },
      },
      {
        name: 'topK',
        displayName: 'Top K',
        type: 'number',
        required: false,
        description: 'Limits token selection to top K most likely tokens',
        default: 40,
        min: 1,
        max: 100,
      },
      {
        name: 'topP',
        displayName: 'Top P',
        type: 'number',
        required: false,
        description: 'Nucleus sampling parameter',
        default: 0.9,
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
      {
        name: 'repeatPenalty',
        displayName: 'Repeat Penalty',
        type: 'number',
        required: false,
        description: 'Penalty for repeating tokens',
        default: 1.1,
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
      {
        name: 'seed',
        displayName: 'Seed',
        type: 'number',
        required: false,
        description: 'Random seed for reproducible results',
        default: -1,
        placeholder: '-1 for random',
      },
      {
        name: 'numCtx',
        displayName: 'Context Length',
        type: 'number',
        required: false,
        description: 'Context window size',
        default: 2048,
        min: 512,
        max: 8192,
      },
      {
        name: 'stream',
        displayName: 'Enable Streaming',
        type: 'boolean',
        required: false,
        description: 'Stream the response in real-time',
        default: false,
      },
    ],
    categories: [UNIFIED_CATEGORIES.AI_AUTOMATION],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const parameters = this.getNodeParameter('parameters'); // Assuming parameters are passed as a single object
    // Ollama doesn't require credentials
    // const credentials = this.getCredentials('credentials')

    // Mock implementation - replace with actual Ollama API calls
    const result = {
      response: `Generated text from model ${parameters.model}: This is a mock response for the prompt "${parameters.prompt}"`,
      model: parameters.model,
      metadata: {
        temperature: parameters.temperature,
        topK: parameters.topK,
        topP: parameters.topP,
        timestamp: new Date().toISOString(),
      },
    };

    return [[{ json: result }]];
  }

  async test(this: any): Promise<{ success: boolean; message: string; data?: any }> {
    // Ollama doesn't require credentials
    // const credentials = this.getCredentials('credentials')
    // Mock implementation - replace with actual Ollama connection test
    return {
      success: true,
      message: 'Successfully connected to Ollama',
    };
  }
}
