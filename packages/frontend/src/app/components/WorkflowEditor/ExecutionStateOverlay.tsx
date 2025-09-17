/**
 * Execution State Overlay
 *
 * Provides real-time visual feedback for node execution states,
 * including progress indicators, error states, and performance metrics.
 */

import React from "react";
import { useEnhancedExecutionStore } from "@/core/stores/enhancedExecutionStore";
import { cn } from "@/design-system/utils";

interface ExecutionStateOverlayProps {
  nodeId: string;
  className?: string;
}

export const ExecutionStateOverlay: React.FC<ExecutionStateOverlayProps> = ({
  nodeId,
  className,
}) => {
  const {
    getNodeState,
    activeNodes,
    pendingNodes,
    completedNodes,
    failedNodes,
    debugMode,
    breakpoints,
  } = useEnhancedExecutionStore();

  const nodeState = getNodeState(nodeId);
  const isActive = activeNodes.has(nodeId);
  const isPending = pendingNodes.has(nodeId);
  const isCompleted = completedNodes.has(nodeId);
  const isFailed = failedNodes.has(nodeId);
  const hasBreakpoint = breakpoints.has(nodeId);

  // Don't render overlay if there's no execution state
  if (!nodeState && !isActive && !isPending && !isCompleted && !isFailed) {
    return null;
  }

  const getStatusColor = () => {
    if (isFailed) return "bg-red-500";
    if (isCompleted) return "bg-green-500";
    if (isActive) return "bg-blue-500";
    if (isPending) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getStatusText = () => {
    if (isFailed) return "Failed";
    if (isCompleted) return "Completed";
    if (isActive) return "Running";
    if (isPending) return "Pending";
    return "Idle";
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Status indicator */}
      <div
        className={cn(
          "absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg",
          getStatusColor(),
          isActive && "animate-pulse",
        )}
        title={getStatusText()}
      />

      {/* Breakpoint indicator */}
      {hasBreakpoint && debugMode && (
        <div
          className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center"
          title="Breakpoint"
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {/* Progress ring for running nodes */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse">
          <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-lg" />
        </div>
      )}

      {/* Error indicator */}
      {isFailed && (
        <div className="absolute inset-0 border-2 border-red-500 rounded-lg">
          <div className="absolute inset-0 bg-red-500 opacity-10 rounded-lg" />
        </div>
      )}

      {/* Success indicator */}
      {isCompleted && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
          <div className="absolute inset-0 bg-green-500 opacity-5 rounded-lg" />
        </div>
      )}

      {/* Duration indicator */}
      {nodeState?.duration && (isCompleted || isFailed) && (
        <div
          className="absolute -bottom-6 left-0 right-0 text-xs text-center bg-black bg-opacity-75 text-white px-2 py-1 rounded"
          title="Execution time"
        >
          {formatDuration(nodeState.duration)}
        </div>
      )}

      {/* Error tooltip */}
      {isFailed && nodeState?.error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-600 text-white text-xs rounded shadow-lg max-w-xs z-50">
          <div className="font-semibold">Error:</div>
          <div className="break-words">{nodeState.error.message}</div>
        </div>
      )}
    </div>
  );
};

export default ExecutionStateOverlay;
