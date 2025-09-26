// Compatibility shim to avoid duplicate implementations.
// Re-export the canonical AI Assistant service and related types
// from the consolidated service file one level up.

export {
  AIAssistantService,
  aiAssistantService,
  type AIWorkflowSuggestion,
  type SuggestedChange,
  type WorkflowAnalysis,
  type NaturalLanguageRequest,
  type AIWorkflowGeneration,
  type ErrorDiagnosis,
  type ErrorSolution,
} from '../aiAssistantService';

export default AIAssistantService;

