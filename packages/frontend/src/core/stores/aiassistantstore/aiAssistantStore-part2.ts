isEnabled: true, config;
:
{
  provider: 'mock', temperature;
  : 0.7,
      maxTokens: 2000,
}
,

    // Chat state
    isChatOpen: false,
    chatHistory: [],
    isProcessingChat: false,
    chatInput: '',

    // Analysis state
    currentAnalysis: null,
    isAnalyzing: false,
    analysisTimestamp: null,

    // Suggestions state
    nodeSuggestions: [],
    suggestionsVisible: false,
    suggestionContext: null,

    // Issues state
    activeIssues: [],
    activeSuggestions: [],
    dismissedIssues: new Set(),
    dismissedSuggestions: new Set(),

    // UI state
    assistantPanelOpen: false,
    activeTab: 'chat',
    autoAnalyze: true,
    showSuggestionTooltips: true,

    // Basic actions
    toggleAssistant: () =>
{
  set((state) => ({
    isEnabled: !state.isEnabled,
    isChatOpen: state.isEnabled ? false : state.isChatOpen,
    assistantPanelOpen: state.isEnabled ? false : state.assistantPanelOpen,
  }));
}
,

    toggleChat: () =>
{
  set((state) => ({
    isChatOpen: !state.isChatOpen,
    assistantPanelOpen: !state.isChatOpen ? true : state.assistantPanelOpen,
  }));
}
,

    toggleAssistantPanel: () =>
{
  set((state) => ({ assistantPanelOpen: !state.assistantPanelOpen }));
}
,

    setActiveTab: (tab) =>
{
  set({ activeTab: tab });
}
,

    updateConfig: (newConfig) =>
{
  const updatedConfig = { ...get().config, ...newConfig };
  set({ config: updatedConfig });
  // No-op: config would be forwarded to service if needed
}
,

    // Chat actions
    setChatInput: (input) =>
{
  set({ chatInput: input });
}
,

    sendChatMessage: async (message, context) =>
{
      const state = get();
      if (!state.isEnabled || state.isProcessingChat) return;

      set({
        isProcessingChat: true,
        chatInput: '',
        chatHistory: [
          ...state.chatHistory,
          {
            id: `user-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'user',
            content: message,
            context,
          },
        ],
      });

      try {
        // Stubbed chat handling for compile-time; integrate real service later
        set((state) => ({
          chatHistory: [
            ...state.chatHistory,
            {
              id: `assistant-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'system',
              content: 'AI assistant response stub.',
            } as any,
