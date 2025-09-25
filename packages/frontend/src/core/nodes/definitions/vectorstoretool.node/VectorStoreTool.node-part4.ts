query, vectorStore, embeddingProvider, indexName, results;
: mockResults,
            contextWindow,
            summary,
            retrievalType: 'smart',
          }
break;
}

        case 'qa':
{
  const query = this.getNodeParameter('query', '') as string;

  const mockResults = this.generateMockSearchResults(Math.min(maxResults, 3), similarityThreshold);

  // Generate mock answer
  const mockAnswer = `Mock AI Answer: Based on the knowledge base, regarding "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}", the answer is: This is a comprehensive response generated from ${mockResults.length} relevant documents in the ${indexName} index. The information suggests multiple perspectives on this topic.`;

  queryData = {
    toolMode,
    question: query,
    answer: mockAnswer,
    vectorStore,
    embeddingProvider,
    indexName,
    sourceDocuments: mockResults,
    confidence: Math.random() * 0.3 + 0.7, // Mock confidence between 0.7-1.0
  };
  break;
}

case 'recommendation':
{
  const contextField = this.getNodeParameter('contextField', 'content') as string;
  const context = item.json[contextField] || '';

  const mockRecommendations = this.generateMockSearchResults(maxResults, similarityThreshold);
  mockRecommendations.forEach((rec: any, index: number) => {
    rec.recommendationScore = Math.random() * 0.4 + 0.6; // 0.6-1.0
    rec.recommendationType = ['similar_content', 'related_topic', 'complementary'][index % 3];
  });

  queryData = {
    toolMode,
    context: context.substring(0, 200) + (context.length > 200 ? '...' : ''),
    vectorStore,
    embeddingProvider,
    indexName,
    recommendations: mockRecommendations,
    totalRecommendations: mockRecommendations.length,
    basedOn: contextField,
  };
  break;
}

case 'extraction':
{
  const contextField = this.getNodeParameter('contextField', 'content') as string;
  const context = item.json[contextField] || '';

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
  };

  queryData = {
    toolMode,
    sourceContext: context.substring(0, 200) + (context.length > 200 ? '...' : ''),
    vectorStore,
    embeddingProvider,
    indexName,
    extraction: mockExtraction,
    extractionConfidence: 0.87,
  };
  break;
}
}
