{
  ...item.json,
              error: `No text found in field '${textField}'`,
              embedding: null,
}
,
          })
continue;
}

// Generate mock embedding vector
const embeddingDimensions =
  provider === 'openai' && ['text-embedding-3-small', 'text-embedding-3-large'].includes(model)
    ? dimensions
    : this.getDefaultDimensions(model);

const mockEmbedding = this.generateMockEmbedding(embeddingDimensions, normalize);

const result: any = {
  ...item.json,
  embedding: mockEmbedding,
  text: textToEmbed,
  textLength: textToEmbed.length,
};

if (includeMetadata) {
  result.embeddingMetadata = {
    provider,
    model,
    dimensions: embeddingDimensions,
    normalized: normalize,
    tokensUsed: Math.ceil(textToEmbed.length / 4), // Rough token estimation
    cost: this.calculateMockCost(provider, textToEmbed.length),
    timestamp: new Date().toISOString(),
  };
}

results.push({ json: result });
}
    }

return [results];
}
}
