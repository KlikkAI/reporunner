/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLeanWorkflowStore, nodeRegistry } from "@/core";
import { useCredentialStore } from "@/core/stores/credentialStore";
import { SaveOutlined } from "@ant-design/icons";
import { message } from "antd";
import DynamicPropertyRenderer from "./DynamicPropertyRenderer";
import { PropertyGroupRenderer } from "@/app/node-extensions/components/ConditionalPropertyRenderer";
import type {
  PropertyFormState,
  PropertyValue,
  PropertyEvaluationContext,
} from "@/core/types/dynamicProperties";
import EmailInputPanel from "./EmailInputPanel";
import EmailOutputPanel from "./EmailOutputPanel";
import DataVisualizationPanel from "@/design-system/components/DataVisualization/DataVisualizationPanel";
import CredentialModal from "./CredentialModal";
import { CredentialApiService } from "@/core";

const credentialApiService = new CredentialApiService();
import { gmailEnhancedProperties } from "@/app/data/nodes/communication/gmail/enhanced-properties";
import { nodeMigrationService } from "@/core/utils/nodeVersioning";

interface NodeConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId?: string;
}

const NodeConfigurationPanel: React.FC<NodeConfigurationPanelProps> = ({
  isOpen,
  onClose,
  nodeId,
}) => {
  const {
    getNodeById,
    updateNodeParameters,
    saveWorkflow,
    currentWorkflow,
    nodes,
    edges,
  } = useLeanWorkflowStore();
  const { credentials, loadCredentials, credentialTypes } =
    useCredentialStore();

  const [leftWidth, setLeftWidth] = useState(700);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<PropertyFormState>({});
  const [isTestingNode, setIsTestingNode] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [currentCredentialType, setCurrentCredentialType] = useState("");

  const middleWidth = 550;

  const currentNode = useMemo(() => {
    if (!nodeId) return null;
    return getNodeById(nodeId);
  }, [nodeId, getNodeById]);

  const nodeDefinition = useMemo(() => {
    if (!currentNode) return null;
    return nodeRegistry.getNodeTypeDescription(currentNode.type);
  }, [currentNode]);

  // Get enhanced node type from node data (Gmail-specific)
  const enhancedNodeType = useMemo(() => {
    if (!currentNode) return null;

    // For registry-based system, derive node type from node.type
    if (
      currentNode.type === "gmail-enhanced" ||
      currentNode.type?.includes("gmail")
    ) {
      return { id: "gmail-enhanced" };
    }
    if (currentNode.type === "ai-agent") {
      return { id: "ai-agent" };
    }

    return null;
  }, [currentNode]);

  // Get connected input nodes for display
  const connectedInputNodes = useMemo(() => {
    if (!currentNode || !Array.isArray(nodes) || !Array.isArray(edges))
      return [];
    return edges
      .filter((edge) => edge.target === currentNode.id)
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter(Boolean);
  }, [currentNode, edges, nodes]);

  // Extract input data from connected nodes
  const inputData = useMemo(() => {
    const data: any = {};
    connectedInputNodes.forEach((node: any, index) => {
      if (node?.parameters?.outputData) {
        data[`input_${index}`] = node.parameters.outputData;
      }
    });
    return data;
  }, [connectedInputNodes]);

  useEffect(() => {
    if (currentNode) {
      setFormState(currentNode.parameters || {});
    }
  }, [currentNode]);

  // Auto-select first email when Gmail test results come in
  useEffect(() => {
    if (
      testResults?.success &&
      (enhancedNodeType?.id === "gmail-enhanced" ||
        currentNode?.type?.includes("gmail")) &&
      testResults?.data &&
      Array.isArray(testResults.data) &&
      testResults.data.length > 0
    ) {
      console.log(
        "Auto-selecting first email from Gmail test results:",
        testResults.data[0],
      );
      setSelectedEmail(testResults.data[0]);
    }
  }, [testResults, enhancedNodeType?.id, currentNode?.type]);

  // Load credentials on mount
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Debug modal state changes
  useEffect(() => {
    console.log("🔧 Modal state changed:", {
      isCredentialModalOpen,
      currentCredentialType,
    });
  }, [isCredentialModalOpen, currentCredentialType]);

  const handleParameterChange = useCallback(
    (parameterName: string, value: PropertyValue) => {
      const newFormState = { ...formState, [parameterName]: value };
      setFormState(newFormState);
      if (currentNode) {
        updateNodeParameters(currentNode.id, newFormState);
      }
    },
    [formState, currentNode, updateNodeParameters],
  );

  // Gmail-specific test functionality
  const handleTestNode = useCallback(async () => {
    if (!currentNode || !nodeDefinition) return;

    setIsTestingNode(true);
    setTestResults(null);

    try {
      // Check if this is a Gmail enhanced node
      if (
        currentNode.type?.includes("gmail") ||
        enhancedNodeType?.id === "gmail-enhanced"
      ) {
        // Use the registry test method for Gmail trigger
        const result = await nodeRegistry.testNodeType(
          currentNode.type,
          formState,
          currentNode.credentials || {},
        );

        setTestResults({
          success: result.success,
          message: result.message || "Gmail test completed",
          data: result.data,
        });
      } else {
        // Generic node testing
        const result = await nodeRegistry.testNodeType(
          currentNode.type,
          formState,
          currentNode.credentials || {},
        );

        setTestResults({
          success: result.success,
          message: result.message || "Test completed",
          data: result.data,
        });
      }
    } catch (error: any) {
      console.error("Node test failed:", error);
      setTestResults({
        success: false,
        message: error.message || "Test failed",
      });
    } finally {
      setIsTestingNode(false);
    }
  }, [currentNode, nodeDefinition, formState, enhancedNodeType]);

  // Credential management handlers
  const handleCreateCredential = useCallback(
    (type: string) => {
      console.log("🔧 handleCreateCredential called with type:", type);
      console.log("🔧 Current modal state before:", isCredentialModalOpen);
      setCurrentCredentialType(type);
      console.log("🔧 Setting modal state to true...");
      setIsCredentialModalOpen(true);
    },
    [isCredentialModalOpen],
  );

  const handleCredentialSelect = useCallback(
    (credential: any) => {
      // Handle credential selection
      const credentialId = credential.id;
      handleParameterChange("credential", credentialId);
    },
    [handleParameterChange],
  );

  const handleCredentialChange = useCallback(
    (credentialId: string) => {
      handleParameterChange("credential", credentialId);
    },
    [handleParameterChange],
  );

  const handleSaveCredential = useCallback(
    async (credentialData: any) => {
      try {
        await credentialApiService.createCredential(credentialData);
        await loadCredentials();
        setIsCredentialModalOpen(false);
        message.success("Credential saved successfully");
      } catch (error: any) {
        message.error(`Failed to save credential: ${error.message}`);
      }
    },
    [loadCredentials],
  );

  // Create evaluation context for dynamic properties
  const evaluationContext: PropertyEvaluationContext = useMemo(
    () => ({
      formState,
      nodeData: currentNode ? { ...currentNode } : undefined,
      credentials: credentials as Array<Record<string, unknown>>,
      credentialTypes: credentialTypes as unknown as Array<
        Record<string, unknown>
      >,
      onCreateCredential: handleCreateCredential,
      onCredentialSelect: handleCredentialSelect,
      onCredentialChange: handleCredentialChange,
    }),
    [
      formState,
      currentNode,
      credentials,
      credentialTypes,
      handleCreateCredential,
      handleCredentialSelect,
      handleCredentialChange,
    ],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const containerWidth = window.innerWidth;
      const minLeftWidth = 200;
      const maxLeftWidth = containerWidth - middleWidth - 200;
      setLeftWidth((prevWidth) =>
        Math.max(minLeftWidth, Math.min(maxLeftWidth, prevWidth + e.movementX)),
      );
    },
    [isDragging, middleWidth],
  );

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSaveWorkflow = useCallback(async () => {
    if (!currentWorkflow) {
      message.error("No workflow to save");
      return;
    }
    setIsSaving(true);
    try {
      await saveWorkflow();
      message.success("Workflow saved successfully");
    } catch (error: any) {
      message.error(
        `Failed to save workflow: ${error.message || "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkflow, saveWorkflow]);

  // Enhanced property resolution with Transform node support
  const registryProperties = useMemo(() => {
    // For enhanced nodes like Gmail, get properties from enhanced node type
    if (enhancedNodeType?.id === "gmail-enhanced") {
      // Use directly imported Gmail enhanced properties for comprehensive form
      return gmailEnhancedProperties;
    }

    // For Transform nodes, check if migration is needed and use enhanced version
    if (currentNode?.type === "transform") {
      try {
        const currentVersion =
          currentNode.typeVersion || currentNode.version || 1;
        const latestVersion =
          nodeMigrationService.getLatestVersion("transform");

        if (currentVersion < latestVersion) {
          console.log(
            `Transform node needs migration from v${currentVersion} to v${latestVersion}`,
          );
          // Migrate the node instance
          const migratedNode = nodeMigrationService.migrateNodeInstance(
            currentNode,
            latestVersion,
          );

          // Update the node with migrated parameters
          if (migratedNode.parameters !== currentNode.parameters) {
            updateNodeParameters(currentNode.id, migratedNode.parameters);
          }
        }

        // Get the enhanced transform node properties
        const enhancedTransformNode =
          nodeRegistry.getEnhancedNodeType?.("transform");
        if (enhancedTransformNode?.configuration?.properties) {
          console.log("Using enhanced Transform node properties");
          return enhancedTransformNode.configuration.properties;
        }
      } catch (error) {
        console.warn(
          "Failed to get enhanced Transform node properties:",
          error,
        );
      }
    }

    if (!nodeDefinition?.properties) return [];
    return nodeDefinition.properties;
  }, [nodeDefinition, enhancedNodeType, currentNode, updateNodeParameters]);

  if (!isOpen || !currentNode || !nodeDefinition) {
    return null;
  }

  const rightWidth = `calc(100vw - ${leftWidth}px - ${middleWidth}px)`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      <div className="w-full p-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to canvas</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>/</span>
            <span>{nodeDefinition.displayName}</span>
            <span className="text-xs px-2 py-1 bg-gray-700 rounded">
              {currentNode.type}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving || !currentWorkflow}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
            title="Save workflow without closing modal"
          >
            <SaveOutlined className={isSaving ? "animate-spin" : ""} />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Input Data */}
        <div
          className="bg-gray-900 border-r border-gray-600 flex flex-col"
          style={{ width: `${leftWidth}px`, height: "calc(100vh - 80px)" }}
        >
          <div className="p-4 border-b border-gray-600 bg-gray-800 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-100 mb-3 flex items-center">
              <span className="mr-2">📥</span>
              INPUT
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Conditional rendering based on node type */}
            {(enhancedNodeType?.id === "gmail-enhanced" ||
              currentNode?.type?.includes("gmail")) &&
            testResults?.data &&
            Array.isArray(testResults.data) &&
            testResults.data.length > 0 ? (
              <EmailInputPanel
                emails={testResults.data}
                selectedEmailId={selectedEmail?.id}
                onEmailSelect={setSelectedEmail}
              />
            ) : enhancedNodeType?.id === "ai-agent" ||
              currentNode?.type === "ai-agent" ? (
              <div className="text-gray-400 text-sm">
                AI Agent input data would appear here
              </div>
            ) : currentNode?.type === "condition" ? (
              <div className="text-gray-400 text-sm">
                Condition input data would appear here
              </div>
            ) : (
              <DataVisualizationPanel
                data={inputData}
                title="Input Data"
                description="Data from connected nodes"
              />
            )}
          </div>
        </div>

        {/* Middle Column: Parameters & Settings */}
        <div
          className="bg-gray-800 flex flex-col border-l border-r border-gray-600"
          style={{ width: `${middleWidth}px`, height: "calc(100vh - 80px)" }}
        >
          <div className="p-4 border-b border-gray-600 bg-gray-700 flex items-center justify-between flex-shrink-0">
            <div
              className="cursor-col-resize p-2 hover:bg-gray-600 rounded mr-2 flex items-center"
              onMouseDown={handleMouseDown}
              title="Drag to resize column width"
            >
              <div className="text-gray-300 text-xs font-mono">⋮⋮</div>
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-white">
                {nodeDefinition.displayName}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestNode}
                disabled={isTestingNode}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isTestingNode
                    ? "bg-yellow-600 text-white cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isTestingNode ? "⏳ Testing..." : "🧪 Test step"}
              </button>

              {/* Debug: Test credential modal button */}
              <button
                onClick={() => {
                  console.log("🔧 Test Modal button clicked directly");
                  handleCreateCredential("gmailOAuth2");
                }}
                className="px-2 py-1 rounded text-xs bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                🔧 Test Modal
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Use enhanced property rendering for Transform nodes and other enhanced types */}
            {currentNode?.type === "transform" || enhancedNodeType?.id ? (
              <PropertyGroupRenderer
                properties={registryProperties}
                values={formState}
                onChange={handleParameterChange}
                evaluationContext={{
                  $json: inputData,
                  $node: {},
                  $vars: {},
                  $parameters: formState,
                }}
                context={evaluationContext}
              />
            ) : (
              <DynamicPropertyRenderer
                properties={registryProperties}
                formState={formState}
                onChange={handleParameterChange}
                context={evaluationContext}
              />
            )}

            {/* Display test results */}
            {testResults && (
              <div className="mt-6 p-4 rounded border-l-4 border-l-blue-500 bg-gray-700">
                <h4 className="text-white font-medium mb-2">Test Results</h4>
                <div
                  className={`text-sm ${testResults.success ? "text-green-400" : "text-red-400"}`}
                >
                  {testResults.message}
                </div>
                {testResults.data && (
                  <div className="mt-2 text-xs text-gray-300">
                    {Array.isArray(testResults.data)
                      ? `Found ${testResults.data.length} items`
                      : "Data received"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output Data */}
        <div
          className="bg-gray-900 border-l border-gray-600 flex flex-col"
          style={{ width: rightWidth, height: "calc(100vh - 80px)" }}
        >
          <div className="p-4 border-b border-gray-600 bg-gray-800 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-100 mb-3 flex items-center">
              <span className="mr-2">📤</span>
              OUTPUT
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Conditional rendering based on node type */}
            {enhancedNodeType?.id === "gmail-enhanced" ||
            currentNode?.type?.includes("gmail") ? (
              <EmailOutputPanel selectedEmail={selectedEmail} />
            ) : enhancedNodeType?.id === "ai-agent" ||
              currentNode?.type === "ai-agent" ? (
              <div className="text-gray-400 text-sm">
                AI Agent output data would appear here
              </div>
            ) : currentNode?.type === "transform" ? (
              <DataVisualizationPanel
                data={testResults?.data}
                title="Transform Output"
                description="Transformed data output"
              />
            ) : (
              <DataVisualizationPanel
                data={testResults?.data}
                title="Output Data"
                description="Output from node execution"
              />
            )}
          </div>
        </div>
      </div>

      {/* Credential Modal */}
      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => {
          console.log("🔧 Credential modal closing");
          setIsCredentialModalOpen(false);
        }}
        credentialType={currentCredentialType}
        onSave={handleSaveCredential}
      />

      {/* Debug info - commented out for production */}
      {/* {console.log('🔧 Modal state debug:', {
        isCredentialModalOpen,
        currentCredentialType,
        credentials: credentials?.length
      })} */}
    </div>
  );
};

export default NodeConfigurationPanel;
