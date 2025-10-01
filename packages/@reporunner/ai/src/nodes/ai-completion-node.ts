export interface AICompletionNodeConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class AICompletionNode {
  private _config: AICompletionNodeConfig;

  constructor(config: AICompletionNodeConfig = {}) {
    this._config = config;
    // Suppress unused variable warning - will be used in future implementation
    void this._config;
  }

  async execute(prompt: string): Promise<string> {
    return `Completion for: ${prompt}`;
  }
}
