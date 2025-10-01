export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatNodeConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class AIChatNode {
  constructor(config: AIChatNodeConfig = {}) {
    this._config = config;
  }

  async execute(messages: ChatMessage[]): Promise<string> {
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    return `AI response to: ${lastUserMessage?.content || 'Hello'}`;
  }
}
