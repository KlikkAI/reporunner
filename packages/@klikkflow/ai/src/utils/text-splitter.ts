export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  keepSeparator?: boolean;
}

export class TextSplitter {
  protected options: Required<TextSplitterOptions>;

  constructor(options: TextSplitterOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separator: options.separator || '\n',
      keepSeparator: options.keepSeparator ?? true,
    };
  }

  split(text: string): string[] {
    const { separator } = this.options;
    const splits = text.split(separator);
    const chunks = this.buildChunks(splits);
    return this.addOverlap(chunks);
  }

  private buildChunks(splits: string[]): string[] {
    const { chunkSize, separator, keepSeparator } = this.options;
    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const potentialChunk = this.createPotentialChunk(
        currentChunk,
        split,
        separator,
        keepSeparator
      );

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

    return chunks;
  }

  private createPotentialChunk(
    currentChunk: string,
    split: string,
    separator: string,
    keepSeparator: boolean
  ): string {
    return currentChunk ? currentChunk + (keepSeparator ? separator : '') + split : split;
  }

  private addOverlap(chunks: string[]): string[] {
    const { chunkOverlap } = this.options;

    if (chunkOverlap <= 0 || chunks.length <= 1) {
      return chunks;
    }

    const overlappedChunks: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-chunkOverlap);
      overlappedChunks.push(overlapText + chunks[i]);
    }

    return overlappedChunks;
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
    if (separators.length === 0 || text.length <= this.options.chunkSize) {
      return [text];
    }

    const separator = separators[0];
    const splits = text.split(separator);
    return this.processRecursiveSplits(splits, separator, separators);
  }

  private processRecursiveSplits(
    splits: string[],
    separator: string,
    separators: string[]
  ): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const potentialChunk = currentChunk ? currentChunk + separator + split : split;

      if (potentialChunk.length <= this.options.chunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        const processedSplit = this.handleOversizedSplit(split, separators);
        chunks.push(...processedSplit.chunks);
        currentChunk = processedSplit.remainder;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private handleOversizedSplit(
    split: string,
    separators: string[]
  ): { chunks: string[]; remainder: string } {
    if (split.length > this.options.chunkSize) {
      const subChunks = this.recursiveSplit(split, separators.slice(1));
      return { chunks: subChunks, remainder: '' };
    }
    return { chunks: [], remainder: split };
  }
}
