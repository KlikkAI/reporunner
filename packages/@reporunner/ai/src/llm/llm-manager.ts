import { BaseLLM } from '../base/BaseLLM';
import { OpenAIWrapper } from '../llm/OpenAIWrapper';
import { AnthropicWrapper } from '../llm/AnthropicWrapper';
import { HuggingFaceWrapper } from '../llm/HuggingFaceWrapper';
import { OllamaWrapper } from '../llm/OllamaWrapper';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'huggingface' | 'ollama' | 'custom';
  apiKey?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  endpoint?: string;
  options?: Record<string, any>;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export class LLMManager {
  private llms: Map<string, BaseLLM> = new Map();
  private defaultLLM?: BaseLLM;

  constructor(defaultConfig?: LLMConfig) {
    if (defaultConfig) {
      this.defaultLLM = this.createLLM('default', defaultConfig);
    }
  }

  registerLLM(name: string, config: LLMConfig): BaseLLM {
    const llm = this.createLLM(name, config);
    this.llms.set(name, llm);
    
    if (!this.defaultLLM) {
      this.defaultLLM = llm;
    }
    
    return llm;
  }

  private createLLM(name: string, config: LLMConfig): BaseLLM {
    switch (config.provider) {
      case 'openai':
        return new OpenAIWrapper({
          apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
          modelName: config.modelName || 'gpt-3.5-turbo',
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          ...config.options,
        });
      
      case 'anthropic':
        return new AnthropicWrapper({
          apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
          modelName: config.modelName || 'claude-2',
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          ...config.options,
        });
      
      case 'huggingface':
        return new HuggingFaceWrapper({
          apiKey: config.apiKey || process.env.HUGGINGFACE_API_KEY || '',
          modelName: config.modelName || 'gpt2',
          endpoint: config.endpoint,
          ...config.options,
        });
      
      case 'ollama':
        return new OllamaWrapper({
          modelName: config.modelName || 'llama2',
          endpoint: config.endpoint || 'http://localhost:11434',
          ...config.options,
        });
      
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }

  getLLM(name?: string): BaseLLM {
    if (!name) {
      if (!this.defaultLLM) {
        throw new Error('No default LLM configured');
      }
      return this.defaultLLM;
    }
    
    const llm = this.llms.get(name);
    if (!llm) {
      throw new Error(`LLM not found: ${name}`);
    }
    
    return llm;
  }

  async generate(prompt: string, llmName?: string, options?: any): Promise<LLMResponse> {
    const llm = this.getLLM(llmName);
    const response = await llm.generate(prompt, options);
    
    return {
      text: response,
      metadata: {
        llm: llmName || 'default',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async generateWithRetry(
    prompt: string,
    llmName?: string,
    options?: any,
    maxRetries = 3
  ): Promise<LLMResponse> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generate(prompt, llmName, options);
      } catch (error) {
        lastError = error as Error;
        console.error(`LLM generation attempt ${i + 1} failed:`, error);
        
        // Exponential backoff
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`);
  }

  async generateStream(
    prompt: string,
    onToken: (token: string) => void,
    llmName?: string,
    options?: any
  ): Promise<void> {
    const llm = this.getLLM(llmName);
    
    if (!llm.stream) {
      throw new Error('Streaming not supported by this LLM');
    }
    
    await llm.stream(prompt, onToken, options);
  }

  removeLLM(name: string): void {
    this.llms.delete(name);
  }

  listLLMs(): string[] {
    return Array.from(this.llms.keys());
  }

  setDefaultLLM(name: string): void {
    const llm = this.llms.get(name);
    if (!llm) {
      throw new Error(`LLM not found: ${name}`);
    }
    this.defaultLLM = llm;
  }
}