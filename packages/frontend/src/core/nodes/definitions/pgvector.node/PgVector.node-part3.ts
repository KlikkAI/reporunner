timestamp: new Date().toISOString(),
}

// Mock operation results
switch (operation) {
  case 'insert': {
    result = {
      ...result,
      insertedId: `vec_${Date.now()}_${i}`,
      vector: processedVector,
      metadata: JSON.parse(metadata || '{}'),
      success: true,
      message: `Vector inserted into ${tableName}`,
    };
    break;
  }

  case 'search': {
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
          category: ['document', 'image', 'text'][j % 3],
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

  case 'update': {
    result = {
      ...result,
      updatedId: `vec_${Date.now()}_${i}`,
      vector: processedVector,
      metadata: JSON.parse(metadata || '{}'),
      success: true,
      message: `Vector updated in ${tableName}`,
    };
    break;
  }

  case 'delete': {
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

  async test(this: any): Promise<
{
  success: boolean;
  message: string;
  data?: any
}
>
{
    const credentials = this.getCredentials('postgresqlConnection');
    if (!credentials) {
      return {
        success: false,
        message: 'No PostgreSQL credentials configured. Please add PostgreSQL credentials.',
      };
    }
    // Mock implementation - in production, this would call backend API
    // Frontend should not connect directly to databases
    return {
