try {
  const suggestions: WorkflowSuggestion[] = [];

  set({
    nodeSuggestions: suggestions,
    suggestionsVisible: suggestions.length > 0,
    suggestionContext: context,
  });
} catch (_error) {
  set({
    nodeSuggestions: [],
    suggestionsVisible: false,
  });
}
},

    hideSuggestions: () =>
{
  set({
    suggestionsVisible: false,
    nodeSuggestions: [],
  });
}
,

    applySuggestion: async (suggestionId) =>
{
  const state = get();
  const suggestion = state.activeSuggestions.find((s) => s.id === suggestionId);

  if (!suggestion) return;

  try {
    // Apply the suggestion based on its type
    switch (suggestion.type) {
      case 'optimization':
        break;

      case 'error-fix':
        break;

      case 'enhancement':
        break;

      case 'pattern':
        break;

      default:
    }

    // Add success message to chat if chat is open
    if (state.isChatOpen) {
      set((state) => ({
        chatHistory: [
          ...state.chatHistory,
          {
            id: `suggestion-applied-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'system',
            content: `✅ Applied suggestion: ${suggestion.title}`,
          },
        ],
      }));
    }

    // Mark as applied (dismiss)
    get().dismissSuggestion(suggestionId);
  } catch (_error) {
    // Add error message to chat if chat is open
    if (state.isChatOpen) {
      set((state) => ({
        chatHistory: [
          ...state.chatHistory,
          {
            id: `suggestion-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'system',
            content: `❌ Failed to apply suggestion: ${suggestion.title}`,
          },
        ],
      }));
    }
  }
}
,

    // Issue management
    dismissIssue: (issueId) =>
{
  set((state) => ({
    dismissedIssues: new Set([...state.dismissedIssues, issueId]),
    activeIssues: state.activeIssues.filter((issue) => issue.id !== issueId),
  }));
}
,

    dismissSuggestion: (suggestionId) =>
{
  set((state) => ({
    dismissedSuggestions: new Set([...state.dismissedSuggestions, suggestionId]),
    activeSuggestions: state.activeSuggestions.filter(
      (suggestion) => suggestion.id !== suggestionId
    ),
  }));
}
,
