description: 'Penalty for token presence',
},
{
  displayName: 'Stream Response', name;
  : 'stream',
  type: 'boolean',
  default: false,
        description: 'Stream the response token by token',
}
,
    ],
    categories: ['AI/Automation'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
    const inputData = this.getInputData();
    const operation = this.getNodeParameter('operation', 'generate') as string;
    const provider = this.getNodeParameter('provider', 'openai') as string;
    const model = this.getNodeParameter('model', 'gpt-3.5-turbo') as string;
    const temperature = this.getNodeParameter('temperature', 1.0) as number;
    const maxTokens = this.getNodeParameter('maxTokens', 150) as number;
    const topP = this.getNodeParameter('topP', 1.0) as number;
    const frequencyPenalty = this.getNodeParameter('frequencyPenalty', 0) as number;
    const presencePenalty = this.getNodeParameter('presencePenalty', 0) as number;
    const stream = this.getNodeParameter('stream', false) as boolean;

    const results: INodeExecutionData[] = [];

    // Process each input item
    for (const item of inputData) {
      let response: string;
      let tokensUsed: number;

      switch (operation) {
        case 'generate': {
          const prompt = this.getNodeParameter('prompt', '') as string;

          response = `Mock generated text from ${provider} ${model} for prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}". Temperature: ${temperature}, Max tokens: ${maxTokens}.`;
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.7);
          break;
        }

        case 'complete': {
          const prompt = this.getNodeParameter('prompt', '') as string;

          response = `${prompt} [COMPLETION]: This is a mock completion from ${model}. The text continues with generated content based on the provided context.`;
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.6);
          break;
        }

        case 'chat': {
          const messagesStr = this.getNodeParameter('messages', '[]') as string;
          let messages;
          try {
            messages = JSON.parse(messagesStr);
          } catch {
            messages = [{ role: 'user', content: 'Hello!' }];
          }

          const lastMessage = messages[messages.length - 1]?.content || 'No message';
          response = `Mock chat response from ${model}: Thank you for your message "${lastMessage.substring(0, 30)}${lastMessage.length > 30 ? '...' : ''}". This is a simulated conversational response.`;
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.5);
          break;
        }

        case 'summarize': {
          const inputText = this.getNodeParameter('inputText', '') as string;

          response = `Summary by ${model}: This is a mock summary of the provided text (${inputText.length} characters). The main points have been condensed into this brief overview.`;
          tokensUsed = Math.floor(Math.random() * maxTokens * 0.4);
          break;
        }

        case 'classify': {
          const categoriesStr = this.getNodeParameter('categories', '') as string;
          const categories = categoriesStr
            .split(',')
            .map((c) => c.trim())
            .filter((c) => c);

          const randomCategory =
            categories.length > 0
              ? categories[Math.floor(Math.random() * categories.length)]
              : 'unknown';

          response = `Classification result: "${randomCategory}" (confidence: ${(Math.random() * 0.5 + 0.5).toFixed(2)})`;
          tokensUsed = Math.floor(Math.random() * 50);
          break;
        }

        default:
          response = `Mock response from ${provider} ${model}`;
          tokensUsed = 10;
      }

      results.push({
        json: {
          ...item.json,
          llmResponse: response,
          operation,
          provider,
