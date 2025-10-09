export interface AICompletionNodeConfig {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export class AICompletionNode {
  async execute(prompt: string): Promise<string> {
    return `Completion for: ${prompt}`;
  }
}
