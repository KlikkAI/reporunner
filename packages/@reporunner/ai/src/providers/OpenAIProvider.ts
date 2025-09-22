/**
 * OpenAI LLM Provider implementation
 */

import OpenAI from 'openai';
import {
  type EmbedParams,
  type EmbedResult,
  type GenerateTextParams,
  type GenerateTextResult,
  type GenerateTextStreamResult,
  type LLMProvider,
  LLMProviderError,
  type OpenAIConfig,
} from '../types';

export class OpenAIProvider implements LLMProvider {
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
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    try {
      const messages = this.formatMessages(params);

      const completion = await this.client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stop: params.stopSequences,
        tools: params.tools ? this.formatTools(params.tools) : undefined,
      });

      const choice = completion.choices[0];
      if (!choice) {
        throw new LLMProviderError('No completion choice returned', this.name);
      }

      return {
        text: choice.message.content || '',
        usage: {
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        finishReason: this.mapFinishReason(choice.finish_reason),
        toolCalls: choice.message.tool_calls
          ? this.formatToolCalls(choice.message.tool_calls)
          : undefined,
      };
    } catch (error) {
      throw new LLMProviderError(
        `OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name
      );
    }
  }

  async *generateStream(
    params: GenerateTextParams
  ): AsyncIterableIterator<GenerateTextStreamResult> {
    try {
      const messages = this.formatMessages(params);

      const stream = await this.client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stop: params.stopSequences,
        tools: params.tools ? this.formatTools(params.tools) : undefined,
        stream: true,
      });

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        const delta = choice.delta.content || '';

        yield {
          delta,
          finishReason: choice.finish_reason
            ? this.mapFinishReason(choice.finish_reason)
            : undefined,
          toolCalls: choice.delta.tool_calls
            ? this.formatToolCalls(choice.delta.tool_calls)
            : undefined,
        };
      }
    } catch (error) {
      throw new LLMProviderError(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name
      );
    }
  }

  async embed(params: EmbedParams): Promise<EmbedResult> {
    try {
      const response = await this.client.embeddings.create({
        model: params.model,
        input: params.texts,
        dimensions: params.dimensions,
      });

      return {
        embeddings: response.data.map((item) => item.embedding),
        usage: {
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw new LLMProviderError(
        `OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name
      );
    }
  }

  private formatMessages(params: GenerateTextParams) {
    const messages = [...params.messages];

    if (params.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: params.systemPrompt,
      });
    }

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      tool_call_id: msg.toolCallId,
      name: msg.toolName,
    }));
  }

  private formatTools(tools: any[]) {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.reduce((props: any, param: any) => {
            props[param.name] = {
              type: param.type,
              description: param.description,
              enum: param.enum,
            };
            return props;
          }, {}),
          required: tool.parameters.filter((p: any) => p.required).map((p: any) => p.name),
        },
      },
    }));
  }

  private formatToolCalls(toolCalls: any[]) {
    return toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      parameters: JSON.parse(tc.function.arguments || '{}'),
    }));
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'tool_use' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_use';
      default:
        return 'error';
    }
  }
}
