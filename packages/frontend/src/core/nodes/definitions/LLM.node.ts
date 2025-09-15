import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from '../types'

export class LLMNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'LLM',
    name: 'llm',
    icon: '🧠',
    group: ['ai'],
    version: 1,
    description:
      'Direct interface to Large Language Models for text generation and completion',
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
        required: true,
        description: 'Model name/ID to use',
        placeholder: 'gpt-3.5-turbo, claude-3-sonnet, llama2',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'text',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['generate', 'complete', 'summarize', 'classify'],
          },
        },
        description: 'The prompt to send to the LLM',
        placeholder: 'Write a creative story about...',
      },
      {
        displayName: 'Messages',
        name: 'messages',
        type: 'json',
        default: '[]',
        displayOptions: {
          show: {
            operation: ['chat'],
          },
        },
        description: 'Chat messages in OpenAI format',
        placeholder: '[{"role": "user", "content": "Hello!"}]',
      },
      {
        displayName: 'Text to Process',
        name: 'inputText',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['summarize', 'classify'],
          },
        },
        description: 'Text to summarize or classify',
        placeholder: 'Long text to process...',
      },
      {
        displayName: 'Categories',
        name: 'categories',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['classify'],
          },
        },
        description:
          'Available categories for classification (comma-separated)',
        placeholder: 'positive, negative, neutral',
      },
      {
        displayName: 'Temperature',
        name: 'temperature',
        type: 'number',
        default: 1.0,
        min: 0,
        max: 2,
        description:
          'Sampling temperature (0 = deterministic, 2 = very creative)',
      },
      {
        displayName: 'Max Tokens',
        name: 'maxTokens',
        type: 'number',
        default: 150,
        min: 1,
        max: 4000,
        description: 'Maximum tokens in the response',
      },
      {
        displayName: 'Top P',
        name: 'topP',
        type: 'number',
        default: 1.0,
        min: 0,
        max: 1,
        description: 'Nucleus sampling parameter',
      },
      {
        displayName: 'Frequency Penalty',
        name: 'frequencyPenalty',
        type: 'number',
        default: 0,
        min: -2,
        max: 2,
        description: 'Penalty for token frequency',
      },
      {
        displayName: 'Presence Penalty',
        name: 'presencePenalty',
        type: 'number',
        default: 0,
        min: -2,
        max: 2,
        description: 'Penalty for token presence',
      },
      {
        displayName: 'Stream Response',
        name: 'stream',
        type: 'boolean',
        default: false,
        description: 'Stream the response token by token',
      },
    ],
    categories: ['AI/Automation'],
  }

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData()
    const operation = this.getNodeParameter('operation', 'generate') as string
    const provider = this.getNodeParameter('provider', 'openai') as string
    const model = this.getNodeParameter('model', 'gpt-3.5-turbo') as string
    const temperature = this.getNodeParameter('temperature', 1.0) as number
    const maxTokens = this.getNodeParameter('maxTokens', 150) as number
    const topP = this.getNodeParameter('topP', 1.0) as number
    const frequencyPenalty = this.getNodeParameter(
      'frequencyPenalty',
      0
    ) as number
    const presencePenalty = this.getNodeParameter(
      'presencePenalty',
      0
    ) as number
    const stream = this.getNodeParameter('stream', false) as boolean

    const results: INodeExecutionData[] = []

    // Process each input item
    for (const item of inputData) {
      let response: string
      let tokensUsed: number

      switch (operation) {
        case 'generate': {
          const prompt = this.getNodeParameter('prompt', '') as string

          response = `Mock generated text from ${provider} ${model} for prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}". Temperature: ${temperature}, Max tokens: ${maxTokens}.`
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.7)
          break
        }

        case 'complete': {
          const prompt = this.getNodeParameter('prompt', '') as string

          response = `${prompt} [COMPLETION]: This is a mock completion from ${model}. The text continues with generated content based on the provided context.`
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.6)
          break
        }

        case 'chat': {
          const messagesStr = this.getNodeParameter('messages', '[]') as string
          let messages
          try {
            messages = JSON.parse(messagesStr)
          } catch {
            messages = [{ role: 'user', content: 'Hello!' }]
          }

          const lastMessage =
            messages[messages.length - 1]?.content || 'No message'
          response = `Mock chat response from ${model}: Thank you for your message "${lastMessage.substring(0, 30)}${lastMessage.length > 30 ? '...' : ''}". This is a simulated conversational response.`
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.5)
          break
        }

        case 'summarize': {
          const inputText = this.getNodeParameter('inputText', '') as string

          response = `Summary by ${model}: This is a mock summary of the provided text (${inputText.length} characters). The main points have been condensed into this brief overview.`
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.4)
          break
        }

        case 'classify': {
          const inputText = this.getNodeParameter('inputText', '') as string
          const categoriesStr = this.getNodeParameter(
            'categories',
            ''
          ) as string
          const categories = categoriesStr
            .split(',')
            .map(c => c.trim())
            .filter(c => c)

          const randomCategory =
            categories.length > 0
              ? categories[Math.floor(Math.random() * categories.length)]
              : 'unknown'

          response = `Classification result: "${randomCategory}" (confidence: ${(Math.random() * 0.5 + 0.5).toFixed(2)})`
          tokensUsed = Math.floor(Math.random() * 50)
          break
        }

        default:
          response = `Mock response from ${provider} ${model}`
          tokensUsed = 10
      }

      results.push({
        json: {
          ...item.json,
          llmResponse: response,
          operation,
          provider,
          model,
          parameters: {
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty,
            stream,
          },
          usage: {
            promptTokens: Math.floor(tokensUsed * 0.3),
            completionTokens: tokensUsed,
            totalTokens: Math.floor(tokensUsed * 1.3),
          },
          cost: tokensUsed * 0.00002, // Mock cost calculation
          timestamp: new Date().toISOString(),
        },
      })
    }

    return [results]
  }
}
