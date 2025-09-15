/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

import NodeToolbar from "./NodeToolbar";
import NodeMenu from "./NodeMenu";
import NodeHandles from "./NodeHandles";
import { IntegrationNodeType } from "@/core";

// Base props interface that all nodes extend
export interface BaseNodeData {
  label: string;
  integration?: string;
  integrationData?: {
    id: string;
    name: string;
    icon: string;
    category: string;
  };
  nodeTypeData?:
    | IntegrationNodeType
    | {
        id: string;
        name: string;
        type: string;
        description: string;
      };
  config?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  icon?: string;
  name?: string;
  description?: string;
  onDelete?: (nodeId: string) => void;
  onConnect?: (sourceNodeId: string) => void;
  onOpenProperties?: (nodeId: string) => void;
  hasOutgoingConnection?: boolean;
  isSelected?: boolean;
  // For AI agents, track connections to specific handles
  edges?: Array<{
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
  }>;
  // Condition node specific properties
  outputs?: Array<{
    id: string;
    label: string;
    position: { top: string };
    color: string;
    condition?: string;
  }>;
  nodeSize?: {
    width: number;
    height: number;
  };
  conditionRules?: any[];
}

export interface BaseNodeProps {
  id?: string;
  data: BaseNodeData;
  selected?: boolean;
}

// Handle configuration for different node types
export interface HandleConfig {
  input?: {
    show: boolean;
    position?: { top?: string; left?: string };
  };
  outputs?: Array<{
    id: string;
    position: { top?: string; right?: string };
    color?: string;
    label?: string;
    removable?: boolean;
  }>;
  dynamicOutputs?: boolean;
  maxOutputs?: number;
  hasAIHandles?: boolean; // Flag to indicate AI-specific handles needed
}

// Visual configuration for different node types
export interface VisualConfig {
  shape: string; // CSS classes for border-radius
  defaultIcon: string | React.ReactNode; // Fallback icon
  selectionRingColor: string; // CSS class for selection ring
  dimensions: {
    minWidth: string;
    maxWidth?: string;
    minHeight?: string;
    // Support for dynamic inline styles
    style?: React.CSSProperties;
  };
}

export interface BaseNodeConfig {
  handles: HandleConfig;
  visual: VisualConfig;
}

interface BaseNodeComponentProps extends BaseNodeProps {
  config: BaseNodeConfig;
  children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeComponentProps> = ({
  id,
  data,
  selected,
  config,
  children,
}) => {
  const isSelected = data.isSelected || selected;
  const displayName = data.name || data.label;
  const integration = data.integrationData;

  // Determine node type based on available data
  const nodeType = React.useMemo(() => {
    // Check if this is a condition node based on having conditionRules
    if (data.conditionRules || config.handles.dynamicOutputs) {
      console.log("BaseNode: Detected condition node type for", displayName);
      return "condition";
    }
    // Check if this is an AI agent
    if (integration?.id === "ai-agent" || config.handles.hasAIHandles) {
      return "ai-agent";
    }
    // Default to action
    return "action";
  }, [
    data.conditionRules,
    config.handles.dynamicOutputs,
    config.handles.hasAIHandles,
    integration?.id,
    displayName,
  ]);

  // For AI agents, calculate which handles have incoming connections
  const aiHandleConnections = React.useMemo(() => {
    if (!config.handles.hasAIHandles || !data.edges || !id) {
      return {};
    }

    const connections = {
      ai_languageModel: false,
      ai_memory: false,
      ai_tool: false,
    };

    // Check for incoming connections to each AI handle
    data.edges.forEach((edge) => {
      if (edge.target === id) {
        switch (edge.targetHandle) {
          case "ai_languageModel":
          case "plus-ai_languageModel":
            connections.ai_languageModel = true;
            break;
          case "ai_memory":
          case "plus-ai_memory":
            connections.ai_memory = true;
            break;
          case "ai_tool":
          case "plus-ai_tool":
            connections.ai_tool = true;
            break;
        }
      }
    });

    return connections;
  }, [config.handles.hasAIHandles, data.edges, id]);

  // Common state
  const [isHovered, setIsHovered] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Common handlers
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (id && data.onDelete) {
      data.onDelete(id);
    }
  };

  const handlePlay = () => {
    console.log("Play node:", id);
  };

  const handleStop = () => {
    console.log("Stop node:", id);
  };

  const handleOpen = () => {
    if (id && data.onOpenProperties) {
      data.onOpenProperties(id);
    }
  };

  const handleTest = () => {
    console.log("Test node:", id);
  };

  const handleRename = () => {
    console.log("Rename node:", id);
  };

  const handleDeactivate = () => {
    console.log("Deactivate node:", id);
  };

  const handleCopy = () => {
    console.log("Copy node:", id);
  };

  const handleDuplicate = () => {
    console.log("Duplicate node:", id);
  };

  const handleSelectAll = () => {
    console.log("Select All node:");
  };

  const handleClearSelection = () => {
    console.log("Clear selection");
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    // Only handle double-click if it's on the node itself, not on toolbar buttons
    event.stopPropagation();
    if (id && data.onOpenProperties) {
      data.onOpenProperties(id);
    }
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
    setToolbarVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    hideTimeoutRef.current = setTimeout(() => {
      setToolbarVisible(false);
    }, 1000);
  };

  // Render icon
  const renderIcon = () => {
    if (data.icon || integration?.icon) {
      const iconSrc = data.icon || integration?.icon;
      if (
        typeof iconSrc === "string" &&
        (iconSrc.startsWith("http") || iconSrc.startsWith("/"))
      ) {
        return (
          <img
            src={iconSrc}
            alt={displayName}
            className="w-6 h-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
        );
      }
      return <span className="text-xl">{iconSrc}</span>;
    }

    // Fallback to default icon
    const defaultIcon = config.visual.defaultIcon;
    if (typeof defaultIcon === "string") {
      // Handle special default icon types
      switch (defaultIcon) {
        case "trigger-default":
          return <div className="w-4 h-4 bg-green-500 rounded"></div>;
        case "action-default":
          return <div className="w-4 h-4 bg-blue-500 rounded"></div>;
        case "condition-default":
          return <div className="w-4 h-4 bg-yellow-500 rounded"></div>;
        default:
          return <span className="text-xl">{defaultIcon}</span>;
      }
    }
    return defaultIcon;
  };

  return (
    <div className="flex flex-col">
      <div className="relative">
        {" "}
        {/* This container holds both the node and plus icons */}
        <div className="flex items-center">
          <div
            className={`
              relative flex items-center justify-center bg-gray-800 p-4 shadow-lg transition-all duration-200
              ${config.visual.shape}
              ${config.visual.dimensions.minWidth}
              ${config.visual.dimensions.maxWidth ? config.visual.dimensions.maxWidth : ""}
              ${config.visual.dimensions.minHeight ? config.visual.dimensions.minHeight : ""}
              ${isSelected ? `ring-2 ring-offset-2 ring-offset-gray-900 ${config.visual.selectionRingColor}` : ""}
              ${isHovered ? `hover:shadow-xl hover:scale-105 ring-2 ring-offset-2 ring-offset-gray-900 ${config.visual.selectionRingColor}` : ""}
            `}
            style={config.visual.dimensions.style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
          >
            {/* Use NodeHandles for all node types to ensure consistent UX */}
            <NodeHandles
              config={config.handles}
              integration={data.integrationData?.id || data.integration}
              nodeType={nodeType}
              aiHandleConnections={aiHandleConnections}
              hasOutgoingConnection={data.hasOutgoingConnection}
            />

            {/* Node Icon */}
            <div className="flex items-center justify-center">
              {renderIcon()}
            </div>

            {/* Node Toolbar */}
            <NodeToolbar
              visible={toolbarVisible}
              onPlay={handlePlay}
              onStop={handleStop}
              onDelete={handleDelete}
              onMenuToggle={() => setShowThreeDotMenu(!showThreeDotMenu)}
            />

            {/* Three Dot Menu */}
            <NodeMenu
              visible={showThreeDotMenu}
              onClose={() => setShowThreeDotMenu(false)}
              onOpen={handleOpen}
              onTest={handleTest}
              onRename={handleRename}
              onDeactivate={handleDeactivate}
              onCopy={handleCopy}
              onDuplicate={handleDuplicate}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
            />

            {/* Custom children for node-specific content */}
            {children}
          </div>
        </div>
      </div>

      {/* Only show label below node if it's not using AI handles (AI agents show label inside) */}
      {!config.handles.hasAIHandles && (
        <div className="mt-2 text-white text-sm font-medium ps-5 max-w-[100px] truncate">
          {displayName}
        </div>
      )}
    </div>
  );
};

export default BaseNode;
