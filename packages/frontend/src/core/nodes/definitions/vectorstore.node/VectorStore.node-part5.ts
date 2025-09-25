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

      case 'get':
{
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

case 'list':
{
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
