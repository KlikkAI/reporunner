import { useEffect } from "./useEffect";
import { useEnhancedExecutionStore } from "./useEnhancedExecutionStore";
import { useRef } from "./useRef";
import { useState } from "./useState";
/**
 * Execution Panel
 *
 * Real-time execution monitoring panel inspired by SIM's copilot panel
 * and n8n's execution monitoring. Provides execution console, variables,
 * and performance metrics in a collapsible side panel.
 */

import React, { useEffect, useState } from 'react';
import { useEnhancedExecutionStore } from '@/core/stores/enhancedExecutionStore';
import { cn } from '@/design-system/utils';

interface ExecutionPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  position?: 'right' | 'bottom';
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  isVisible,
  onToggle,
  position = 'right',
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'variables' | 'metrics' | 'history'>(
    'console'
  );
  const [autoScroll, setAutoScroll] = useState(true);

  const {
    currentExecution,
    progress,
    nodeStates,
    performanceMetrics,
    executionHistory,
    isConnected,
    lastUpdateTimestamp,
    debugMode,
    setDebugMode,
  } = useEnhancedExecutionStore();

  // Auto-scroll to bottom for console logs
  const consoleRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [autoScroll]);

  // Get all logs from all nodes
  const getAllLogs = () => {
    const logs: Array<{
      nodeId: string;
      level: string;
      message: string;
      timestamp: string;
    }> = [];

    nodeStates.forEach((state, nodeId) => {
      if (state.debugInfo?.logs) {
        state.debugInfo.logs.forEach((log) => {
          logs.push({
            nodeId,
            ...log,
          });
        });
      }
    });

    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  // Get current execution variables
  const getExecutionVariables = () => {
    const variables: Record<string, any> = {};

    nodeStates.forEach((state, nodeId) => {
      if (state.outputData) {
        variables[`${nodeId}_output`] = state.outputData;
      }
      if (state.debugInfo?.watchedVariables) {
        Object.entries(state.debugInfo.watchedVariables).forEach(([key, value]) => {
          variables[`${nodeId}_${key}`] = value;
        });
      }
    });

    return variables;
  };

  const renderProgressBar = () => {
    if (!progress) return null;

    const { progressPercentage, completedNodes, totalNodes, failedNodes } = progress;

    return (
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Execution Progress</span>
          <span className="text-sm text-gray-400">
            {completedNodes}/{totalNodes} nodes
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              failedNodes > 0 ? 'bg-red-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {failedNodes > 0 && (
          <div className="mt-2 text-xs text-red-400">{failedNodes} node(s) failed</div>
        )}
      </div>
    );
  };

  const renderConsoleTab = () => {
    const logs = getAllLogs();

    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-300">Console</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                'text-xs px-2 py-1 rounded',
                autoScroll ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              )}
            >
              Auto-scroll
            </button>
            <button
              onClick={() => {
                // Clear logs implementation
              }}
              className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>

        <div
          ref={consoleRef}
          className="flex-1 bg-gray-900 rounded border border-gray-700 p-2 overflow-y-auto text-xs font-mono"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No logs yet. Execute a workflow to see real-time logs.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={cn(
                  'mb-1 p-1 rounded',
                  log.level === 'error' && 'bg-red-900 text-red-200',
                  log.level === 'warn' && 'bg-yellow-900 text-yellow-200',
                  log.level === 'info' && 'text-gray-300',
                  log.level === 'debug' && 'text-gray-500'
                )}
              >
                <span className="text-gray-500">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className="ml-2 text-blue-400">[{log.nodeId}]</span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderVariablesTab = () => {
    const variables = getExecutionVariables();

    return (
      <div className="flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Variables</h3>
        <div className="flex-1 bg-gray-900 rounded border border-gray-700 p-2 overflow-y-auto">
          {Object.keys(variables).length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No variables available. Execute nodes to see output data.
            </div>
          ) : (
            Object.entries(variables).map(([key, value]) => (
              <div key={key} className="mb-3 p-2 bg-gray-800 rounded">
                <div className="text-blue-400 text-xs font-mono mb-1">{key}</div>
                <div className="text-gray-300 text-xs break-all">
                  <pre className="whitespace-pre-wrap">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMetricsTab = () => {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Performance Metrics</h3>
        <div className="flex-1 space-y-3">
          {/* Execution time metrics */}
          <div className="bg-gray-900 rounded border border-gray-700 p-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Node Execution Times</h4>
            {performanceMetrics.nodeExecutionTimes.size === 0 ? (
              <div className="text-gray-500 text-xs">No timing data available</div>
            ) : (
              <div className="space-y-1">
                {Array.from(performanceMetrics.nodeExecutionTimes.entries()).map(
                  ([nodeId, time]) => (
                    <div key={nodeId} className="flex justify-between text-xs">
                      <span className="text-blue-400">{nodeId}</span>
                      <span className="text-gray-300">
                        {time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Resource usage */}
          <div className="bg-gray-900 rounded border border-gray-700 p-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Resource Usage</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Peak Memory:</span>
                <span className="text-gray-300">
                  {performanceMetrics.resourceUsage.peakMemory
                    ? `${(performanceMetrics.resourceUsage.peakMemory / 1024 / 1024).toFixed(1)} MB`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPU Time:</span>
                <span className="text-gray-300">
                  {performanceMetrics.resourceUsage.totalCpuTime
                    ? `${performanceMetrics.resourceUsage.totalCpuTime}ms`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Requests:</span>
                <span className="text-gray-300">
                  {performanceMetrics.resourceUsage.networkRequests || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Execution History</h3>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {executionHistory.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No execution history</div>
          ) : (
            executionHistory.slice(0, 10).map((execution) => (
              <div
                key={execution.id}
                className="bg-gray-900 rounded border border-gray-700 p-2 hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div
                      className={cn(
                        'text-xs font-medium',
                        execution.status === 'completed' && 'text-green-400',
                        execution.status === 'failed' && 'text-red-400',
                        execution.status === 'running' && 'text-blue-400'
                      )}
                    >
                      {execution.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {execution.startTime && new Date(execution.startTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {execution.duration && `${(execution.duration / 1000).toFixed(1)}s`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'fixed z-40 bg-gray-800 text-white p-2 rounded-l shadow-lg hover:bg-gray-700 transition-colors',
          position === 'right'
            ? 'right-0 top-1/2 -translate-y-1/2'
            : 'bottom-0 left-1/2 -translate-x-1/2 rounded-t'
        )}
        title="Show execution panel"
      >
        {position === 'right' ? '←' : '↑'} Execution
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-30 bg-gray-800 border-l border-gray-700 shadow-xl',
        position === 'right' ? 'right-0 top-0 h-full w-80' : 'bottom-0 left-0 right-0 h-80 border-t'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Execution Monitor</h2>
          <div
            className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={cn(
              'text-xs px-2 py-1 rounded',
              debugMode ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'
            )}
          >
            Debug
          </button>
          <button onClick={onToggle} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {currentExecution && (
        <div className="p-3 border-b border-gray-700">{renderProgressBar()}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {(['console', 'variables', 'metrics', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden">
        {activeTab === 'console' && renderConsoleTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};

export default ExecutionPanel;
