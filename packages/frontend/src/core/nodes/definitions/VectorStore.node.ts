/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class VectorStoreNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vector Store',
    name: 'vectorstore',
    icon: '🗃️',
    group: ['ai'],
    version: 1,
    description: 'Store and query vector embeddings in vector databases',
    defaults: {
      name: 'Vector Store',
      color: '#7c3aed',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'pinecone',
        required: false,
        displayOptions: {
          show: {
            provider: ['pinecone'],
          },
        },
      },
      {
        name: 'weaviate',
        required: false,
        displayOptions: {
          show: {
            provider: ['weaviate'],
          },
        },
      },
      {
        name: 'qdrant',
        required: false,
        displayOptions: {
          show: {
            provider: ['qdrant'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'upsert',
        required: true,
        options: [
          {
            name: 'Insert/Update (Upsert)',
            value: 'upsert',
            description: 'Add or update vectors in the store',
          },
          {
            name: 'Query',
            value: 'query',
            description: 'Search for similar vectors',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete vectors from the store',
          },
          {
            name: 'Get by ID',
            value: 'get',
            description: 'Retrieve vectors by ID',
          },
          {
            name: 'List Collections',
            value: 'list',
            description: 'List available collections/indexes',
          },
        ],
        description: 'Vector store operation to perform',
      },
      {
        displayName: 'Provider',
        name: 'provider',
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
          {
            name: 'FAISS (Local)',
            value: 'faiss',
          },
        ],
        description: 'Vector database provider',
      },
      {
        displayName: 'Index/Collection Name',
        name: 'indexName',
        type: 'string',
        default: 'default',
        required: true,
        description: 'Name of the index or collection',
        placeholder: 'my-index, documents, embeddings',
      },
      {
        displayName: 'Vector Field',
        name: 'vectorField',
        type: 'string',
        default: 'embedding',
        displayOptions: {
          show: {
            operation: ['upsert', 'query'],
          },
        },
        description: 'Field containing the vector embedding',
        placeholder: 'embedding, vector, embeddings',
      },
      {
        displayName: 'ID Field',
        name: 'idField',
        type: 'string',
        default: 'id',
        displayOptions: {
          show: {
            operation: ['upsert', 'delete', 'get'],
          },
        },
        description: 'Field containing the vector ID',
        placeholder: 'id, _id, doc_id',
      },
      {
        displayName: 'Metadata Fields',
        name: 'metadataFields',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['upsert'],
          },
        },
        description: 'Fields to store as metadata (comma-separated)',
        placeholder: 'title, content, category, timestamp',
      },
      {
        displayName: 'Query Vector',
        name: 'queryVector',
        type: 'string',
        default: 'embedding',
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Field containing the query vector or raw query text',
        placeholder: 'embedding, query_vector, search_text',
      },
      {
        displayName: 'Top K',
        name: 'topK',
        type: 'number',
        default: 5,
        min: 1,
        max: 100,
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Number of similar vectors to return',
      },
      {
        displayName: 'Score Threshold',
        name: 'scoreThreshold',
        type: 'number',
        default: 0.0,
        min: 0,
        max: 1,
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Minimum similarity score threshold',
      },
      {
        displayName: 'Filter',
        name: 'filter',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            operation: ['query'],
          },
        },
        description: 'Metadata filter for query',
        placeholder: '{"category": "documents", "date": {"$gte": "2024-01-01"}}',
      },
      {
        displayName: 'Include Metadata',
        name: 'includeMetadata',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            operation: ['query', 'get'],
          },
        },
        description: 'Include metadata in results',
      },
      {
        displayName: 'Include Vectors',
        name: 'includeVectors',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            operation: ['query', 'get'],
          },
        },
        description: 'Include vector embeddings in results',
      },
      {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        default: 100,
        min: 1,
        max: 1000,
        displayOptions: {
          show: {
            operation: ['upsert', 'delete'],
          },
        },
        description: 'Number of vectors to process per batch',
      },
    ],
    categories: ['AI/Automation'],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData();
    const operation = this.getNodeParameter('operation', 'upsert') as string;
    const provider = this.getNodeParameter('provider', 'pinecone') as string;
    const indexName = this.getNodeParameter('indexName', 'default') as string;

    const results: INodeExecutionData[] = [];

    switch (operation) {
      case 'upsert': {
        const vectorField = this.getNodeParameter('vectorField', 'embedding') as string;
        const idField = this.getNodeParameter('idField', 'id') as string;
        const metadataFieldsStr = this.getNodeParameter('metadataFields', '') as string;
        const metadataFields = metadataFieldsStr
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f);
        const batchSize = this.getNodeParameter('batchSize', 100) as number;

        // Process in batches
        for (let i = 0; i < inputData.length; i += batchSize) {
          const batch = inputData.slice(i, i + batchSize);
          const processedVectors: any[] = [];

          for (const item of batch) {
            const vector = item.json[vectorField];
            const id = item.json[idField];

            if (!vector || !id) {
              continue;
            }

            // Extract metadata
            const metadata: any = {};
            metadataFields.forEach((field) => {
              if (item.json[field] !== undefined) {
                metadata[field] = item.json[field];
              }
            });

            processedVectors.push({
              id: String(id),
              vector: Array.isArray(vector) ? vector : [vector],
              metadata,
            });
          }

          // Mock upsert operation
          results.push({
            json: {
              operation: 'upsert',
              provider,
              indexName,
              vectorsProcessed: processedVectors.length,
              batchNumber: Math.floor(i / batchSize) + 1,
              vectors: processedVectors,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;
      }

      case 'query': {
        const queryVectorField = this.getNodeParameter('queryVector', 'embedding') as string;
        const topK = this.getNodeParameter('topK', 5) as number;
        const scoreThreshold = this.getNodeParameter('scoreThreshold', 0.0) as number;
        const filterStr = this.getNodeParameter('filter', '{}') as string;
        const includeMetadata = this.getNodeParameter('includeMetadata', true) as boolean;
        const includeVectors = this.getNodeParameter('includeVectors', false) as boolean;

        let filter;
        try {
          filter = JSON.parse(filterStr);
        } catch {
          filter = {};
        }

        // Process each query
        for (const item of inputData) {
          const queryVector = item.json[queryVectorField];

          if (!queryVector) {
            results.push({
              json: {
                ...item.json,
                error: `No query vector found in field '${queryVectorField}'`,
                matches: [],
              },
            });
            continue;
          }

          // Generate mock search results
          const mockMatches = [];
          for (let i = 0; i < Math.min(topK, 5); i++) {
            const score = Math.random() * (1 - scoreThreshold) + scoreThreshold;
            const match: any = {
              id: `doc_${i + 1}_${Date.now()}`,
              score,
            };

            if (includeMetadata) {
              match.metadata = {
                title: `Mock Document ${i + 1}`,
                category: ['documents', 'articles', 'papers'][i % 3],
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
              };
            }

            if (includeVectors) {
              match.vector = Array(384)
                .fill(0)
                .map(() => Math.random() - 0.5); // Mock 384-dim vector
            }

            mockMatches.push(match);
          }

          // Sort by score descending
          mockMatches.sort((a, b) => b.score - a.score);

          results.push({
            json: {
              ...item.json,
              operation: 'query',
              provider,
              indexName,
              queryVector: Array.isArray(queryVector) ? queryVector.slice(0, 5) : 'processed',
              topK,
              scoreThreshold,
              filter,
              matches: mockMatches,
              totalMatches: mockMatches.length,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;
      }

      case 'delete': {
        const idField = this.getNodeParameter('idField', 'id') as string;
        const batchSize = this.getNodeParameter('batchSize', 100) as number;

        // Process in batches
        for (let i = 0; i < inputData.length; i += batchSize) {
          const batch = inputData.slice(i, i + batchSize);
          const idsToDelete = batch
            .map((item: INodeExecutionData) => item.json[idField])
            .filter((id: any) => id !== undefined)
            .map((id: any) => String(id));

          results.push({
            json: {
              operation: 'delete',
              provider,
              indexName,
              deletedIds: idsToDelete,
              deletedCount: idsToDelete.length,
              batchNumber: Math.floor(i / batchSize) + 1,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;
      }

      case 'get': {
        const idField = this.getNodeParameter('idField', 'id') as string;
        const includeMetadata = this.getNodeParameter('includeMetadata', true) as boolean;
        const includeVectors = this.getNodeParameter('includeVectors', false) as boolean;

        for (const item of inputData) {
          const id = item.json[idField];

          if (!id) {
            results.push({
              json: {
                ...item.json,
                error: `No ID found in field '${idField}'`,
                vector: null,
              },
            });
            continue;
          }

          const mockResult: any = {
            ...item.json,
            operation: 'get',
            provider,
            indexName,
            id: String(id),
            found: true,
          };

          if (includeMetadata) {
            mockResult.metadata = {
              title: `Document ${id}`,
              content: `This is mock content for document ${id}`,
              created: new Date().toISOString(),
            };
          }

          if (includeVectors) {
            mockResult.vector = Array(384)
              .fill(0)
              .map(() => Math.random() - 0.5);
          }

          results.push({ json: mockResult });
        }
        break;
      }

      case 'list': {
        // Mock list collections/indexes
        const mockCollections = [
          {
            name: 'documents',
            dimension: 1536,
            metric: 'cosine',
            vectorCount: 10000,
          },
          {
            name: 'embeddings',
            dimension: 384,
            metric: 'euclidean',
            vectorCount: 5000,
          },
          {
            name: 'knowledge-base',
            dimension: 768,
            metric: 'dotproduct',
            vectorCount: 25000,
          },
        ];

        results.push({
          json: {
            operation: 'list',
            provider,
            collections: mockCollections,
            totalCollections: mockCollections.length,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }
    }

    return [results];
  }
}
