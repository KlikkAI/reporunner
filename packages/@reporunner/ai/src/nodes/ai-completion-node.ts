export interface AICompletionNodeConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class AICompletionNode {
  constructor(config: AICompletionNodeConfig = {}) {
    this._config = config;
    // Config will be used in future implementation
  }

  async execute(prompt: string): Promise<string> {
    return `Completion for: ${prompt}`;
  }
}
