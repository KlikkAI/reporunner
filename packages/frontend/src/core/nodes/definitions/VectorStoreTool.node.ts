import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from '../types'

export class VectorStoreToolNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vector Store Tool',
    name: 'vectorstoretool',
    icon: '🔍',
    group: ['ai'],
    version: 1,
    description:
      'AI tool for intelligent vector store operations and semantic search',
    defaults: {
      name: 'Vector Store Tool',
      color: '#8b5cf6',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'openai',
        required: false,
        displayOptions: {
          show: {
            embeddingProvider: ['openai'],
          },
        },
      },
      {
        name: 'pinecone',
        required: false,
        displayOptions: {
          show: {
            vectorStore: ['pinecone'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Tool Mode',
        name: 'toolMode',
        type: 'options',
        default: 'semantic-search',
        required: true,
        options: [
          {
            name: 'Semantic Search',
            value: 'semantic-search',
            description: 'Search for semantically similar content',
          },
          {
            name: 'Smart Retrieval',
            value: 'smart-retrieval',
            description: 'Intelligent document retrieval with context',
          },
          {
            name: 'Question Answering',
            value: 'qa',
            description: 'Answer questions using vector store knowledge',
          },
          {
            name: 'Content Recommendation',
            value: 'recommendation',
            description: 'Recommend similar content',
          },
          {
            name: 'Knowledge Extraction',
            value: 'extraction',
            description: 'Extract specific knowledge from stored vectors',
          },
        ],
        description: 'Type of AI-powered vector store operation',
      },
      {
        displayName: 'Vector Store Provider',
        name: 'vectorStore',
        type: 'options',
        default: 'pinecone',
        required: true,
        options: [
          {
            name: 'Pinecone',
            value: 'pinecone',
          },
          {
            name: 'Weaviate',
            value: 'weaviate',
          },
          {
            name: 'Qdrant',
            value: 'qdrant',
          },
          {
            name: 'Chroma',
            value: 'chroma',
          },
        ],
        description: 'Vector database provider',
      },
      {
        displayName: 'Embedding Provider',
        name: 'embeddingProvider',
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
            name: 'Local',
            value: 'local',
          },
        ],
        description: 'Embedding model provider for query vectors',
      },
      {
        displayName: 'Index Name',
        name: 'indexName',
        type: 'string',
        default: 'knowledge-base',
        required: true,
        description: 'Vector store index/collection name',
        placeholder: 'knowledge-base, documents, embeddings',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'text',
        default: '',
        required: true,
        displayOptions: {
          show: {
            toolMode: ['semantic-search', 'smart-retrieval', 'qa'],
          },
        },
        description: 'Search query or question',
        placeholder: 'What is machine learning? How to implement RAG?',
      },
      {
        displayName: 'Context Field',
        name: 'contextField',
        type: 'string',
        default: 'content',
        displayOptions: {
          show: {
            toolMode: ['recommendation', 'extraction'],
          },
        },
        description: 'Field containing context for recommendations/extraction',
        placeholder: 'content, text, description',
      },
      {
        displayName: 'Max Results',
        name: 'maxResults',
        type: 'number',
        default: 5,
        min: 1,
        max: 50,
        description: 'Maximum number of results to return',
      },
      {
        displayName: 'Similarity Threshold',
        name: 'similarityThreshold',
        type: 'number',
        default: 0.7,
        min: 0,
        max: 1,
        description: 'Minimum similarity score for results',
      },
      {
        displayName: 'Include Context',
        name: 'includeContext',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            toolMode: ['qa', 'smart-retrieval'],
          },
        },
        description: 'Include relevant context in the response',
      },
      {
        displayName: 'Context Window',
        name: 'contextWindow',
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        displayOptions: {
          show: {
            toolMode: ['qa', 'smart-retrieval'],
            includeContext: [true],
          },
        },
        description: 'Number of context chunks to include',
      },
      {
        displayName: 'Filter Metadata',
        name: 'filterMetadata',
        type: 'json',
        default: '{}',
        description: 'Metadata filter for search results',
        placeholder:
          '{"category": "technical", "date": {"$gte": "2024-01-01"}}',
      },
      {
        displayName: 'Rerank Results',
        name: 'rerankResults',
        type: 'boolean',
        default: true,
        description: 'Apply intelligent reranking to results',
      },
      {
        displayName: 'Generate Summary',
        name: 'generateSummary',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            toolMode: ['smart-retrieval', 'qa'],
          },
        },
        description: 'Generate AI summary of retrieved content',
      },
    ],
    categories: ['AI/Automation'],
  }

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData()
    const toolMode = this.getNodeParameter(
      'toolMode',
      'semantic-search'
    ) as string
    const vectorStore = this.getNodeParameter(
      'vectorStore',
      'pinecone'
    ) as string
    const embeddingProvider = this.getNodeParameter(
      'embeddingProvider',
      'openai'
    ) as string
    const indexName = this.getNodeParameter(
      'indexName',
      'knowledge-base'
    ) as string
    const maxResults = this.getNodeParameter('maxResults', 5) as number
    const similarityThreshold = this.getNodeParameter(
      'similarityThreshold',
      0.7
    ) as number
    const rerankResults = this.getNodeParameter(
      'rerankResults',
      true
    ) as boolean

    const results: INodeExecutionData[] = []

    // Process each input
    for (const item of inputData) {
      let queryData: any

      switch (toolMode) {
        case 'semantic-search': {
          const query = this.getNodeParameter('query', '') as string
          const filterMetadataStr = this.getNodeParameter(
            'filterMetadata',
            '{}'
          ) as string

          let filterMetadata
          try {
            filterMetadata = JSON.parse(filterMetadataStr)
          } catch {
            filterMetadata = {}
          }

          // Mock semantic search
          const mockResults = this.generateMockSearchResults(
            maxResults,
            similarityThreshold
          )

          queryData = {
            toolMode,
            query,
            vectorStore,
            embeddingProvider,
            indexName,
            filterMetadata,
            results: mockResults,
            totalResults: mockResults.length,
            searchType: 'semantic',
          }
          break
        }

        case 'smart-retrieval': {
          const query = this.getNodeParameter('query', '') as string
          const includeContext = this.getNodeParameter(
            'includeContext',
            true
          ) as boolean
          const contextWindow = this.getNodeParameter(
            'contextWindow',
            3
          ) as number
          const generateSummary = this.getNodeParameter(
            'generateSummary',
            false
          ) as boolean

          const mockResults = this.generateMockSearchResults(
            maxResults,
            similarityThreshold
          )

          // Add context if requested
          if (includeContext) {
            mockResults.forEach((result: any, index: number) => {
              result.context = this.generateMockContext(contextWindow, index)
            })
          }

          let summary = ''
          if (generateSummary) {
            summary = `Mock AI summary: Based on the retrieved documents about "${query}", the key findings are: 1) ${mockResults[0]?.metadata?.title || 'Topic A'}, 2) Related concepts, 3) Practical applications.`
          }

          queryData = {
            toolMode,
            query,
            vectorStore,
            embeddingProvider,
            indexName,
            results: mockResults,
            contextWindow,
            summary,
            retrievalType: 'smart',
          }
          break
        }

        case 'qa': {
          const query = this.getNodeParameter('query', '') as string
          const includeContext = this.getNodeParameter(
            'includeContext',
            true
          ) as boolean
          const contextWindow = this.getNodeParameter(
            'contextWindow',
            3
          ) as number

          const mockResults = this.generateMockSearchResults(
            Math.min(maxResults, 3),
            similarityThreshold
          )

          // Generate mock answer
          const mockAnswer = `Mock AI Answer: Based on the knowledge base, regarding "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}", the answer is: This is a comprehensive response generated from ${mockResults.length} relevant documents in the ${indexName} index. The information suggests multiple perspectives on this topic.`

          queryData = {
            toolMode,
            question: query,
            answer: mockAnswer,
            vectorStore,
            embeddingProvider,
            indexName,
            sourceDocuments: mockResults,
            confidence: Math.random() * 0.3 + 0.7, // Mock confidence between 0.7-1.0
          }
          break
        }

        case 'recommendation': {
          const contextField = this.getNodeParameter(
            'contextField',
            'content'
          ) as string
          const context = item.json[contextField] || ''

          const mockRecommendations = this.generateMockSearchResults(
            maxResults,
            similarityThreshold
          )
          mockRecommendations.forEach((rec: any, index: number) => {
            rec.recommendationScore = Math.random() * 0.4 + 0.6 // 0.6-1.0
            rec.recommendationType = [
              'similar_content',
              'related_topic',
              'complementary',
            ][index % 3]
          })

          queryData = {
            toolMode,
            context:
              context.substring(0, 200) + (context.length > 200 ? '...' : ''),
            vectorStore,
            embeddingProvider,
            indexName,
            recommendations: mockRecommendations,
            totalRecommendations: mockRecommendations.length,
            basedOn: contextField,
          }
          break
        }

        case 'extraction': {
          const contextField = this.getNodeParameter(
            'contextField',
            'content'
          ) as string
          const context = item.json[contextField] || ''

          const mockExtraction = {
            extractedEntities: [
              { type: 'concept', value: 'machine learning', confidence: 0.95 },
              {
                type: 'technology',
                value: 'neural networks',
                confidence: 0.89,
              },
              {
                type: 'application',
                value: 'natural language processing',
                confidence: 0.82,
              },
            ],
            keyTopics: ['AI', 'automation', 'data processing'],
            summary: `Extracted knowledge from ${contextField}: Key concepts and relationships identified.`,
            relatedDocuments: this.generateMockSearchResults(3, 0.8),
          }

          queryData = {
            toolMode,
            sourceContext:
              context.substring(0, 200) + (context.length > 200 ? '...' : ''),
            vectorStore,
            embeddingProvider,
            indexName,
            extraction: mockExtraction,
            extractionConfidence: 0.87,
          }
          break
        }
      }

      // Apply reranking if enabled
      if (rerankResults && queryData.results) {
        queryData.results.forEach((result: any, index: number) => {
          result.rerankScore = result.score * (1 + Math.random() * 0.1) // Slight boost for reranking
          result.originalRank = index + 1
        })
        queryData.results.sort(
          (a: any, b: any) => b.rerankScore - a.rerankScore
        )
        queryData.reranked = true
      }

      results.push({
        json: {
          ...item.json,
          vectorStoreTool: queryData,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return [results]
  }

  private generateMockSearchResults(count: number, threshold: number): any[] {
    const results = []
    for (let i = 0; i < count; i++) {
      const score = Math.random() * (1 - threshold) + threshold
      results.push({
        id: `doc_${Date.now()}_${i}`,
        score,
        metadata: {
          title: `Mock Document ${i + 1}`,
          content: `This is mock content for document ${i + 1} with similarity score ${score.toFixed(3)}`,
          category: ['technical', 'general', 'advanced'][i % 3],
          tags: ['AI', 'ML', 'data', 'automation'].slice(
            0,
            Math.floor(Math.random() * 4) + 1
          ),
          created: new Date(
            Date.now() - Math.random() * 86400000 * 365
          ).toISOString(),
          wordCount: Math.floor(Math.random() * 2000) + 100,
        },
        snippet: `Mock content snippet for document ${i + 1}...`,
      })
    }
    return results.sort((a, b) => b.score - a.score)
  }

  private generateMockContext(contextWindow: number, baseIndex: number): any[] {
    const context = []
    for (let i = 0; i < contextWindow; i++) {
      context.push({
        chunkId: `chunk_${baseIndex}_${i}`,
        content: `Mock context chunk ${i + 1}: This provides additional context and background information related to the search query.`,
        position: i + 1,
        relevanceScore: Math.random() * 0.3 + 0.7,
      })
    }
    return context
  }
}
