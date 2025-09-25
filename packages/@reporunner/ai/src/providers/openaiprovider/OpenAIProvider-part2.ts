delta, finishReason;
: choice.finish_reason
            ? this.mapFinishReason(choice.finish_reason)
            : undefined,
          toolCalls: choice.delta.tool_calls
            ? this.formatToolCalls(choice.delta.tool_calls)
            : undefined,
        }
}
    } catch (error)
{
  throw new LLMProviderError(
    `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    this.name
  );
}
}

  async embed(params: EmbedParams): Promise<EmbedResult>
{
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

private
formatMessages(params: GenerateTextParams)
{
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

private
formatTools(tools: any[])
{
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

private
formatToolCalls(toolCalls: any[])
{
  return toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      parameters: JSON.parse(tc.function.arguments || '{}'),
    }));
}

private
mapFinishReason(reason: string | null)
: 'stop' | 'length' | 'tool_use' | 'error'
{
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
