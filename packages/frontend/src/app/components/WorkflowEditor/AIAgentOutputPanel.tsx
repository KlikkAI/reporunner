/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface AIAgentOutputPanelProps {
  data: any;
  testResults?: any;
  nodeType?: string;
}

const AIAgentOutputPanel: React.FC<AIAgentOutputPanelProps> = ({
  data,
  testResults,
  nodeType: _nodeType = "ai-agent",
}) => {
  // Extract AI response data from either direct data or testResults
  const aiData = data?.data || testResults?.data || data;

  if (!aiData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center space-y-2">
          <div className="text-2xl">🤖</div>
          <div className="text-sm">No AI response yet</div>
          <div className="text-xs">Test the node to see AI output</div>
        </div>
      </div>
    );
  }

  // Check if this is an AI Agent response with enhanced structure
  const hasAIOutput = aiData.llmResponse || aiData.analysis || aiData.output;
  const hasEmailData =
    aiData.originalEmail || aiData.emailClassification || aiData.emailResponse;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* === AI RESPONSE SECTION === */}
      {hasAIOutput && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🤖</span>
            <h4 className="font-semibold text-gray-100">AI Response</h4>
            {aiData.llmResponse?.provider && aiData.llmResponse?.model && (
              <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                {aiData.llmResponse.model} ({aiData.llmResponse.provider})
              </span>
            )}
          </div>

          {/* Main AI Output */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
              {(() => {
                const output =
                  aiData.llmResponse?.output ||
                  aiData.analysis ||
                  aiData.output;
                if (!output) return "No AI response available";

                // If the output is an object, stringify it for display
                if (typeof output === "object") {
                  return JSON.stringify(output, null, 2);
                }

                // Otherwise return as string
                return output;
              })()}
            </div>
          </div>

          {/* Usage Statistics */}
          {aiData.llmResponse?.usage && (
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <span>📝</span>
                <span>
                  Prompt: {aiData.llmResponse.usage.prompt_tokens || 0} tokens
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>
                  Response: {aiData.llmResponse.usage.completion_tokens || 0}{" "}
                  tokens
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📊</span>
                <span>
                  Total: {aiData.llmResponse.usage.total_tokens || 0} tokens
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === EMAIL PROCESSING SECTION === */}
      {hasEmailData && (
        <div className="space-y-4">
          {/* Email Classification */}
          {aiData.emailClassification && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏷️</span>
                <h4 className="font-semibold text-gray-100">
                  Email Classification
                </h4>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    aiData.emailClassification.category === "general"
                      ? "bg-green-900 text-green-200"
                      : aiData.emailClassification.category === "support"
                        ? "bg-yellow-900 text-yellow-200"
                        : "bg-purple-900 text-purple-200"
                  }`}
                >
                  {aiData.emailClassification.category}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(
                    (aiData.emailClassification.confidence || 0) * 100,
                  )}
                  % confidence
                </span>
              </div>
              <div className="bg-gray-800 rounded p-3 border border-gray-600">
                <div className="text-sm text-gray-200">
                  {aiData.emailClassification.reason ||
                    "No classification reason provided"}
                </div>
              </div>
            </div>
          )}

          {/* Generated Email Response */}
          {aiData.emailResponse && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">✉️</span>
                <h4 className="font-semibold text-gray-100">
                  Generated Response
                </h4>
                {aiData.emailResponse.metadata?.quality && (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      aiData.emailResponse.metadata.quality === "high"
                        ? "bg-green-900 text-green-200"
                        : aiData.emailResponse.metadata.quality === "medium"
                          ? "bg-yellow-900 text-yellow-200"
                          : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {aiData.emailResponse.metadata.quality} quality
                  </span>
                )}
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {aiData.emailResponse.responseText || "No response generated"}
                </div>
              </div>

              {/* Response Quality Indicators */}
              {aiData.emailResponse.metadata && (
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span>
                      {aiData.emailResponse.metadata.hasGreeting ? "✅" : "❌"}
                    </span>
                    <span>Greeting</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>
                      {aiData.emailResponse.metadata.hasClosing ? "✅" : "❌"}
                    </span>
                    <span>Closing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>
                      {aiData.emailResponse.metadata.hasActionItems
                        ? "✅"
                        : "❌"}
                    </span>
                    <span>Action Items</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📏</span>
                    <span>
                      {aiData.emailResponse.metadata.responseLength} chars
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Original Email Data */}
          {aiData.originalEmail && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📧</span>
                <h4 className="font-semibold text-gray-100">Original Email</h4>
              </div>
              <div className="bg-gray-800 rounded border border-gray-600 overflow-hidden">
                <div className="p-3 border-b border-gray-600 bg-gray-750">
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="text-gray-400 w-16">From:</span>
                      <span className="text-gray-200">
                        {aiData.originalEmail.from}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-16">Subject:</span>
                      <span className="text-gray-200">
                        {aiData.originalEmail.subject}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-gray-200 text-sm max-h-32 overflow-y-auto">
                    {aiData.originalEmail.body
                      ? aiData.originalEmail.body.length > 300
                        ? aiData.originalEmail.body.substring(0, 300) + "..."
                        : aiData.originalEmail.body
                      : "No email body available"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === EXECUTION METADATA === */}
      <div className="border-t border-gray-600 pt-4 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>🕐</span>
          <span>
            Executed at:{" "}
            {aiData.timestamp
              ? new Date(aiData.timestamp).toLocaleString()
              : "Unknown"}
          </span>
        </div>

        {/* Processing Summary */}
        {aiData.nextNodeData && (
          <div className="text-xs text-gray-400">
            <span>📤 Ready for next node:</span>
            <ul className="ml-4 mt-1 space-y-1">
              {aiData.nextNodeData.original && <li>• Original email data</li>}
              {aiData.nextNodeData.classification && (
                <li>• Email classification</li>
              )}
              {aiData.nextNodeData.response && <li>• Generated response</li>}
              {aiData.nextNodeData.analysis && <li>• AI analysis</li>}
            </ul>
          </div>
        )}
      </div>

      {/* === ADVANCED DETAILS (COLLAPSIBLE) === */}
      {(aiData.llmResponse?.metadata || aiData.processedPrompt) && (
        <details className="text-xs">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300 py-2">
            🔧 Advanced Details
          </summary>
          <div className="mt-2 space-y-3">
            {/* Processed Prompt */}
            {aiData.processedPrompt && (
              <div>
                <div className="text-gray-400 mb-1">Processed Prompt:</div>
                <div className="bg-gray-900 p-2 rounded border border-gray-600 font-mono text-gray-300 max-h-32 overflow-y-auto">
                  {aiData.processedPrompt}
                </div>
              </div>
            )}

            {/* LLM Metadata */}
            {aiData.llmResponse?.metadata && (
              <div>
                <div className="text-gray-400 mb-1">LLM Metadata:</div>
                <div className="bg-gray-900 p-2 rounded border border-gray-600 font-mono text-gray-300 max-h-32 overflow-y-auto">
                  {JSON.stringify(aiData.llmResponse.metadata, null, 2)}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default AIAgentOutputPanel;
