export interface AICompletionNodeConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class AICompletionNode {
  // @ts-ignore - Config stored for future use
  private _config: AICompletionNodeConfig;

  constructor(config: AICompletionNodeConfig = {}) {
    this._config = config;
  }

  async execute(prompt: string): Promise<string> {
    return `Completion for: ${prompt}`;
  }
}
