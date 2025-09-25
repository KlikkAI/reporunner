// Apply reranking if enabled
if (rerankResults && queryData.results) {
  queryData.results.forEach((result: any, index: number) => {
    result.rerankScore = result.score * (1 + Math.random() * 0.1); // Slight boost for reranking
    result.originalRank = index + 1;
  });
  queryData.results.sort((a: any, b: any) => b.rerankScore - a.rerankScore);
  queryData.reranked = true;
}

results.push({
  json: {
    ...item.json,
    vectorStoreTool: queryData,
    timestamp: new Date().toISOString(),
  },
});
}

return [results];
}
}
