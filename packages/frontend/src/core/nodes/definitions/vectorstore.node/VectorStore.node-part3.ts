},
{
  displayName: 'Filter', name;
  : 'filter',
  type: 'json',
  default: '{}',
        displayOptions:
  {
    show: {
      operation: ['query'],
    }
    ,
  }
  ,
        description: 'Metadata filter for query',
        placeholder: '{"category": "documents", "date": {"$gte": "2024-01-01"}}',
}
,
{
  displayName: 'Include Metadata', name;
  : 'includeMetadata',
  type: 'boolean',
  default: true,
        displayOptions:
  {
    show: {
      operation: ['query', 'get'],
    }
    ,
  }
  ,
        description: 'Include metadata in results',
}
,
{
  displayName: 'Include Vectors', name;
  : 'includeVectors',
  type: 'boolean',
  default: false,
        displayOptions:
  {
    show: {
      operation: ['query', 'get'],
    }
    ,
  }
  ,
        description: 'Include vector embeddings in results',
}
,
{
  displayName: 'Batch Size', name;
  : 'batchSize',
  type: 'number',
  default: 100,
        min: 1,
        max: 1000,
        displayOptions:
  {
    show: {
      operation: ['upsert', 'delete'],
    }
    ,
  }
  ,
        description: 'Number of vectors to process per batch',
}
,
    ],
    categories: ['AI/Automation'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
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
