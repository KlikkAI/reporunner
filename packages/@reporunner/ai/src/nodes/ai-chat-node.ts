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
  }

  async execute(messages: ChatMessage[]): Promise<string> {
    // Mock implementation using config
    console.log('Executing AI Chat with config:', this._config, 'messages:', messages);

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    return `AI response to: ${lastUserMessage?.content || 'Hello'}`;
  }
}
