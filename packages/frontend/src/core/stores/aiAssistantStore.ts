/**
 * AI Assistant Store
 *
 * Zustand store for managing AI assistant state, chat history,
 * workflow analysis, and real-time AI interactions.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { aiAssistantService } from "../services/aiAssistantService";
import type { WorkflowAnalysis } from "../services/aiAssistantService";
import type { AIWorkflowSuggestion as WorkflowSuggestion } from "../services/aiAssistantService";
import type { WorkflowNodeInstance } from "../nodes/types";
import type { WorkflowEdge } from "./leanWorkflowStore";

export interface AIAssistantState {
  // Configuration
  isEnabled: boolean;
  config: {
    provider: string;
    temperature: number;
    maxTokens: number;
  };

  // Chat interface
  isChatOpen: boolean;
  chatHistory: Array<{
    id: string;
    timestamp: string;
    type: string;
    content: string;
    context?: any;
  }>;
  isProcessingChat: boolean;
  chatInput: string;

  // Workflow analysis
  currentAnalysis: WorkflowAnalysis | null;
  isAnalyzing: boolean;
  analysisTimestamp: string | null;

  // Node suggestions
  nodeSuggestions: WorkflowSuggestion[];
  suggestionsVisible: boolean;
  suggestionContext: any;

  // Issues and suggestions
  activeIssues: Array<{ id: string; autoFixAvailable?: boolean }>;
  activeSuggestions: WorkflowSuggestion[];
  dismissedIssues: Set<string>;
  dismissedSuggestions: Set<string>;

  // UI state
  assistantPanelOpen: boolean;
  activeTab: "chat" | "analysis" | "suggestions" | "settings";
  autoAnalyze: boolean;
  showSuggestionTooltips: boolean;

  // Actions
  toggleAssistant: () => void;
  toggleChat: () => void;
  toggleAssistantPanel: () => void;
  setActiveTab: (tab: "chat" | "analysis" | "suggestions" | "settings") => void;
  updateConfig: (config: Partial<AIAssistantConfig>) => void;

  // Chat actions
  setChatInput: (input: string) => void;
  sendChatMessage: (message: string, context?: any) => Promise<void>;
  clearChatHistory: () => void;

  // Analysis actions
  analyzeWorkflow: (
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[],
  ) => Promise<void>;
  refreshAnalysis: () => void;

  // Suggestion actions
  getNodeSuggestions: (context: any) => Promise<void>;
  hideSuggestions: () => void;
  applySuggestion: (suggestionId: string) => Promise<void>;

  // Issue management
  dismissIssue: (issueId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  autoFixIssue: (
    issueId: string,
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[],
  ) => Promise<boolean>;

  // Settings
  toggleAutoAnalyze: () => void;
  toggleSuggestionTooltips: () => void;
}

export const useAIAssistantStore = create<AIAssistantState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isEnabled: true,
    config: {
      provider: "mock",
      temperature: 0.7,
      maxTokens: 2000,
    },

    // Chat state
    isChatOpen: false,
    chatHistory: [],
    isProcessingChat: false,
    chatInput: "",

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
    activeTab: "chat",
    autoAnalyze: true,
    showSuggestionTooltips: true,

    // Basic actions
    toggleAssistant: () => {
      set((state) => ({
        isEnabled: !state.isEnabled,
        isChatOpen: state.isEnabled ? false : state.isChatOpen,
        assistantPanelOpen: state.isEnabled ? false : state.assistantPanelOpen,
      }));
    },

    toggleChat: () => {
      set((state) => ({
        isChatOpen: !state.isChatOpen,
        assistantPanelOpen: !state.isChatOpen ? true : state.assistantPanelOpen,
      }));
    },

    toggleAssistantPanel: () => {
      set((state) => ({ assistantPanelOpen: !state.assistantPanelOpen }));
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },

    updateConfig: (newConfig) => {
      const updatedConfig = { ...get().config, ...newConfig };
      set({ config: updatedConfig });
      // No-op: config would be forwarded to service if needed
    },

    // Chat actions
    setChatInput: (input) => {
      set({ chatInput: input });
    },

    sendChatMessage: async (message, context) => {
      const state = get();
      if (!state.isEnabled || state.isProcessingChat) return;

      set({
        isProcessingChat: true,
        chatInput: "",
        chatHistory: [
          ...state.chatHistory,
          {
            id: `user-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "user",
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
              type: "system",
              content: "AI assistant response stub.",
            } as any,
          ],
          isProcessingChat: false,
        }));
      } catch (error) {
        console.error("Chat message failed:", error);
        set((state) => ({
          chatHistory: [
            ...state.chatHistory,
            {
              id: `error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: "system",
              content:
                "Sorry, I encountered an error processing your message. Please try again.",
            },
          ],
          isProcessingChat: false,
        }));
      }
    },

    clearChatHistory: () => {
      set({ chatHistory: [] });
      // No-op for stub
    },

    // Analysis actions
    analyzeWorkflow: async (nodes, edges) => {
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
          activeIssues: analysis.issues.filter(
            (issue) => !get().dismissedIssues.has(issue.id),
          ),
          activeSuggestions: analysis.suggestions.filter(
            (suggestion) => !get().dismissedSuggestions.has(suggestion.id),
          ),
        });
      } catch (error) {
        console.error("Workflow analysis failed:", error);
        set({ isAnalyzing: false });
      }
    },

    refreshAnalysis: () => {
      set({
        currentAnalysis: null,
        analysisTimestamp: null,
        activeIssues: [],
        activeSuggestions: [],
      });
    },

    // Suggestion actions
    getNodeSuggestions: async (context) => {
      const state = get();
      if (!state.isEnabled) return;

      try {
        const suggestions: WorkflowSuggestion[] = [];

        set({
          nodeSuggestions: suggestions,
          suggestionsVisible: suggestions.length > 0,
          suggestionContext: context,
        });
      } catch (error) {
        console.error("Node suggestions failed:", error);
        set({
          nodeSuggestions: [],
          suggestionsVisible: false,
        });
      }
    },

    hideSuggestions: () => {
      set({
        suggestionsVisible: false,
        nodeSuggestions: [],
      });
    },

    applySuggestion: async (suggestionId) => {
      const state = get();
      const suggestion = state.activeSuggestions.find(
        (s) => s.id === suggestionId,
      );

      if (!suggestion) return;

      // TODO: Implement suggestion application logic
      console.log("Applying suggestion:", suggestion);

      // Mark as applied (dismiss)
      get().dismissSuggestion(suggestionId);
    },

    // Issue management
    dismissIssue: (issueId) => {
      set((state) => ({
        dismissedIssues: new Set([...state.dismissedIssues, issueId]),
        activeIssues: state.activeIssues.filter(
          (issue) => issue.id !== issueId,
        ),
      }));
    },

    dismissSuggestion: (suggestionId) => {
      set((state) => ({
        dismissedSuggestions: new Set([
          ...state.dismissedSuggestions,
          suggestionId,
        ]),
        activeSuggestions: state.activeSuggestions.filter(
          (suggestion) => suggestion.id !== suggestionId,
        ),
      }));
    },

    autoFixIssue: async (issueId, nodes, edges) => {
      const state = get();
      const issue = state.activeIssues.find((i) => i.id === issueId);

      if (!issue || !issue.autoFixAvailable) {
        return false;
      }

      try {
        const result = { success: false, description: "" } as any;

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
                  type: "system",
                  content: `✅ Auto-fixed: ${result.description}`,
                },
              ],
            }));
          }

          return true;
        }

        return false;
      } catch (error) {
        console.error("Auto-fix failed:", error);
        return false;
      }
    },

    // Settings
    toggleAutoAnalyze: () => {
      set((state) => ({ autoAnalyze: !state.autoAnalyze }));
    },

    toggleSuggestionTooltips: () => {
      set((state) => ({
        showSuggestionTooltips: !state.showSuggestionTooltips,
      }));
    },
  })),
);

// Subscribe to workflow changes for auto-analysis
if (typeof window !== "undefined") {
  // Auto-analyze workflow when nodes change (if enabled)
  let autoAnalyzeTimeout: NodeJS.Timeout;

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
    },
  );
}
