description: 'Number of context chunks to include',
},
{
  displayName: 'Filter Metadata', name;
  : 'filterMetadata',
  type: 'json',
  default: '{}',
        description: 'Metadata filter for search results',
        placeholder: '{"category": "technical", "date": {"$gte": "2024-01-01"}}',
}
,
{
  displayName: 'Rerank Results', name;
  : 'rerankResults',
  type: 'boolean',
  default: true,
        description: 'Apply intelligent reranking to results',
}
,
{
  displayName: 'Generate Summary', name;
  : 'generateSummary',
  type: 'boolean',
  default: false,
        displayOptions:
      toolMode: ['smart-retrieval', 'qa'],
    ,
  ,
        description: 'Generate AI summary of retrieved content',
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
    const toolMode = this.getNodeParameter('toolMode', 'semantic-search') as string;
    const vectorStore = this.getNodeParameter('vectorStore', 'pinecone') as string;
    const embeddingProvider = this.getNodeParameter('embeddingProvider', 'openai') as string;
    const indexName = this.getNodeParameter('indexName', 'knowledge-base') as string;
    const maxResults = this.getNodeParameter('maxResults', 5) as number;
    const similarityThreshold = this.getNodeParameter('similarityThreshold', 0.7) as number;
    const rerankResults = this.getNodeParameter('rerankResults', true) as boolean;

    const results: INodeExecutionData[] = [];

    // Process each input
    for (const item of inputData) {
      let queryData: any;

      switch (toolMode) {
        case 'semantic-search': {
          const query = this.getNodeParameter('query', '') as string;
          const filterMetadataStr = this.getNodeParameter('filterMetadata', '{}') as string;

          let filterMetadata;
          try {
            filterMetadata = JSON.parse(filterMetadataStr);
          } catch {
            filterMetadata = {};
          }

          // Mock semantic search
          const mockResults = this.generateMockSearchResults(maxResults, similarityThreshold);

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
          };
          break;
        }

        case 'smart-retrieval': {
          const query = this.getNodeParameter('query', '') as string;
          const includeContext = this.getNodeParameter('includeContext', true) as boolean;
          const contextWindow = this.getNodeParameter('contextWindow', 3) as number;
          const generateSummary = this.getNodeParameter('generateSummary', false) as boolean;

          const mockResults = this.generateMockSearchResults(maxResults, similarityThreshold);

          // Add context if requested
          if (includeContext) {
            mockResults.forEach((result: any, index: number) => {
              result.context = this.generateMockContext(contextWindow, index);
            });
          }

          let summary = '';
          if (generateSummary) {
            summary = `Mock AI summary: Based on the retrieved documents about "${query}", the key findings are: 1) ${mockResults[0]?.metadata?.title || 'Topic A'}, 2) Related concepts, 3) Practical applications.`;
          }

          queryData = {
            toolMode,
