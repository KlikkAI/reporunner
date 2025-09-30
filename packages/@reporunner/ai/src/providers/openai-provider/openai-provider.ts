/**
 * OpenAI LLM Provider implementation
 */

import OpenAI from 'openai';
import { CombinedAIProvider } from '../../base/ai-provider';
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  LLMCompletion,
  LLMResponse,
  ProviderConfig,
} from '../../types';

export interface OpenAIConfig extends ProviderConfig {
  type: 'openai';
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

export class OpenAIProvider extends CombinedAIProvider {
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'text-embedding-3-large',
    'text-embedding-3-small',
    'text-embedding-ada-002',
  ];

  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
  }

  async validateConfig(): Promise<boolean> {
    return !!(this.config as OpenAIConfig).apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async complete(request: LLMCompletion): Promise<LLMResponse> {
    try {
      const messages = request.messages || [];
      if (request.prompt) {
        messages.unshift({ role: 'user', content: request.prompt });
      }

      const completion = await this.client.chat.completions.create({
        model: request.model,
        messages: messages.map((msg) => {
          const baseMsg: any = {
            role: msg.role,
            content: msg.content,
          };
          // Only add optional fields if they exist
          if (msg.toolCallId) {
            baseMsg.tool_call_id = msg.toolCallId;
          }
          if (msg.name) {
            baseMsg.name = msg.name;
          }
          return baseMsg;
        }),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stop: request.stop,
        tools: request.tools ? this.formatTools(request.tools) : undefined,
        tool_choice: request.toolChoice,
        user: request.user,
      });

      return {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        choices: completion.choices.map((choice) => ({
          index: choice.index,
          message: choice.message,
          finishReason: choice.finish_reason,
          logprobs: choice.logprobs,
        })),
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
              promptTokensDetails: completion.usage.prompt_tokens_details as any,
              completionTokensDetails: completion.usage.completion_tokens_details as any,
            }
          : undefined,
        systemFingerprint: completion.system_fingerprint,
      };
    } catch (error) {
      throw new Error(
        `OpenAI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async *stream(request: LLMCompletion): AsyncIterable<LLMResponse> {
    try {
      const messages = request.messages || [];
      if (request.prompt) {
        messages.unshift({ role: 'user', content: request.prompt });
      }

      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: messages.map((msg) => {
          const baseMsg: any = {
            role: msg.role,
            content: msg.content,
          };
          // Only add optional fields if they exist
          if (msg.toolCallId) {
            baseMsg.tool_call_id = msg.toolCallId;
          }
          if (msg.name) {
            baseMsg.name = msg.name;
          }
          return baseMsg;
        }),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stop: request.stop,
        tools: request.tools ? this.formatTools(request.tools) : undefined,
        tool_choice: request.toolChoice,
        user: request.user,
        stream: true,
      });

      for await (const chunk of stream) {
        yield {
          id: chunk.id,
          object: chunk.object,
          created: chunk.created,
          model: chunk.model,
          choices: chunk.choices.map((choice) => ({
            index: choice.index,
            delta: choice.delta
              ? {
                  ...choice.delta,
                  role: choice.delta.role === 'developer' ? 'assistant' : choice.delta.role,
                }
              : undefined,
            finishReason: choice.finish_reason,
            logprobs: choice.logprobs,
          })),
          usage: chunk.usage
            ? {
                promptTokens: chunk.usage.prompt_tokens || 0,
                completionTokens: chunk.usage.completion_tokens || 0,
                totalTokens: chunk.usage.total_tokens || 0,
              }
            : undefined,
          systemFingerprint: chunk.system_fingerprint,
        };
      }
    } catch (error) {
      throw new Error(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getModels(): Promise<string[]> {
    return this.supportedModels;
  }

  estimateTokens(text: string): number {
    // Simple token estimation - roughly 4 characters per token for GPT models
    return Math.ceil(text.length / 4);
  }

  async createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: request.model,
        input: request.input,
        dimensions: request.dimensions,
        encoding_format: request.encodingFormat,
        user: request.user,
      });

      return {
        object: response.object,
        data: response.data.map((item) => ({
          object: item.object,
          index: item.index,
          embedding: item.embedding,
        })),
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getDimensions(model: string): number {
    switch (model) {
      case 'text-embedding-3-large':
        return 3072;
      case 'text-embedding-3-small':
      case 'text-embedding-ada-002':
        return 1536;
      default:
        return 1536;
    }
  }

  getMaxTokens(model: string): number {
    switch (model) {
      case 'text-embedding-3-large':
      case 'text-embedding-3-small':
        return 8191;
      case 'text-embedding-ada-002':
        return 8191;
      default:
        return 8191;
    }
  }

  private formatTools(tools: any[]) {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.function?.name || tool.name,
        description: tool.function?.description || tool.description,
        parameters: tool.function?.parameters || tool.parameters,
      },
    }));
  }
}
