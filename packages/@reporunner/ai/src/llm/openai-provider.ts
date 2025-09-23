import { encode } from 'gpt-tokenizer';
import OpenAI from 'openai';
import { CombinedAIProvider, type ProviderCapabilities } from '../base/ai-provider';
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  LLMCompletion,
  LLMResponse,
  ProviderConfig,
} from '../types';

export class OpenAIProvider extends CombinedAIProvider {
  private client: OpenAI;

  static capabilities: ProviderCapabilities = {
    llm: true,
    embeddings: true,
    multimodal: true,
    function_calling: true,
    streaming: true,
    fine_tuning: true,
  };

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.endpoint,
    });
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      throw new Error(`OpenAI config validation failed: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return response.choices.length > 0;
    } catch (_error) {
      return false;
    }
  }

  async complete(request: LLMCompletion): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.config.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        stop: request.stop,
        functions: request.functions,
        stream: false,
      });

      return {
        id: response.id,
        choices: response.choices.map((choice) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
            function_call: choice.message.function_call,
          },
          finish_reason: choice.finish_reason || 'stop',
        })),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        created: response.created,
      };
    } catch (error) {
      throw new Error(`OpenAI completion failed: ${error}`);
    }
  }

  async *stream(request: LLMCompletion): AsyncIterable<LLMResponse> {
    try {
      const stream = await this.client.chat.completions.create({
        ...request,
        model: request.model || this.config.model,
        stream: true,
      });

      for await (const chunk of stream) {
        yield {
          id: chunk.id,
          choices: chunk.choices.map((choice) => ({
            index: choice.index,
            message: {
              role: 'assistant',
              content: choice.delta.content || '',
              function_call: choice.delta.function_call,
            },
            finish_reason: choice.finish_reason || 'continue',
          })),
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
          model: chunk.model,
          created: chunk.created,
        };
      }
    } catch (error) {
      throw new Error(`OpenAI streaming failed: ${error}`);
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.filter((model) => model.id.includes('gpt')).map((model) => model.id);
    } catch (error) {
      throw new Error(`Failed to get OpenAI models: ${error}`);
    }
  }

  estimateTokens(text: string): number {
    try {
      return encode(text).length;
    } catch {
      // Fallback estimation
      return Math.ceil(text.length / 4);
    }
  }

  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: request.model || 'text-embedding-ada-002',
        input: request.input,
        encoding_format: request.encoding_format,
        dimensions: request.dimensions,
      });

      return {
        data: response.data.map((item) => ({
          object: 'embedding' as const,
          index: item.index,
          embedding: item.embedding,
        })),
        model: response.model,
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          total_tokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI embeddings failed: ${error}`);
    }
  }

  getDimensions(model: string): number {
    const dimensionMap: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };
    return dimensionMap[model] || 1536;
  }

  getMaxTokens(model: string): number {
    const tokenMap: Record<string, number> = {
      'text-embedding-ada-002': 8191,
      'text-embedding-3-small': 8191,
      'text-embedding-3-large': 8191,
    };
    return tokenMap[model] || 8191;
  }
}
