export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  keepSeparator?: boolean;
}

export class TextSplitter {
  private options: Required<TextSplitterOptions>;

  constructor(options: TextSplitterOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separator: options.separator || '\n',
      keepSeparator: options.keepSeparator ?? true,
    };
  }

  split(text: string): string[] {
    const { chunkSize, chunkOverlap, separator, keepSeparator } = this.options;
    
    // Split by separator first
    const splits = text.split(separator);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const split of splits) {
      const potentialChunk = currentChunk 
        ? currentChunk + (keepSeparator ? separator : '') + split 
        : split;
      
      if (potentialChunk.length <= chunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = split;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // Add overlap if specified
    if (chunkOverlap > 0 && chunks.length > 1) {
      const overlappedChunks: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          overlappedChunks.push(chunks[i]);
        } else {
          const prevChunk = chunks[i - 1];
          const overlapText = prevChunk.slice(-chunkOverlap);
          overlappedChunks.push(overlapText + chunks[i]);
        }
      }
      
      return overlappedChunks;
    }
    
    return chunks;
  }
}

export class RecursiveTextSplitter extends TextSplitter {
  private separators: string[];

  constructor(options: TextSplitterOptions = {}, separators?: string[]) {
    super(options);
    this.separators = separators || ['\n\n', '\n', '. ', ' ', ''];
  }

  split(text: string): string[] {
    return this.recursiveSplit(text, this.separators);
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (separators.length === 0) {
      return [text];
    }
    
    const separator = separators[0];
    const chunks: string[] = [];
    
    if (text.length <= this.options.chunkSize) {
      return [text];
    }
    
    const splits = text.split(separator);
    let currentChunk = '';
    
    for (const split of splits) {
      const potentialChunk = currentChunk 
        ? currentChunk + separator + split 
        : split;
      
      if (potentialChunk.length <= this.options.chunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        if (split.length > this.options.chunkSize) {
          // Recursively split with next separator
          const subChunks = this.recursiveSplit(split, separators.slice(1));
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
}