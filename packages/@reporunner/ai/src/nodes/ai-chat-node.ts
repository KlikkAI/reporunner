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
  private config: AIChatNodeConfig;

  constructor(config: AIChatNodeConfig = {}) {
    this.config = config;
  }

  async execute(messages: ChatMessage[]): Promise<string> {
    // Mock implementation
    console.log('Executing AI Chat with messages:', messages);
    
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    return `AI response to: ${lastUserMessage?.content || 'Hello'}`;
  }
}