/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from "../../nodes/types";
import { UNIFIED_CATEGORIES } from "../../constants/categories";

export class PgVector implements INodeType {
  description: INodeTypeDescription = {
    displayName: "PGVector",
    name: "pgvector",
    icon: "📊",
    group: ["database"],
    version: 1,
    description: "Interact with PostgreSQL vector database for embeddings",
    defaults: {
      name: "PGVector",
      color: "#336791",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "postgresqlConnection",
        required: true,
      },
    ],
    properties: [
      {
        name: "operation",
        displayName: "Operation",
        type: "select",
        required: true,
        description: "Operation to perform on the vector database",
        default: "search",
        options: [
          { name: "Insert Vector", value: "insert" },
          { name: "Search Vectors", value: "search" },
          { name: "Delete Vector", value: "delete" },
          { name: "Update Vector", value: "update" },
        ],
      },
      {
        name: "tableName",
        displayName: "Table Name",
        type: "string",
        required: true,
        description: "Name of the table to store vectors",
        default: "embeddings",
        placeholder: "embeddings",
      },
      {
        name: "vectorColumn",
        displayName: "Vector Column",
        type: "string",
        required: true,
        description: "Column name for vector data",
        default: "embedding",
        placeholder: "embedding",
      },
      {
        name: "vector",
        displayName: "Vector Data",
        type: "text",
        required: true,
        description:
          "Vector array as JSON string or use {{input}} for dynamic data",
        default: "",
        placeholder: "[0.1, 0.2, 0.3, ...] or {{input}}",
        rows: 3,
        displayOptions: {
          show: {
            operation: ["insert", "search", "update"],
          },
        },
      },
      {
        name: "metadata",
        displayName: "Metadata",
        type: "text",
        required: false,
        description: "Additional metadata as JSON object",
        default: "{}",
        placeholder: '{"text": "sample text", "category": "example"}',
        rows: 3,
        displayOptions: {
          show: {
            operation: ["insert", "update"],
          },
        },
      },
      {
        name: "limit",
        displayName: "Result Limit",
        type: "number",
        required: false,
        description: "Maximum number of results to return",
        default: 10,
        min: 1,
        max: 1000,
        displayOptions: {
          show: {
            operation: ["search"],
          },
        },
      },
      {
        name: "distanceStrategy",
        displayName: "Distance Strategy",
        type: "select",
        required: false,
        description: "Method for calculating vector similarity",
        default: "cosine",
        options: [
          { name: "Cosine Similarity", value: "cosine" },
          { name: "Euclidean Distance", value: "euclidean" },
          { name: "Inner Product", value: "inner_product" },
        ],
        displayOptions: {
          show: {
            operation: ["search"],
          },
        },
      },
      {
        name: "threshold",
        displayName: "Similarity Threshold",
        type: "number",
        required: false,
        description: "Minimum similarity score for results",
        default: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        displayOptions: {
          show: {
            operation: ["search"],
          },
        },
      },
      {
        name: "idColumn",
        displayName: "ID Column",
        type: "string",
        required: false,
        description: "Column name for unique identifiers",
        default: "id",
        placeholder: "id",
      },
      {
        name: "whereClause",
        displayName: "WHERE Clause",
        type: "text",
        required: false,
        description: "Additional SQL WHERE conditions",
        default: "",
        placeholder: "category = 'example' AND created_at > '2024-01-01'",
        rows: 2,
        displayOptions: {
          show: {
            operation: ["search", "delete"],
          },
        },
      },
    ],
    categories: [UNIFIED_CATEGORIES.DATA_STORAGE],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const parameters = this.getNodeParameter("parameters"); // Assuming parameters are passed as a single object

    // Extract parameters
    const operation = (parameters.operation as string) || "search";
    const tableName = (parameters.tableName as string) || "customerSuppertDocs";
    const vectorColumn = (parameters.vectorColumn as string) || "embedding";
    const vector = parameters.vector as string;
    const metadata = (parameters.metadata as string) || "{}";
    const limit = (parameters.limit as number) || 5;
    const distanceStrategy =
      (parameters.distanceStrategy as string) || "cosine";
    const threshold = (parameters.threshold as number) || 0.7;
    const idColumn = (parameters.idColumn as string) || "id";
    const whereClause = (parameters.whereClause as string) || "";

    const inputData = this.getInputData();
    const results: INodeExecutionData[] = [];

    // Process each input item
    for (let i = 0; i < inputData.length; i++) {
      const item = inputData[i];

      // Replace {{input}} placeholders with actual input data
      let processedVector = vector;
      if (processedVector.includes("{{input}}")) {
        const inputContent =
          typeof item.json === "object"
            ? JSON.stringify(item.json)
            : String(item.json);
        processedVector = processedVector.replace(
          /\{\{input\}\}/g,
          inputContent,
        );
      }

      let result: any = {
        operation,
        tableName,
        vectorColumn,
        idColumn,
        timestamp: new Date().toISOString(),
      };

      // Mock operation results
      switch (operation) {
        case "insert": {
          result = {
            ...result,
            insertedId: `vec_${Date.now()}_${i}`,
            vector: processedVector,
            metadata: JSON.parse(metadata || "{}"),
            success: true,
            message: `Vector inserted into ${tableName}`,
          };
          break;
        }

        case "search": {
          // Generate mock search results
          const mockResults = [];
          const numResults = Math.min(limit, 3); // Limit mock results

          for (let j = 0; j < numResults; j++) {
            const score = Math.random() * (1 - threshold) + threshold;
            mockResults.push({
              id: `result_${j + 1}`,
              vector: Array(384)
                .fill(0)
                .map(() => Math.random() - 0.5), // Mock 384-dim vector
              metadata: {
                text: `Mock vector result ${j + 1}`,
                category: ["document", "image", "text"][j % 3],
                created_at: new Date(Date.now() - j * 86400000).toISOString(),
              },
              similarity: score,
              distance: 1 - score,
            });
          }

          result = {
            ...result,
            queryVector: processedVector,
            distanceStrategy,
            threshold,
            limit,
            whereClause,
            results: mockResults,
            totalResults: mockResults.length,
            success: true,
          };
          break;
        }

        case "update": {
          result = {
            ...result,
            updatedId: `vec_${Date.now()}_${i}`,
            vector: processedVector,
            metadata: JSON.parse(metadata || "{}"),
            success: true,
            message: `Vector updated in ${tableName}`,
          };
          break;
        }

        case "delete": {
          result = {
            ...result,
            whereClause,
            deletedCount: Math.floor(Math.random() * 5) + 1,
            success: true,
            message: `Vectors deleted from ${tableName}`,
          };
          break;
        }
      }

      results.push({
        json: {
          ...item.json,
          pgvectorResult: result,
          success: result.success,
        },
      });
    }

    return [results];
  }

  async test(
    this: any,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const credentials = this.getCredentials("postgresqlConnection");
    if (!credentials) {
      return {
        success: false,
        message:
          "No PostgreSQL credentials configured. Please add PostgreSQL credentials.",
      };
    }
    // Mock implementation - in production, this would call backend API
    // Frontend should not connect directly to databases
    return {
      success: true,
      message: "Connection test successful (mock)",
      data: {
        database: "mock_database",
        version: "PostgreSQL 15.0",
        pgvectorInstalled: true,
      },
    };
  }
}
