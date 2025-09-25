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
