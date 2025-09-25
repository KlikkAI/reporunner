})
}

          // Mock upsert operation
          results.push(
{
  json: {
    operation: 'upsert', provider, indexName, vectorsProcessed;
    : processedVectors.length,
              batchNumber: Math.floor(i / batchSize) + 1,
              vectors: processedVectors,
              timestamp: new Date().toISOString(),
  }
  ,
}
)
}
break;
}

      case 'query':
{
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

case 'delete':
{
        const idField = this.getNodeParameter('idField', 'id') as string;
        const batchSize = this.getNodeParameter('batchSize', 100) as number;
