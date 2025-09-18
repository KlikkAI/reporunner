/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useLeanWorkflowStore, nodeRegistry } from "@/core";
import { useCredentialStore } from "@/core/stores/credentialStore";
import { useAIAssistantStore } from "@/core/stores/aiAssistantStore";
import { useCollaborationStore } from "@/core/stores/collaborationStore";
import { useAnalyticsStore } from "@/core/stores/analyticsStore";
import { ExecutionToolbar } from "./ExecutionToolbar";
import {
  executionMonitor,
  useExecutionMonitor,
} from "@/app/services/executionMonitor";
import { intelligentAutoConnect } from "@/app/services/intelligentAutoConnect";
import AdvancedNodePanel from "./AdvancedNodePanel";
import RegistryNode from "./NodeTypes/RegistryNode";
import ContainerNode from "./NodeTypes/ContainerNode/ContainerNode";
import AdvancedPropertyPanel from "./AdvancedPropertyPanel";
import CustomEdge from "./CustomEdge";
import ExecutionPanel from "./ExecutionPanel";
import AIAssistantPanel from "./AIAssistantPanel";
import DebugPanel from "./DebugPanel";
import { CollaborationPanel } from "./CollaborationPanel";
import { UserPresenceOverlay } from "./UserPresenceOverlay";
import { CommentAnnotations } from "./CommentAnnotations";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SchedulingPanel } from "./SchedulingPanel";
import { TriggerPanel } from "./TriggerPanel";
import {
  ConditionalBranchingPanel,
  type BranchConfiguration,
} from "./ConditionalBranchingPanel";
import { WorkflowTemplatesPanel } from "./WorkflowTemplatesPanel";
import { ConnectionType } from "@/core/types/edge";
import ConnectionLine from "./ConnectionLine";
import { EnterpriseDashboard } from "../EnterpriseDashboard/EnterpriseDashboard";
import { AuditDashboard } from "../AuditDashboard/AuditDashboard";
import { OrganizationSettingsComponent } from "../OrganizationManagement/OrganizationSettings";
import { useRBACStore } from "@/core/stores/rbacStore";
import {
  AILanguageModelEdge,
  AIEmbeddingEdge,
  AIVectorStoreEdge,
  AIToolEdge,
  AIEdgeMarkers,
  AIEdgeStyles,
} from "./AIEdges";
// Generate dynamic node types from registry + container nodes
// 🎯 100% Registry Migration - No Legacy Fallback Needed
const generateNodeTypes = () => {
  const nodeTypes: Record<string, any> = {};

  // Add container node type
  nodeTypes["container"] = ContainerNode;

  // Get ALL node descriptions (regular + enhanced) and map them to RegistryNode
  const allNodeDescriptions = nodeRegistry.getAllNodeTypeDescriptions();
  allNodeDescriptions.forEach((nodeDesc) => {
    nodeTypes[nodeDesc.name] = RegistryNode;
  });

  // Only log in development mode and only if there are issues
  if (import.meta.env.DEV) {
    const hasGmailNode = "gmail-enhanced" in nodeTypes;

    if (!hasGmailNode) {
      console.warn("⚠️ Gmail enhanced node missing from React Flow mapping!");
      console.warn("🔍 Available nodes:", Object.keys(nodeTypes));
      console.warn(
        `📊 Generated ${Object.keys(nodeTypes).length} node types from registry`,
      );
    } else {
      // Only log success once per session to avoid spam
      if (!(window as any).__gmailNodeValidationLogged) {
        console.log(
          `✅ Generated ${Object.keys(nodeTypes).length} node types including Gmail and containers`,
        );
        (window as any).__gmailNodeValidationLogged = true;
      }
    }
  }

  return nodeTypes;
};

const edgeTypes = {
  default: CustomEdge,
  // AI-specific edge types for 13-node workflow support
  ai_languageModel: AILanguageModelEdge,
  ai_embedding: AIEmbeddingEdge,
  ai_vectorStore: AIVectorStoreEdge,
  ai_tool: AIToolEdge,
};

const WorkflowEditor: React.FC = () => {
  const {
    nodes: leanNodes,
    edges,
    updateNodes,
    updateEdges,
    selectedNodeIds,
    setSelectedNodes,
    clearSelection,
    addNode,
    addEdge: addEdgeToStore,
    removeNode,
    loadWorkflow,
  } = useLeanWorkflowStore();
  const { loadCredentials } = useCredentialStore();
  const {
    isEnabled: isAIEnabled,
    assistantPanelOpen,
    toggleAssistantPanel,
    analyzeWorkflow,
  } = useAIAssistantStore();

  // Collaboration state
  const {
    isConnected: isCollaborationConnected,
    collaborationPanelOpen,
    toggleCollaborationPanel,
    updatePresence,
    sendOperation,
  } = useCollaborationStore();

  // Analytics state
  const { analyticsModalOpen, toggleAnalyticsModal, setSelectedWorkflow } =
    useAnalyticsStore();
  const { organizations, canManageOrganization } = useRBACStore();

  // Memoized node types - prevent React Flow warnings about creating new objects
  const nodeTypes = useMemo<Record<string, any>>(() => {
    if (import.meta.env.DEV) {
      console.log("🔄 WorkflowEditor: Memoizing node types");
    }
    return generateNodeTypes();
  }, []);

  // One-time registry validation on component mount
  useEffect(() => {
    // Validate that Gmail node is properly registered (one-time check)
    const hasGmailInRegistry = nodeRegistry
      .getAllNodeTypeDescriptions()
      .some((n) => n.name === "gmail-enhanced");
    const hasGmailInReactFlow = "gmail-enhanced" in nodeTypes;

    // Only log if there's actually a problem
    if (hasGmailInRegistry !== hasGmailInReactFlow) {
      console.warn("🔍 Gmail Node Validation Issue:", {
        inRegistry: hasGmailInRegistry,
        inReactFlow: hasGmailInReactFlow,
        registryStats: nodeRegistry.getStatistics(),
      });

      // Note: With memoized nodeTypes, we can't dynamically regenerate
      // If this happens, the user should refresh the page
      if (hasGmailInRegistry && !hasGmailInReactFlow) {
        console.error(
          "🔄 Gmail node in registry but missing from React Flow - page refresh may be needed",
        );
      }
    } else if (import.meta.env.DEV) {
      // Success case - only show in dev mode and only once
      console.log("✅ Gmail node validation passed on mount");
    }
  }, []); // ✅ Fixed: Empty dependency array - runs only once on mount

  // Convert lean nodes to React Flow format with error handling
  const reactFlowNodes = useMemo(() => {
    return leanNodes.map((leanNode) => {
      const nodeDefinition = nodeRegistry.getNodeTypeDescription(leanNode.type);

      // Error handling for missing node types
      if (!nodeDefinition) {
        console.error(
          `❌ Node type "${leanNode.type}" not found in registry!`,
          {
            nodeId: leanNode.id,
            nodeType: leanNode.type,
            availableTypes: nodeRegistry
              .getAllNodeTypeDescriptions()
              .map((n) => n.name),
          },
        );

        // Special handling for Gmail node - likely needs page refresh
        if (leanNode.type === "gmail-enhanced") {
          console.error(
            "🔥 Gmail Enhanced Node missing - page refresh may be needed",
          );
        }
      }
      return {
        id: leanNode.id,
        type: leanNode.type,
        position: leanNode.position,
        data: {
          ...leanNode,
          // Add callbacks for node interactions
          onDelete: () => removeNode(leanNode.id),
          onEdit: () => setSelectedNodeForConfig(leanNode.id),
          onOpenProperties: () => setSelectedNodeForConfig(leanNode.id),
          // Add node definition for display
          nodeDefinition,
        },
      };
    });
  }, [leanNodes, removeNode]);

  const [localNodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<
    string | null
  >(null);
  const [edgesHoveredById, setEdgesHoveredById] = useState<
    Record<string, boolean>
  >({});
  const [edgesBringToFrontById, setEdgesBringToFrontById] = useState<
    Record<string, boolean>
  >({});
  const [isNodePanelCollapsed, setIsNodePanelCollapsed] = useState(false);
  const [isMinimapMinimized, setIsMinimapMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(
    null,
  );
  const [isExecutionPanelVisible, setIsExecutionPanelVisible] = useState(false);
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [isSchedulingPanelVisible, setIsSchedulingPanelVisible] =
    useState(false);
  const [isTriggerPanelVisible, setIsTriggerPanelVisible] = useState(false);
  const [isBranchingPanelVisible, setIsBranchingPanelVisible] = useState(false);
  const [isTemplatesPanelVisible, setIsTemplatesPanelVisible] = useState(false);
  const [isEnterpriseDashboardVisible, setIsEnterpriseDashboardVisible] =
    useState(false);
  const [isAuditDashboardVisible, setIsAuditDashboardVisible] = useState(false);
  const [isOrgSettingsVisible, setIsOrgSettingsVisible] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Monitor current execution
  const { execution } = useExecutionMonitor(currentExecutionId);

  // Handle branch creation from conditional branching panel
  const handleAddBranch = useCallback(
    (branchConfig: BranchConfiguration) => {
      console.log("Adding branch configuration:", branchConfig);

      // Create condition nodes and edges based on branch configuration
      const conditionNodeId = `condition-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const conditionNode = {
        id: conditionNodeId,
        type: "condition",
        position: { x: 300, y: 200 },
        parameters: {},
        data: {
          label: branchConfig.name,
          description: branchConfig.description,
          type: "condition",
          integration: "core",
          nodeType: "condition",
          configuration: {
            conditions: branchConfig.conditions,
            logicalOperator: branchConfig.logicalOperator,
            defaultBranch: branchConfig.defaultBranch,
            priority: branchConfig.priority,
          },
          credentials: [],
          icon: "🔀",
          properties: {
            conditions: branchConfig.conditions,
            logicalOperator: branchConfig.logicalOperator,
          },
        },
      };

      addNode(conditionNode);

      // Create edges for true/false branches
      const sourceNode = localNodes.find(
        (node) => node.id === branchConfig.sourceNodeId,
      );
      if (sourceNode) {
        const trueEdge = {
          id: `edge-${branchConfig.sourceNodeId}-${conditionNodeId}-true`,
          source: branchConfig.sourceNodeId,
          target: conditionNodeId,
          type: "default",
          data: { label: "true" },
        };

        addEdgeToStore(trueEdge);
      }
    },
    [addNode, addEdgeToStore, localNodes],
  );

  // Handle workflow creation from template
  const handleCreateFromTemplate = useCallback(
    (templateId: string, variables?: Record<string, any>) => {
      console.log("Creating workflow from template:", templateId, variables);
      // Template creation is handled within the WorkflowTemplatesPanel component
      // which calls loadWorkflow directly on the store
    },
    [],
  );

  // Sync workflow changes with collaboration service
  useEffect(() => {
    if (isCollaborationConnected && leanNodes.length > 0) {
      // Send operations for node changes
      // This would be enhanced to track specific changes in a real implementation
      const syncWorkflowChanges = async () => {
        try {
          await sendOperation({
            type: "node_update",
            userId: "current-user", // Would come from auth context
            data: { nodes: leanNodes },
            workflowId: "current-workflow", // Would come from props or context
          });
        } catch (error) {
          console.error("Failed to sync workflow changes:", error);
        }
      };

      // Debounce sync to avoid excessive operations
      const timeoutId = setTimeout(syncWorkflowChanges, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [leanNodes, edges, isCollaborationConnected, sendOperation]);

  // Update user selection for collaboration
  useEffect(() => {
    if (isCollaborationConnected && selectedNodeIds.length > 0) {
      updatePresence({
        selection: {
          nodeIds: selectedNodeIds,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [selectedNodeIds, isCollaborationConnected, updatePresence]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Handle redirection for AI agent plus icons
      const correctedParams = { ...params };

      // If connecting FROM an AI agent plus icon, redirect to main handle
      if (correctedParams.sourceHandle?.startsWith("plus-")) {
        correctedParams.sourceHandle = correctedParams.sourceHandle.replace(
          "plus-",
          "",
        );
      }

      // If connecting TO an AI agent plus icon, redirect to main handle
      if (correctedParams.targetHandle?.startsWith("plus-ai_")) {
        correctedParams.targetHandle = correctedParams.targetHandle.replace(
          "plus-ai_",
          "ai_",
        );
      }

      const newEdge = addEdge(
        {
          ...correctedParams,
          data: {
            connectionType: ConnectionType.Main,
            ...("data" in params ? params.data : {}),
          },
        },
        localEdges,
      );
      setEdges(newEdge);
    },
    [localEdges, setEdges],
  );

  const onEdgeDelete = useCallback(
    (edgeId: string) => {
      const filteredEdges = localEdges.filter((edge) => edge.id !== edgeId);
      setEdges(filteredEdges);
      updateEdges(filteredEdges as any);
    },
    [localEdges, setEdges, updateEdges],
  );

  // Edge hover handlers
  const onEdgeMouseEnter = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdgesBringToFrontById((prev) => ({ ...prev, [edge.id]: true }));
      setEdgesHoveredById((prev) => ({ ...prev, [edge.id]: true }));
    },
    [],
  );

  const onEdgeMouseLeave = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdgesBringToFrontById((prev) => ({ ...prev, [edge.id]: false }));
      setEdgesHoveredById((prev) => ({ ...prev, [edge.id]: false }));
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          // Delete selected nodes
          selectedNodeIds.forEach((nodeId) => removeNode(nodeId));
          clearSelection();
        }
      } else if (event.ctrlKey || event.metaKey) {
        if (event.key === "a") {
          // Select all nodes
          event.preventDefault();
          setSelectedNodes(localNodes.map((n) => n.id));
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        if (isFullscreen) {
          // Exit fullscreen mode
          setIsFullscreen(false);
        } else {
          // Clear selection
          clearSelection();
        }
      }
    },
    [
      selectedNodeIds,
      removeNode,
      clearSelection,
      setSelectedNodes,
      localNodes,
      isFullscreen,
    ],
  );

  // Add keyboard event listener for delete
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event?.stopPropagation();

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (isCtrlOrCmd) {
        // Multi-select mode
        const isSelected = selectedNodeIds.includes(node.id);
        if (isSelected) {
          setSelectedNodes(selectedNodeIds.filter((id) => id !== node.id));
        } else {
          setSelectedNodes([...selectedNodeIds, node.id]);
        }
      } else {
        // Single select mode
        setSelectedNodes([node.id]);
      }
    },
    [selectedNodeIds, setSelectedNodes],
  );

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event?.stopPropagation();
      setSelectedNodes([node.id]);
      setSelectedNodeForConfig(node.id);
    },
    [setSelectedNodes],
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Enhanced auto-connection using intelligent algorithm
  const findOptimalConnection = useCallback(
    (dropPosition: any) => {
      if (localNodes.length === 0) return null;

      // Use intelligent auto-connect for sophisticated connection suggestions
      const suggestion = intelligentAutoConnect.findOptimalConnection(
        dropPosition,
        localNodes,
        localEdges,
        {
          maxDistance: 400,
          preferredDirection: "horizontal",
          considerContainers: true,
          validateNodeTypes: true,
        },
      );

      if (suggestion) {
        return localNodes.find((node) => node.id === suggestion.sourceNodeId);
      }

      // Fallback to original logic for compatibility
      return intelligentAutoConnect.findLastNode(localNodes, localEdges);
    },
    [localNodes, localEdges],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      try {
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const data = event.dataTransfer.getData("application/reactflow");

        if (!data || !reactFlowInstance) {
          console.warn("No drag data or ReactFlow instance available");
          return;
        }

        const {
          type,
          integration,
          connectionId,
          nodeTypeData,
          integrationData,
        } = JSON.parse(data);

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Find optimal connection using intelligent auto-connect
        const targetNode = findOptimalConnection(position);

        // Optimize position based on target connection
        const optimizedPosition = targetNode
          ? intelligentAutoConnect.findOptimalDropPosition(
              position,
              localNodes,
              targetNode,
            )
          : position;

        const baseId = nodeTypeData?.name || type;
        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${baseId}`;

        // Get the enhanced node type for integration nodes
        let enhancedNodeType = null;
        let nodeIcon = null;

        if (integrationData?.enhancedNodeTypes) {
          // Find the matching enhanced node type
          enhancedNodeType =
            integrationData.enhancedNodeTypes.find(
              (nt: any) =>
                nt.id === nodeTypeData?.id || nt.name === nodeTypeData?.name,
            ) || integrationData.enhancedNodeTypes[0];

          // Get icon from enhanced node type or integration
          nodeIcon = enhancedNodeType?.icon || integrationData?.icon;
        }

        const newNode = {
          id: newNodeId,
          type: type,
          position: optimizedPosition,
          parameters: {},
          data: {
            label: nodeTypeData?.displayName || nodeTypeData?.name || type,
            integration: integrationData?.id || integration,
            nodeType: nodeTypeData?.name || nodeTypeData?.id,
            configuration: {},
            credentials: [],
            // Include icon and enhancedNodeType for property panel
            icon: nodeIcon,
            enhancedNodeType: enhancedNodeType,
            // Properties for registry system integration
            nodeTypeData,
            integrationData,
            config: {},
            parameters: {},
          },
          connectionId,
        };

        addNode(newNode);

        // Auto-connect to the target node if it exists
        if (targetNode) {
          const newEdge = {
            id: `edge-${targetNode.id}-${newNodeId}`,
            source: targetNode.id,
            target: newNodeId,
            type: "default",
            data: {
              connectionType: ConnectionType.Main,
            },
          };
          addEdgeToStore(newEdge);

          // Log the intelligent connection for user feedback
          if (import.meta.env.DEV) {
            const suggestion = intelligentAutoConnect.findOptimalConnection(
              position,
              localNodes,
              localEdges,
              {
                maxDistance: 400,
                preferredDirection: "horizontal",
                considerContainers: true,
                validateNodeTypes: true,
              },
            );
            if (suggestion) {
              console.log(`🔗 Intelligent Auto-Connect: ${suggestion.reason}`);
            }
          }
        }
      } catch (error) {
        console.error("Error in onDrop:", error);
      }
    },
    [
      reactFlowInstance,
      addNode,
      addEdgeToStore,
      findOptimalConnection,
      localNodes,
      localEdges,
    ],
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  // Initialize local state when store changes
  useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // Save to store only when user stops interacting (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Convert React Flow nodes back to lean format
      const leanNodes = localNodes
        .filter((node) => node.type)
        .map((node) => ({
          id: node.id,
          type: node.type!,
          position: node.position,
          parameters: node.data?.parameters || {},
          credentials: node.data?.credentials,
          disabled: node.data?.disabled,
          notes: node.data?.notes,
          name: node.data?.name,
          continueOnFail: node.data?.continueOnFail,
          executeOnce: node.data?.executeOnce,
        }));

      if (JSON.stringify(leanNodes) !== JSON.stringify(leanNodes)) {
        updateNodes(leanNodes);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localNodes, updateNodes]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (JSON.stringify(localEdges) !== JSON.stringify(edges)) {
        updateEdges(localEdges as any);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localEdges, edges, updateEdges]);

  // Auto-analyze workflow when AI is enabled and workflow changes
  useEffect(() => {
    if (isAIEnabled && localNodes.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeWorkflow(
          localNodes.map((node) => ({
            id: node.id,
            type: node.type!,
            position: node.position,
            parameters: node.data?.parameters || {},
            credentials: node.data?.credentials || [],
            disabled: node.data?.disabled || false,
            notes: node.data?.notes || "",
            name: node.data?.name || "",
            continueOnFail: node.data?.continueOnFail || false,
            executeOnce: node.data?.executeOnce || false,
          })),
          localEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
            data: edge.data,
          })),
        ).catch((error) => {
          console.error("AI workflow analysis failed:", error);
        });
      }, 1000); // Debounce analysis
      return () => clearTimeout(timeoutId);
    }
  }, [isAIEnabled, localNodes, localEdges, analyzeWorkflow]);

  // Handler for node connection - no longer creates automatic nodes, just logs
  const handleNodeConnect = useCallback(() => {
    // This is now handled by ReactFlow's native connection system through handles
  }, []);

  // Handler for opening node properties
  const handleOpenProperties = useCallback(
    (nodeId: string) => {
      setSelectedNodes([nodeId]);
      setSelectedNodeForConfig(nodeId);
    },
    [setSelectedNodes],
  );

  // Execution control handlers
  const handleExecutionStart = useCallback((executionId: string) => {
    setCurrentExecutionId(executionId);
  }, []);

  const handleExecutionStop = useCallback(() => {
    setCurrentExecutionId(null);
  }, []);

  // Connect to execution monitor on mount
  useEffect(() => {
    executionMonitor.connect().catch(console.error);

    return () => {
      executionMonitor.disconnect();
    };
  }, []);

  // Handle OAuth success/error messages from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const credentialStatus = urlParams.get("credential");
    const credentialName = urlParams.get("name");
    const errorMessage = urlParams.get("message");

    if (credentialStatus === "success" && credentialName) {
      console.log("OAuth success:", credentialName);
      // Show success notification
      alert(`Successfully connected ${decodeURIComponent(credentialName)}!`);

      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);

      // Reload credentials to show the new one in dropdowns
      loadCredentials().catch(console.error);

      // Reload workflow to ensure it's fresh after OAuth redirect
      const workflowId = window.location.pathname
        .split("/workflow/")[1]
        ?.split("?")[0];
      if (workflowId) {
        loadWorkflow(workflowId).catch(console.error);
      }
    } else if (credentialStatus === "error" && errorMessage) {
      console.error("OAuth error:", errorMessage);
      // Show error notification
      alert(`Failed to connect: ${decodeURIComponent(errorMessage)}`);

      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const memoizedNodes = useMemo(
    () =>
      localNodes.map((node) => {
        // Check if this node has outgoing connections from any handle
        const hasOutgoingConnection = localEdges.some(
          (edge) => edge.source === node.id,
        );

        return {
          ...node,
          selected: selectedNodeIds.includes(node.id),
          data: {
            ...node.data,
            onDelete: () => removeNode(node.id),
            onConnect: handleNodeConnect,
            onOpenProperties: () => handleOpenProperties(node.id),
            hasOutgoingConnection,
            isSelected: selectedNodeIds.includes(node.id),
            // For AI agent nodes, pass edges data for handle connection tracking
            ...(node.type === "ai-agent" && { edges: localEdges }),
          },
        };
      }),
    [
      localNodes,
      localEdges,
      selectedNodeIds,
      removeNode,
      handleNodeConnect,
      handleOpenProperties,
    ],
  );

  const memoizedEdges = useMemo(
    () =>
      localEdges.map((edge) => ({
        ...edge,
        type: "default",
        data: {
          onDelete: onEdgeDelete,
          connectionType: edge.data?.connectionType || ConnectionType.Main,
          ...edge.data,
        },
        // Pass hover state as props
        hovered: edgesHoveredById[edge.id] || false,
        bringToFront: edgesBringToFrontById[edge.id] || false,
      })),
    [localEdges, onEdgeDelete, edgesHoveredById, edgesBringToFrontById],
  );

  return (
    <div
      className={`h-full flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-gray-900" : ""}`}
    >
      {/* Execution Toolbar - hidden in fullscreen */}
      {!isFullscreen && (
        <ExecutionToolbar
          nodes={localNodes}
          edges={localEdges}
          currentExecution={execution}
          onExecutionStart={handleExecutionStart}
          onExecutionStop={handleExecutionStop}
        />
      )}

      <div className="flex-1 flex">
        {/* Node Panel - hidden in fullscreen */}
        {!isFullscreen && (
          <AdvancedNodePanel
            isCollapsed={isNodePanelCollapsed}
            onToggle={() => setIsNodePanelCollapsed(!isNodePanelCollapsed)}
          />
        )}

        {/* Main Editor */}
        <div className="flex-1 relative" ref={setContainerRef}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={memoizedNodes}
              edges={memoizedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={onPaneClick}
              onInit={onInit}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onEdgeMouseEnter={onEdgeMouseEnter}
              onEdgeMouseLeave={onEdgeMouseLeave}
              onMouseMove={(event) => {
                if (isCollaborationConnected) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - rect.left;
                  const y = event.clientY - rect.top;
                  updatePresence({
                    cursor: { x, y, timestamp: new Date().toISOString() },
                  });
                }
              }}
              onMoveEnd={(_event, viewport) => {
                if (isCollaborationConnected) {
                  updatePresence({
                    viewport: {
                      x: viewport.x,
                      y: viewport.y,
                      zoom: viewport.zoom,
                      timestamp: new Date().toISOString(),
                    },
                  });
                }
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionLineComponent={ConnectionLine}
              fitView
              className="bg-gray-900"
              deleteKeyCode={null}
              multiSelectionKeyCode="Meta"
              selectNodesOnDrag={true}
              panOnDrag={[1, 2]}
              selectionOnDrag={true}
            >
              {/* AI Edge Markers for specialized connections */}
              <svg style={{ position: "absolute", top: 0, left: 0 }}>
                <AIEdgeMarkers />
              </svg>

              <style>{`
              .bring-to-front {
                z-index: 1000 !important;
              }
              .react-flow__edge-path.hovered {
                filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
              }
              .react-flow__edge-path {
                cursor: pointer;
              }
              .react-flow__edge-path:hover {
                stroke-width: 3px !important;
                stroke: #3b82f6 !important;
              }
              /* Ensure edge labels are always visible on hover */
              .react-flow__edge-label {
                pointer-events: all;
              }
              /* AI Edge Animations */
              ${AIEdgeStyles}
            `}</style>
              <Controls
                className="bg-white border border-gray-200 rounded-lg"
                showInteractive={true}
              >
                {isAIEnabled && (
                  <button
                    onClick={toggleAssistantPanel}
                    className={`react-flow__controls-button ${
                      assistantPanelOpen ? "bg-blue-100 border-blue-300" : ""
                    }`}
                    title={
                      assistantPanelOpen
                        ? "Hide AI Assistant"
                        : "Open AI Assistant"
                    }
                  >
                    🤖
                  </button>
                )}
                <button
                  onClick={toggleCollaborationPanel}
                  className={`react-flow__controls-button ${
                    collaborationPanelOpen
                      ? "bg-green-100 border-green-300"
                      : ""
                  } ${isCollaborationConnected ? "bg-green-50" : ""}`}
                  title={
                    collaborationPanelOpen
                      ? "Hide Collaboration Panel"
                      : "Open Collaboration Panel"
                  }
                >
                  👥
                </button>
                <button
                  onClick={() => {
                    toggleAnalyticsModal();
                    if (!analyticsModalOpen) {
                      // Set workflow ID for analytics - would come from props in real app
                      setSelectedWorkflow("current-workflow");
                    }
                  }}
                  className={`react-flow__controls-button ${
                    analyticsModalOpen ? "bg-purple-100 border-purple-300" : ""
                  }`}
                  title={
                    analyticsModalOpen
                      ? "Hide Analytics Dashboard"
                      : "Open Analytics Dashboard"
                  }
                >
                  📊
                </button>
                <button
                  onClick={() =>
                    setIsExecutionPanelVisible(!isExecutionPanelVisible)
                  }
                  className="react-flow__controls-button"
                  title={
                    isExecutionPanelVisible
                      ? "Hide execution panel"
                      : "Show execution panel"
                  }
                >
                  📊
                </button>
                <button
                  onClick={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
                  className={`react-flow__controls-button ${
                    isDebugPanelVisible ? "bg-orange-100 border-orange-300" : ""
                  }`}
                  title={
                    isDebugPanelVisible
                      ? "Hide debug panel"
                      : "Show debug panel"
                  }
                >
                  🐛
                </button>
                <button
                  onClick={() =>
                    setIsSchedulingPanelVisible(!isSchedulingPanelVisible)
                  }
                  className={`react-flow__controls-button ${
                    isSchedulingPanelVisible
                      ? "bg-purple-100 border-purple-300"
                      : ""
                  }`}
                  title={
                    isSchedulingPanelVisible
                      ? "Hide scheduling panel"
                      : "Show scheduling panel"
                  }
                >
                  ⏰
                </button>
                <button
                  onClick={() =>
                    setIsTriggerPanelVisible(!isTriggerPanelVisible)
                  }
                  className={`react-flow__controls-button ${
                    isTriggerPanelVisible
                      ? "bg-yellow-100 border-yellow-300"
                      : ""
                  }`}
                  title={
                    isTriggerPanelVisible
                      ? "Hide trigger panel"
                      : "Show trigger panel"
                  }
                >
                  ⚡
                </button>
                <button
                  onClick={() =>
                    setIsBranchingPanelVisible(!isBranchingPanelVisible)
                  }
                  className={`react-flow__controls-button ${
                    isBranchingPanelVisible
                      ? "bg-indigo-100 border-indigo-300"
                      : ""
                  }`}
                  title={
                    isBranchingPanelVisible
                      ? "Hide branching panel"
                      : "Show branching panel"
                  }
                >
                  🔀
                </button>
                <button
                  onClick={() =>
                    setIsTemplatesPanelVisible(!isTemplatesPanelVisible)
                  }
                  className={`react-flow__controls-button ${
                    isTemplatesPanelVisible ? "bg-cyan-100 border-cyan-300" : ""
                  }`}
                  title={
                    isTemplatesPanelVisible
                      ? "Hide templates panel"
                      : "Show templates panel"
                  }
                >
                  📋
                </button>
                {canManageOrganization() && (
                  <>
                    <button
                      onClick={() =>
                        setIsEnterpriseDashboardVisible(
                          !isEnterpriseDashboardVisible,
                        )
                      }
                      className={`react-flow__controls-button ${
                        isEnterpriseDashboardVisible
                          ? "bg-emerald-100 border-emerald-300"
                          : ""
                      }`}
                      title={
                        isEnterpriseDashboardVisible
                          ? "Hide enterprise dashboard"
                          : "Show enterprise dashboard"
                      }
                    >
                      📊
                    </button>
                    <button
                      onClick={() =>
                        setIsAuditDashboardVisible(!isAuditDashboardVisible)
                      }
                      className={`react-flow__controls-button ${
                        isAuditDashboardVisible
                          ? "bg-red-100 border-red-300"
                          : ""
                      }`}
                      title={
                        isAuditDashboardVisible
                          ? "Hide audit dashboard"
                          : "Show audit dashboard"
                      }
                    >
                      🔒
                    </button>
                    <button
                      onClick={() =>
                        setIsOrgSettingsVisible(!isOrgSettingsVisible)
                      }
                      className={`react-flow__controls-button ${
                        isOrgSettingsVisible
                          ? "bg-gray-100 border-gray-300"
                          : ""
                      }`}
                      title={
                        isOrgSettingsVisible
                          ? "Hide organization settings"
                          : "Show organization settings"
                      }
                    >
                      ⚙️
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="react-flow__controls-button"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? "⊞" : "⛶"}
                </button>
              </Controls>

              {/* Minimap with minimize/maximize functionality */}
              {!isMinimapMinimized && (
                <MiniMap
                  position="bottom-right"
                  className="bg-white border border-gray-200 rounded-lg shadow-lg"
                  pannable={true}
                  zoomable={true}
                  ariaLabel="Workflow minimap"
                  nodeColor={(node) => {
                    switch (node.type) {
                      case "trigger":
                        return "#10b981";
                      case "action":
                        return "#3b82f6";
                      case "condition":
                        return "#f59e0b";
                      case "delay":
                        return "#a855f7";
                      case "loop":
                        return "#6366f1";
                      case "transform":
                        return "#14b8a6";
                      case "webhook":
                        return "#f97316";
                      case "database":
                        return "#64748b";
                      case "email":
                        return "#ef4444";
                      case "file":
                        return "#059669";
                      default:
                        return "#6b7280";
                    }
                  }}
                  nodeStrokeWidth={1}
                  nodeBorderRadius={4}
                  maskColor="rgba(0, 0, 0, 0.2)"
                />
              )}

              {/* Minimap toggle button using ReactFlow Panel */}
              <Panel position="bottom-right" className="mr-2 mb-2">
                <button
                  onClick={() => setIsMinimapMinimized(!isMinimapMinimized)}
                  className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-700 font-bold"
                  title={isMinimapMinimized ? "Show minimap" : "Hide minimap"}
                >
                  {isMinimapMinimized ? "□" : "−"}
                </button>
              </Panel>
              <Background color="#ffffff" gap={20} size={1} />

              {/* User Presence Overlay */}
              <UserPresenceOverlay
                containerRef={{ current: containerRef! }}
                transform={
                  reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
                }
              />

              {/* Comment Annotations */}
              <CommentAnnotations
                containerRef={{ current: containerRef! }}
                transform={
                  reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
                }
                onCommentClick={(position) => {
                  console.log("Comment clicked at position:", position);
                }}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Advanced Property Panel */}
      <AdvancedPropertyPanel
        isOpen={selectedNodeForConfig !== null}
        onClose={() => setSelectedNodeForConfig(null)}
        nodeId={selectedNodeForConfig || undefined}
      />

      {/* Execution Monitoring Panel */}
      <ExecutionPanel
        isVisible={isExecutionPanelVisible}
        onToggle={() => setIsExecutionPanelVisible(!isExecutionPanelVisible)}
        position="right"
      />

      {/* AI Assistant Panel */}
      {isAIEnabled && (
        <AIAssistantPanel
          visible={assistantPanelOpen}
          onClose={toggleAssistantPanel}
          workflowNodes={localNodes}
          workflowEdges={localEdges}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel
        visible={isDebugPanelVisible}
        onToggle={() => setIsDebugPanelVisible(!isDebugPanelVisible)}
        position="left"
        currentExecutionId={currentExecutionId}
      />

      {/* Collaboration Panel */}
      <CollaborationPanel
        isVisible={collaborationPanelOpen}
        onToggle={toggleCollaborationPanel}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={analyticsModalOpen}
        onClose={toggleAnalyticsModal}
        workflowId="current-workflow" // Would come from props in real app
      />

      {/* Scheduling Panel */}
      <SchedulingPanel
        workflowId="current-workflow" // Would come from props in real app
        visible={isSchedulingPanelVisible}
        onClose={() => setIsSchedulingPanelVisible(false)}
      />

      {/* Trigger Management Panel */}
      <TriggerPanel
        workflowId="current-workflow" // Would come from props in real app
        visible={isTriggerPanelVisible}
        onClose={() => setIsTriggerPanelVisible(false)}
      />

      {/* Conditional Branching Panel */}
      <ConditionalBranchingPanel
        workflowId="current-workflow" // Would come from props in real app
        visible={isBranchingPanelVisible}
        onClose={() => setIsBranchingPanelVisible(false)}
        onAddBranch={handleAddBranch}
      />

      {/* Workflow Templates Panel */}
      <WorkflowTemplatesPanel
        visible={isTemplatesPanelVisible}
        onClose={() => setIsTemplatesPanelVisible(false)}
        onCreateFromTemplate={handleCreateFromTemplate}
      />

      {/* Enterprise Panels - Only visible to authorized users */}
      {canManageOrganization() && (
        <>
          {/* Enterprise Dashboard */}
          {isEnterpriseDashboardVisible && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                zIndex: 1000,
                overflow: "auto",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 1001,
                }}
              >
                <button
                  onClick={() => setIsEnterpriseDashboardVisible(false)}
                  style={{
                    background: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <EnterpriseDashboard />
            </div>
          )}

          {/* Audit Dashboard */}
          {isAuditDashboardVisible && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                zIndex: 1000,
                overflow: "auto",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 1001,
                }}
              >
                <button
                  onClick={() => setIsAuditDashboardVisible(false)}
                  style={{
                    background: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <AuditDashboard />
            </div>
          )}

          {/* Organization Settings */}
          {isOrgSettingsVisible && organizations.length > 0 && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                zIndex: 1000,
                overflow: "auto",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 1001,
                }}
              >
                <button
                  onClick={() => setIsOrgSettingsVisible(false)}
                  style={{
                    background: "#ff4d4f",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <OrganizationSettingsComponent organization={organizations[0]} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowEditor;
