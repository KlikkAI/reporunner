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
  private _config: AIChatNodeConfig;

  constructor(config: AIChatNodeConfig = {}) {
    this._config = config;
    // Suppress unused variable warning - will be used in future implementation
    void this._config;
  }

  async execute(messages: ChatMessage[]): Promise<string> {
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    return `AI response to: ${lastUserMessage?.content || 'Hello'}`;
  }
}
