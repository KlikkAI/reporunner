/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { JsonViewer } from "@/design-system";

interface ConditionInputPanelProps {
  connectedInputNodes: any[];
  selectedNode?: any;
  testResults?: any;
}

const ConditionInputPanel: React.FC<ConditionInputPanelProps> = ({
  connectedInputNodes,
}) => {
  // Default to expanding the first node that has data
  const [expandedNode, setExpandedNode] = useState<string | null>(() => {
    const firstNodeWithData = connectedInputNodes.find(
      (node) => node?.data?.outputData || node?.data?.testResults?.data,
    );
    return firstNodeWithData?.id || null;
  });
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log("ConditionInputPanel Debug:", {
      connectedInputNodes: connectedInputNodes.length,
      nodeDetails: connectedInputNodes.map((node) => ({
        id: node?.id,
        label: node?.data?.label,
        type: node?.type,
        hasOutputData: !!node?.data?.outputData,
        hasTestResults: !!node?.data?.testResults?.data,
        outputDataKeys: node?.data?.outputData
          ? Object.keys(node.data.outputData)
          : "none",
        testResultsKeys: node?.data?.testResults?.data
          ? Object.keys(node.data.testResults.data)
          : "none",
      })),
    });
  }, [connectedInputNodes]);

  if (connectedInputNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center space-y-3">
          <div className="text-3xl">⚖️</div>
          <div className="text-sm font-medium">No Input Connections</div>
          <div className="text-xs text-gray-500 max-w-48">
            Connect nodes to provide data for condition evaluation
          </div>
          <div className="mt-4 text-xs text-blue-400">
            💡 Conditions evaluate input data to make decisions
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* === CONDITION OVERVIEW === */}
      <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">⚖️</span>
          <div className="text-sm font-medium text-purple-200">
            Condition Evaluation
          </div>
          <span className="px-2 py-1 bg-purple-800 text-purple-100 rounded text-xs">
            {connectedInputNodes.length} input
            {connectedInputNodes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="text-xs text-purple-300">
          This data will be evaluated by the condition logic. Use field
          references in your condition expressions.
        </div>
      </div>

      {/* === DATA ANALYSIS SUMMARY === */}
      {connectedInputNodes.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-3">
          <div className="text-sm font-medium text-gray-200 mb-3 flex items-center space-x-2">
            <span>📊</span>
            <span>Available Data Fields</span>
          </div>
          <DataFieldsSummary
            connectedInputNodes={connectedInputNodes}
            onFieldSelect={setSelectedField}
          />
        </div>
      )}

      {/* === CONNECTED INPUT NODES === */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-100 flex items-center space-x-2">
          <span>📥</span>
          <span>Input Data Sources</span>
        </div>

        {connectedInputNodes.map((node, index) => {
          // More robust data detection
          const outputData = node?.data?.outputData;
          const testResultsData = node?.data?.testResults?.data;
          const hasOutputData = outputData || testResultsData;

          // Prefer outputData over testResults, but use either if available
          let nodeData = null;
          if (outputData) {
            nodeData = outputData;
          } else if (testResultsData) {
            nodeData = testResultsData;
          }

          const isExpanded = expandedNode === node?.id;

          // Debug logging for each node
          console.log(`Node ${node?.id || index} data check:`, {
            hasOutputData: !!outputData,
            hasTestResults: !!testResultsData,
            finalNodeData: !!nodeData,
            nodeDataType: typeof nodeData,
            nodeDataKeys:
              nodeData && typeof nodeData === "object"
                ? Object.keys(nodeData)
                : "not object",
          });

          return (
            <div
              key={node?.id || index}
              className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden"
            >
              {/* === NODE HEADER === */}
              <div
                className="p-3 border-b border-gray-600 bg-gray-750 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedNode(isExpanded ? null : node?.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className="text-xl"
                      title={node?.data?.label || "Node Icon"}
                    >
                      {getNodeIcon(node)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {node?.data?.label || "Unnamed Node"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getNodeTypeDisplay(node)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasOutputData ? (
                      <span className="px-2 py-1 bg-green-800 text-green-200 rounded text-xs flex items-center space-x-1">
                        <span>✓</span>
                        <span>Data Available</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-800 text-yellow-200 rounded text-xs flex items-center space-x-1">
                        <span>⏳</span>
                        <span>No Data</span>
                      </span>
                    )}
                    <span
                      className={`transform transition-transform text-gray-400 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* === EXPANDABLE DATA CONTENT === */}
              {isExpanded && (
                <div className="p-3">
                  {hasOutputData ? (
                    <div className="space-y-3">
                      {/* Enhanced JSON viewer for raw data */}
                      <JsonViewer
                        data={nodeData}
                        maxHeight="400px"
                        enableClipboard={true}
                      />

                      {/* Then show the formatted renderer */}
                      <ConditionDataRenderer
                        data={nodeData}
                        nodeType={getNodeType(node)}
                        selectedField={selectedField}
                        onFieldSelect={setSelectedField}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <div className="text-sm">No output data available</div>
                      <div className="text-xs mt-1">
                        Test the connected node to generate data
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === CONDITION EVALUATION TIPS === */}
      <div className="mt-6 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">💡</span>
          <div className="text-sm font-medium text-gray-200">
            Condition Tips
          </div>
        </div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>
              Reference data fields directly in conditions (e.g.,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">
                subject
              </code>
              ,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">
                priority
              </code>
              )
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>
              Use comparison operators:{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">==</code>
              ,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">!=</code>
              ,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">
                &gt;
              </code>
              ,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">
                &lt;
              </code>
              ,{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">
                contains
              </code>
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>
              Combine conditions with{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">&&</code>{" "}
              (and) or{" "}
              <code className="bg-gray-700 px-1 rounded text-gray-300">||</code>{" "}
              (or)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to show summary of all available data fields
const DataFieldsSummary: React.FC<{
  connectedInputNodes: any[];
  onFieldSelect: (field: string) => void;
}> = ({ connectedInputNodes, onFieldSelect }) => {
  const allFields = new Set<string>();

  // Collect all unique fields from connected nodes
  connectedInputNodes.forEach((node, index) => {
    const outputData = node?.data?.outputData;
    const testResultsData = node?.data?.testResults?.data;
    const data = outputData || testResultsData;

    console.log(`DataFieldsSummary - Node ${index} data:`, {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === "object" ? Object.keys(data) : "none",
    });

    if (data && typeof data === "object") {
      if (Array.isArray(data)) {
        // Handle arrays (like emails)
        if (data.length > 0 && typeof data[0] === "object") {
          Object.keys(data[0]).forEach((key) => allFields.add(key));
        }
      } else {
        // Handle objects
        Object.keys(data).forEach((key) => allFields.add(key));
      }
    }
  });

  const fieldsArray = Array.from(allFields).sort();

  if (fieldsArray.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        No structured fields available. Test connected nodes to analyze data
        fields.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fieldsArray.map((field) => (
        <button
          key={field}
          onClick={() => onFieldSelect(field)}
          className="px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-200 rounded text-xs transition-colors"
          title={`Click to highlight ${field} in data`}
        >
          {field}
        </button>
      ))}
    </div>
  );
};

// Component to render data specifically for condition evaluation
const ConditionDataRenderer: React.FC<{
  data: any;
  nodeType: string;
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
}> = ({ data, nodeType, selectedField, onFieldSelect }) => {
  // Debug logging
  console.log("ConditionDataRenderer:", {
    hasData: !!data,
    dataType: typeof data,
    isArray: Array.isArray(data),
    nodeType,
    dataPreview: data
      ? typeof data === "object"
        ? Object.keys(data)
        : data
      : "none",
  });

  if (!data) {
    return <div className="text-gray-400 text-sm">No data available</div>;
  }

  // Handle different data structures

  // Check if it's an array (like emails)
  if (Array.isArray(data)) {
    console.log(
      "ConditionDataRenderer: Array detected with",
      data.length,
      "items",
    );
    if (data.length > 0) {
      const firstItem = data[0];
      if (nodeType === "gmail" || nodeType === "gmail-trigger") {
        return (
          <EmailConditionView
            email={firstItem}
            selectedField={selectedField}
            onFieldSelect={onFieldSelect}
          />
        );
      } else {
        // Generic array handling - show first item
        return (
          <GenericConditionView
            data={firstItem}
            selectedField={selectedField}
            onFieldSelect={onFieldSelect}
          />
        );
      }
    }
  }

  // Handle email data (from Gmail triggers)
  if (
    (nodeType === "gmail" || nodeType === "gmail-trigger") &&
    typeof data === "object"
  ) {
    console.log("ConditionDataRenderer: Gmail data detected");
    return (
      <EmailConditionView
        email={data}
        selectedField={selectedField}
        onFieldSelect={onFieldSelect}
      />
    );
  }

  // Handle transformed data
  if (nodeType === "transform" && typeof data === "object") {
    console.log("ConditionDataRenderer: Transform data detected");
    return (
      <TransformConditionView
        data={data}
        selectedField={selectedField}
        onFieldSelect={onFieldSelect}
      />
    );
  }

  // Handle AI Agent data
  if (nodeType === "ai-agent" && typeof data === "object") {
    console.log("ConditionDataRenderer: AI Agent data detected");
    return (
      <AIConditionView
        data={data}
        selectedField={selectedField}
        onFieldSelect={onFieldSelect}
      />
    );
  }

  // Generic structured data
  if (typeof data === "object" && data !== null) {
    console.log(
      "ConditionDataRenderer: Generic object data detected with keys:",
      Object.keys(data),
    );
    return (
      <GenericConditionView
        data={data}
        selectedField={selectedField}
        onFieldSelect={onFieldSelect}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-yellow-400">
        Debug: {nodeType} node data (fallback renderer)
      </div>
      <div className="bg-gray-900 p-3 rounded border border-gray-600">
        <div className="text-xs text-gray-400 mb-2">
          Type: {typeof data}{" "}
          {Array.isArray(data) && `(array with ${data.length} items)`}
        </div>
        <div className="font-mono text-xs text-gray-200 max-h-40 overflow-y-auto">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </div>
      </div>
    </div>
  );
};

// Email-specific condition view
const EmailConditionView: React.FC<{
  email: any;
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
}> = ({ email, selectedField, onFieldSelect }) => {
  const emailFields = [
    { key: "from", label: "From", value: email.from },
    { key: "subject", label: "Subject", value: email.subject },
    { key: "body", label: "Body", value: email.body },
    { key: "isUnread", label: "Unread", value: email.isUnread },
    {
      key: "hasAttachments",
      label: "Has Attachments",
      value: email.hasAttachments,
    },
    { key: "labels", label: "Labels", value: email.labels },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs text-blue-400 mb-2">
        📧 Email fields available for conditions:
      </div>
      {emailFields.map((field) => (
        <FieldRow
          key={field.key}
          fieldKey={field.key}
          label={field.label}
          value={field.value}
          isSelected={selectedField === field.key}
          onSelect={onFieldSelect}
        />
      ))}
    </div>
  );
};

// Transform data condition view
const TransformConditionView: React.FC<{
  data: any;
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
}> = ({ data, selectedField, onFieldSelect }) => {
  const fields = Object.keys(data);

  return (
    <div className="space-y-3">
      <div className="text-xs text-green-400 mb-2">
        🔄 Transformed fields available for conditions:
      </div>
      {fields.map((key) => (
        <FieldRow
          key={key}
          fieldKey={key}
          label={key}
          value={data[key]}
          isSelected={selectedField === key}
          onSelect={onFieldSelect}
        />
      ))}
    </div>
  );
};

// AI Agent data condition view
const AIConditionView: React.FC<{
  data: any;
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
}> = ({ data, selectedField, onFieldSelect }) => {
  const aiFields = [
    { key: "output", label: "AI Output", value: data.output },
    { key: "provider", label: "Provider", value: data.provider },
    { key: "model", label: "Model", value: data.model },
    { key: "usage", label: "Token Usage", value: data.usage },
  ];

  return (
    <div className="space-y-3">
      <div className="text-xs text-orange-400 mb-2">
        🤖 AI response fields available for conditions:
      </div>
      {aiFields.map((field) => (
        <FieldRow
          key={field.key}
          fieldKey={field.key}
          label={field.label}
          value={field.value}
          isSelected={selectedField === field.key}
          onSelect={onFieldSelect}
        />
      ))}
    </div>
  );
};

// Generic data condition view
const GenericConditionView: React.FC<{
  data: any;
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
}> = ({ data, selectedField, onFieldSelect }) => {
  const fields = Object.keys(data);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 mb-2">
        📊 Data fields available for conditions:
      </div>
      {fields.map((key) => (
        <FieldRow
          key={key}
          fieldKey={key}
          label={key}
          value={data[key]}
          isSelected={selectedField === key}
          onSelect={onFieldSelect}
        />
      ))}
    </div>
  );
};

// Reusable field row component
const FieldRow: React.FC<{
  fieldKey: string;
  label: string;
  value: any;
  isSelected: boolean;
  onSelect: (field: string) => void;
}> = ({ fieldKey, label, value, isSelected, onSelect }) => {
  const displayValue =
    typeof value === "string" && value.length > 100
      ? value.substring(0, 100) + "..."
      : value;

  return (
    <div
      className={`p-3 rounded border cursor-pointer transition-all ${
        isSelected
          ? "border-purple-500 bg-purple-900/20"
          : "border-gray-600 hover:border-gray-500 bg-gray-750"
      }`}
      onClick={() => onSelect(fieldKey)}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium ${isSelected ? "text-purple-200" : "text-gray-200"}`}
        >
          {label}
        </span>
        <code
          className={`text-xs px-2 py-1 rounded ${
            isSelected
              ? "bg-purple-800 text-purple-200"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {fieldKey}
        </code>
      </div>
      <div
        className={`text-xs ${isSelected ? "text-purple-300" : "text-gray-400"}`}
      >
        Type: {typeof value} {Array.isArray(value) && "(array)"}
      </div>
      <div
        className={`text-sm mt-2 ${isSelected ? "text-purple-100" : "text-gray-300"}`}
      >
        {typeof displayValue === "object"
          ? JSON.stringify(displayValue, null, 2)
          : String(displayValue || "null")}
      </div>
    </div>
  );
};

// Helper functions (same as in other panels)
const getNodeIcon = (node: any): string => {
  if (
    node?.data?.integrationData?.id === "gmail" ||
    node?.data?.enhancedNodeType?.id === "gmail-trigger"
  ) {
    return "📧";
  }
  if (node?.type === "transform") {
    return "🔄";
  }
  if (
    node?.type === "ai-agent" ||
    node?.data?.integrationData?.id === "ai-agent"
  ) {
    return "🤖";
  }
  if (node?.type === "trigger") {
    return "⚡";
  }
  return "📊";
};

const getNodeType = (node: any): string => {
  if (
    node?.data?.integrationData?.id === "gmail" ||
    node?.data?.enhancedNodeType?.id === "gmail-trigger"
  ) {
    return "gmail-trigger";
  }
  if (node?.type === "transform") {
    return "transform";
  }
  if (
    node?.type === "ai-agent" ||
    node?.data?.integrationData?.id === "ai-agent"
  ) {
    return "ai-agent";
  }
  return node?.type || "unknown";
};

const getNodeTypeDisplay = (node: any): string => {
  return (
    node?.data?.enhancedNodeType?.displayName ||
    node?.data?.nodeTypeData?.displayName ||
    node?.data?.nodeTypeData?.name ||
    node?.type ||
    "Unknown Node Type"
  );
};

export default ConditionInputPanel;
