/**
 * AI Assistant Store
 *
 * Zustand store for managing AI assistant state, chat history,
 * workflow analysis, and real-time AI interactions.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WorkflowNodeInstance } from '../nodes/types';
// import { aiAssistantService } from "../services/aiAssistantService";
import type {
  WorkflowAnalysis,
  AIWorkflowSuggestion as WorkflowSuggestion,
} from '../services/aiAssistantService';
import type { WorkflowEdge } from './leanWorkflowStore';

export interface AIAssistantConfig {
  provider: string;
  temperature: number;
  maxTokens: number;
}

export interface AIAssistantState {
  // Configuration
  isEnabled: boolean;
  config: AIAssistantConfig;

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
  activeTab: 'chat' | 'analysis' | 'suggestions' | 'settings';
  autoAnalyze: boolean;
  showSuggestionTooltips: boolean;

  // Actions
  toggleAssistant: () => void;
  toggleChat: () => void;
  toggleAssistantPanel: () => void;
  setActiveTab: (tab: 'chat' | 'analysis' | 'suggestions' | 'settings') => void;
  updateConfig: (config: Partial<AIAssistantConfig>) => void;

  // Chat actions
  setChatInput: (input: string) => void;
  sendChatMessage: (message: string, context?: any) => Promise<void>;
  clearChatHistory: () => void;

  // Analysis actions
  analyzeWorkflow: (nodes: WorkflowNodeInstance[], edges: WorkflowEdge[]) => Promise<void>;
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
    edges: WorkflowEdge[]
  ) => Promise<boolean>;

  // Settings
  toggleAutoAnalyze: () => void;
  toggleSuggestionTooltips: () => void;
}

export const useAIAssistantStore = create<AIAssistantState>()(
  subscribeWithSelector((set, get) => ({
// Initial state
