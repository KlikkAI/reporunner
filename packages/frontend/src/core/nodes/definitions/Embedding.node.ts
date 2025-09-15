import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from '../types'

export class EmbeddingNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Embedding',
    name: 'embedding',
    icon: '🔢',
    group: ['ai'],
    version: 1,
    description: 'Generate vector embeddings from text using AI models',
    defaults: {
      name: 'Embedding',
      color: '#10b981',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'openai',
        required: false,
        displayOptions: {
          show: {
            provider: ['openai'],
          },
        },
      },
      {
        name: 'huggingface',
        required: false,
        displayOptions: {
          show: {
            provider: ['huggingface'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Provider',
        name: 'provider',
        type: 'options',
        default: 'openai',
        required: true,
        options: [
          {
            name: 'OpenAI',
            value: 'openai',
          },
          {
            name: 'Hugging Face',
            value: 'huggingface',
          },
          {
            name: 'Local (SentenceTransformers)',
            value: 'local',
          },
          {
            name: 'Cohere',
            value: 'cohere',
          },
        ],
        description: 'Embedding provider to use',
      },
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        default: 'text-embedding-ada-002',
        required: true,
        options: [
          {
            name: 'text-embedding-ada-002',
            value: 'text-embedding-ada-002',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'text-embedding-3-small',
            value: 'text-embedding-3-small',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'text-embedding-3-large',
            value: 'text-embedding-3-large',
            displayOptions: {
              show: {
                provider: ['openai'],
              },
            },
          },
          {
            name: 'all-MiniLM-L6-v2',
            value: 'sentence-transformers/all-MiniLM-L6-v2',
            displayOptions: {
              show: {
                provider: ['huggingface', 'local'],
              },
            },
          },
          {
            name: 'all-mpnet-base-v2',
            value: 'sentence-transformers/all-mpnet-base-v2',
            displayOptions: {
              show: {
                provider: ['huggingface', 'local'],
              },
            },
          },
          {
            name: 'embed-english-v3.0',
            value: 'embed-english-v3.0',
            displayOptions: {
              show: {
                provider: ['cohere'],
              },
            },
          },
        ],
        description: 'Embedding model to use',
      },
      {
        displayName: 'Text Field',
        name: 'textField',
        type: 'string',
        default: 'text',
        required: true,
        description: 'Field containing the text to embed',
        placeholder: 'text, content, description',
      },
      {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        default: 10,
        min: 1,
        max: 100,
        description: 'Number of texts to process in each batch',
      },
      {
        displayName: 'Normalize Embeddings',
        name: 'normalize',
        type: 'boolean',
        default: true,
        description: 'Normalize embeddings to unit length',
      },
      {
        displayName: 'Include Metadata',
        name: 'includeMetadata',
        type: 'boolean',
        default: true,
        description: 'Include embedding metadata in output',
      },
      {
        displayName: 'Dimensions',
        name: 'dimensions',
        type: 'number',
        default: 1536,
        min: 1,
        max: 3072,
        displayOptions: {
          show: {
            provider: ['openai'],
            model: ['text-embedding-3-small', 'text-embedding-3-large'],
          },
        },
        description:
          'Number of dimensions for the embedding (OpenAI v3 models only)',
      },
    ],
    categories: ['AI/Automation'],
  }

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData()
    const provider = this.getNodeParameter('provider', 'openai') as string
    const model = this.getNodeParameter(
      'model',
      'text-embedding-ada-002'
    ) as string
    const textField = this.getNodeParameter('textField', 'text') as string
    const batchSize = this.getNodeParameter('batchSize', 10) as number
    const normalize = this.getNodeParameter('normalize', true) as boolean
    const includeMetadata = this.getNodeParameter(
      'includeMetadata',
      true
    ) as boolean
    const dimensions = this.getNodeParameter('dimensions', 1536) as number

    const results: INodeExecutionData[] = []

    // Process input data in batches
    for (let i = 0; i < inputData.length; i += batchSize) {
      const batch = inputData.slice(i, i + batchSize)

      for (const item of batch) {
        const textToEmbed = item.json[textField] || ''

        if (!textToEmbed) {
          results.push({
            json: {
              ...item.json,
              error: `No text found in field '${textField}'`,
              embedding: null,
            },
          })
          continue
        }

        // Generate mock embedding vector
        const embeddingDimensions =
          provider === 'openai' &&
          ['text-embedding-3-small', 'text-embedding-3-large'].includes(model)
            ? dimensions
            : this.getDefaultDimensions(model)

        const mockEmbedding = this.generateMockEmbedding(
          embeddingDimensions,
          normalize
        )

        const result: any = {
          ...item.json,
          embedding: mockEmbedding,
          text: textToEmbed,
          textLength: textToEmbed.length,
        }

        if (includeMetadata) {
          result.embeddingMetadata = {
            provider,
            model,
            dimensions: embeddingDimensions,
            normalized: normalize,
            tokensUsed: Math.ceil(textToEmbed.length / 4), // Rough token estimation
            cost: this.calculateMockCost(provider, textToEmbed.length),
            timestamp: new Date().toISOString(),
          }
        }

        results.push({ json: result })
      }
    }

    return [results]
  }

  private getDefaultDimensions(model: string): number {
    const dimensionMap: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'sentence-transformers/all-MiniLM-L6-v2': 384,
      'sentence-transformers/all-mpnet-base-v2': 768,
      'embed-english-v3.0': 1024,
    }
    return dimensionMap[model] || 1536
  }

  private generateMockEmbedding(
    dimensions: number,
    normalize: boolean
  ): number[] {
    const embedding: number[] = []

    // Generate random values
    for (let i = 0; i < dimensions; i++) {
      embedding.push((Math.random() - 0.5) * 2) // Random values between -1 and 1
    }

    // Normalize if requested
    if (normalize) {
      const magnitude = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      )
      return embedding.map(val => val / magnitude)
    }

    return embedding
  }

  private calculateMockCost(provider: string, textLength: number): number {
    const tokenCount = Math.ceil(textLength / 4)

    switch (provider) {
      case 'openai':
        return tokenCount * 0.0001 // $0.0001 per 1K tokens (mock rate)
      case 'cohere':
        return tokenCount * 0.0002
      default:
        return 0 // Free for local/HuggingFace
    }
  }
}
