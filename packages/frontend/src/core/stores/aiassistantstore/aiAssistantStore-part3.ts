],
          isProcessingChat: false,
        }))
} catch (_error)
{
  set((state) => ({
    chatHistory: [
      ...state.chatHistory,
      {
        id: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
      },
    ],
    isProcessingChat: false,
  }));
}
},

    clearChatHistory: () =>
{
  set({ chatHistory: [] });
  // No-op for stub
}
,

    // Analysis actions
    analyzeWorkflow: async (_nodes, _edges) =>
{
  const state = get();
  if (!state.isEnabled || state.isAnalyzing) return;

  set({ isAnalyzing: true });

  try {
    // Stub analysis to satisfy compiler; integrate real logic later
    const analysis = {
      complexity: 0.5,
      performance: {
        bottlenecks: [],
        optimizationOpportunities: [],
        estimatedImprovement: 0,
      },
      reliability: {
        errorProneNodes: [],
        missingErrorHandling: [],
        suggestions: [],
      },
      maintainability: {
        codeQuality: 0.5,
        documentation: 0.5,
        modularity: 0.5,
      },
      patterns: { detected: [], recommendations: [] },
    } as WorkflowAnalysis;

    set({
      currentAnalysis: analysis,
      isAnalyzing: false,
      analysisTimestamp: new Date().toISOString(),
      activeIssues: (analysis.reliability?.missingErrorHandling || [])
        .map((issue, index) => ({
          id: `issue_${index}`,
          message: issue,
          type: 'error_handling',
        }))
        .filter((issue: any) => !get().dismissedIssues.has(issue.id)),
      activeSuggestions: (analysis.reliability?.suggestions || [])
        .map((suggestion, index) => ({
          id: `suggestion_${index}`,
          type: 'enhancement' as const,
          title: `Reliability Suggestion ${index + 1}`,
          description:
            typeof suggestion === 'string'
              ? suggestion
              : (suggestion as any)?.message || 'Reliability improvement suggestion',
          confidence: 0.8,
          impact: 'medium' as const,
          category: 'reliability',
          suggestedChanges: [],
          reasoning: 'AI-generated reliability improvement',
          estimatedBenefit: { reliability: 15 },
        }))
        .filter((suggestion: any) => !get().dismissedSuggestions.has(suggestion.id)),
    });
  } catch (_error) {
    set({ isAnalyzing: false });
  }
}
,

    refreshAnalysis: () =>
{
  set({
    currentAnalysis: null,
    analysisTimestamp: null,
    activeIssues: [],
    activeSuggestions: [],
  });
}
,

    // Suggestion actions
    getNodeSuggestions: async (context) =>
{
      const state = get();
      if (!state.isEnabled) return;
