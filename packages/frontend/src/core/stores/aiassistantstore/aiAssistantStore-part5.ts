autoFixIssue: async (issueId, _nodes, _edges) => {
  const state = get();
  const issue = state.activeIssues.find((i) => i.id === issueId);

  if (!issue || !issue.autoFixAvailable) {
    return false;
  }

  try {
    const result = { success: false, description: '' } as any;

    if (result.success) {
      // Dismiss the issue since it's been fixed
      get().dismissIssue(issueId);

      // Add success message to chat if chat is open
      if (state.isChatOpen) {
        set((state) => ({
          chatHistory: [
            ...state.chatHistory,
            {
              id: `autofix-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'system',
              content: `✅ Auto-fixed: ${result.description}`,
            },
          ],
        }));
      }

      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
},
  // Settings
  toggleAutoAnalyze;
: () =>
{
  set((state) => ({ autoAnalyze: !state.autoAnalyze }));
}
,

    toggleSuggestionTooltips: () =>
{
  set((state) => ({
    showSuggestionTooltips: !state.showSuggestionTooltips,
  }));
}
,
  }))
)

// Subscribe to workflow changes for auto-analysis
if (typeof window !== 'undefined') {
  // Auto-analyze workflow when nodes change (if enabled)
  // Auto-analyze timeout reserved for future automatic analysis features

  useAIAssistantStore.subscribe(
    (state) => ({
      autoAnalyze: state.autoAnalyze,
      isEnabled: state.isEnabled,
    }),
    ({ autoAnalyze, isEnabled }) => {
      if (autoAnalyze && isEnabled) {
        // Set up auto-analysis trigger
        // This would be connected to workflow store changes
      }
    }
  );
}
