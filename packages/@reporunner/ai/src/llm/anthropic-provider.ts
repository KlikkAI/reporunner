import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, type ILLMProvider, type ProviderCapabilities } from '../base/ai-provider';
import type { LLMCompletion, LLMResponse, ProviderConfig } from '../types';

export class AnthropicProvider extends BaseAIProvider implements ILLMProvider {
  private client: Anthropic;

  static capabilities: ProviderCapabilities = {
    llm: true,
    embeddings: false,
    multimodal: true,
    function_calling: true,
    streaming: true,
    fine_tuning: false,
  };

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.endpoint,
    });
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch (error) {
      throw new Error(`Anthropic config validation failed: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return response.content.length > 0;
    } catch (_error) {
      return false;
    }
  }

  async complete(request: LLMCompletion): Promise<LLMResponse> {
    try {
      // Convert messages to Anthropic format
      const systemMessage = request.messages.find((m) => m.role === 'system');
      const conversationMessages = request.messages.filter((m) => m.role !== 'system');

      const response = await this.client.messages.create({
        model: request.model || this.config.model,
        max_tokens: request.max_tokens || 1024,
        temperature: request.temperature,
        top_p: request.top_p,
        stop_sequences: Array.isArray(request.stop)
          ? request.stop
          : request.stop
            ? [request.stop]
            : undefined,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        stream: false,
      });

      return {
        id: response.id,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.content.map((c) => (c.type === 'text' ? c.text : '')).join(''),
            },
            finish_reason: response.stop_reason || 'stop',
          },
        ],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        created: Date.now(),
      };
    } catch (error) {
      throw new Error(`Anthropic completion failed: ${error}`);
    }
  }

  async *stream(request: LLMCompletion): AsyncIterable<LLMResponse> {
    try {
      const systemMessage = request.messages.find((m) => m.role === 'system');
      const conversationMessages = request.messages.filter((m) => m.role !== 'system');

      const stream = await this.client.messages.create({
        model: request.model || this.config.model,
        max_tokens: request.max_tokens || 1024,
        temperature: request.temperature,
        top_p: request.top_p,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            id: 'stream',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: chunk.delta.text,
                },
                finish_reason: 'continue',
              },
            ],
            usage: {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0,
            },
            model: request.model || this.config.model,
            created: Date.now(),
          };
        }
      }
    } catch (error) {
      throw new Error(`Anthropic streaming failed: ${error}`);
    }
  }

  async getModels(): Promise<string[]> {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
    ];
  }

  estimateTokens(text: string): number {
    // Rough estimation for Claude
    return Math.ceil(text.length / 3.5);
  }
}
