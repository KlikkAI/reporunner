export class Tokenizer {
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();

  constructor() {
    // Initialize with basic vocabulary
    this.initializeVocabulary();
  }

  private initializeVocabulary(): void {
    // Mock vocabulary - in production, load from file or API
    const basicTokens = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    ];
    
    basicTokens.forEach((token, index) => {
      this.vocabulary.set(token, index);
      this.reverseVocabulary.set(index, token);
    });
  }

  encode(text: string): number[] {
    // Simple whitespace tokenization
    const words = text.toLowerCase().split(/\s+/);
    const tokens: number[] = [];
    
    for (const word of words) {
      if (this.vocabulary.has(word)) {
        tokens.push(this.vocabulary.get(word)!);
      } else {
        // Unknown token - assign a new ID
        const newId = this.vocabulary.size;
        this.vocabulary.set(word, newId);
        this.reverseVocabulary.set(newId, word);
        tokens.push(newId);
      }
    }
    
    return tokens;
  }

  decode(tokens: number[]): string {
    const words: string[] = [];
    
    for (const token of tokens) {
      const word = this.reverseVocabulary.get(token);
      if (word) {
        words.push(word);
      } else {
        words.push('[UNK]');
      }
    }
    
    return words.join(' ');
  }

  countTokens(text: string): number {
    return this.encode(text).length;
  }

  truncate(text: string, maxTokens: number): string {
    const tokens = this.encode(text);
    
    if (tokens.length <= maxTokens) {
      return text;
    }
    
    const truncatedTokens = tokens.slice(0, maxTokens);
    return this.decode(truncatedTokens);
  }
}

export class GPTTokenizer extends Tokenizer {
  // Approximation for GPT tokenization
  countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  encode(text: string): number[] {
    // Mock GPT-style tokenization
    // In production, use a proper tokenizer library
    const tokens: number[] = [];
    const words = text.split(/(\s+|[.,!?;])/);
    
    for (const word of words) {
      if (word.trim()) {
        // Generate mock token ID based on word hash
        const hash = this.hashString(word);
        tokens.push(hash % 50000); // GPT vocab size approximation
      }
    }
    
    return tokens;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}