import { useEffect } from './hooks/useEffect';
import { useUp } from './hooks/useUp';
import { useMove } from './hooks/useMove';
import { useEvent } from './hooks/useEvent';
import { useDown } from './hooks/useDown';
import { useLeanWorkflowStore } from './hooks/useLeanWorkflowStore';
import { useEnhancedExecutionStore } from './hooks/useEnhancedExecutionStore';
import { useState } from './hooks/useState';
import { useMemo } from './hooks/useMemo';
import { useCallback } from './hooks/useCallback';
/**
 * Advanced Property Panel
 *
 * Three-column layout inspired by SIM's property panel:
 * - INPUT column (700px, resizable): Connected node data visualization
 * - CONFIGURATION column (550px): Dynamic property forms with enhanced features
 * - OUTPUT column: Real-time preview and execution results
 */

import {
  BugOutlined,
  CloseOutlined,
  CopyOutlined,
  FullscreenOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Drawer, Space, Tabs, Tooltip } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { nodeRegistry } from '@/core/nodes';
import { useEnhancedExecutionStore } from '@/core/stores/enhancedExecutionStore';
import { useLeanWorkflowStore } from '@/core/stores/leanWorkflowStore';
import { cn, JsonViewer } from '@/design-system';
import type { PropertyValidationResult } from './EnhancedPropertyRenderer';
import EnhancedPropertyRenderer from './EnhancedPropertyRenderer';

// Simple type definition for property form state
type PropertyFormState = Record<string, any>;

interface AdvancedPropertyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId?: string;
}

interface ResizablePanelProps {
  children: React.ReactNode;
  title: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
  actions?: React.ReactNode[];
  badge?: string | number;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  title,
  width,
  minWidth = 200,
  maxWidth = 1000,
  onResize,
  actions,
  badge,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      setStartX(e.clientX);
      setStartWidth(width);
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      onResize?.(newWidth);
    },
    [isResizing, startX, startWidth, minWidth, maxWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-full border-r border-gray-700 bg-gray-800 flex flex-col" style={{ width }}>
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {badge && (
            <Badge count={badge} className="text-xs" style={{ backgroundColor: '#1890ff' }} />
          )}
        </div>
        {actions && <Space size="small">{actions}</Space>}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Resize Handle */}
      {onResize && (
        <div
          className={cn(
            'absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors',
            isResizing && 'bg-blue-500'
          )}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
};

const InputDataPanel: React.FC<{
  nodeId: string;
  width: number;
  onResize: (width: number) => void;
}> = ({ nodeId, width, onResize }) => {
  const { edges } = useLeanWorkflowStore();
  const { getNodeState } = useEnhancedExecutionStore();

  // Find incoming connections to this node
  const incomingData = useMemo(() => {
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    const data: Record<string, any> = {};

    incomingEdges.forEach((edge) => {
      const sourceNodeState = getNodeState(edge.source);
      if (sourceNodeState?.outputData) {
        data[edge.source] = sourceNodeState.outputData;
      }
    });

    return data;
  }, [edges, nodeId, getNodeState]);

  const actions = [
    <Tooltip key="refresh" title="Refresh data">
      <Button
        type="text"
        size="small"
        icon={<SyncOutlined />}
        onClick={() => {
          // Refresh input data
        }}
      />
    </Tooltip>,
    <Tooltip key="copy" title="Copy data">
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(incomingData, null, 2));
        }}
      />
    </Tooltip>,
  ];

  return (
    <ResizablePanel
      title="Input Data"
      width={width}
      onResize={onResize}
      actions={actions}
      badge={Object.keys(incomingData).length || undefined}
    >
      <div className="p-4">
        {Object.keys(incomingData).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">📥</div>
            <div>No input data available</div>
            <div className="text-xs mt-2">
              Connect nodes or execute the workflow to see input data
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(incomingData).map(([sourceNodeId, data]) => (
              <Card
                key={sourceNodeId}
                size="small"
                title={`From: ${sourceNodeId}`}
                className="bg-gray-900 border-gray-600"
              >
                <JsonViewer data={data} theme="dark" collapsed={1} enableClipboard />
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResizablePanel>
  );
};

const ConfigurationPanel: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { getNodeById, updateNodeParameters } = useLeanWorkflowStore();
  const [activeTab, setActiveTab] = useState('properties');
  const [formState, setFormState] = useState<PropertyFormState>({});
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const node = getNodeById(nodeId);
  const nodeDefinition = node ? nodeRegistry.getNodeTypeDescription(node.type) : null;

  // Get enhanced properties for this node
  const enhancedProperties = useMemo(() => {
    if (!nodeDefinition) return [];

    // Use basic properties for now, can be enhanced later
    return nodeDefinition.properties || [];
  }, [nodeDefinition]);

  // Initialize form state from node parameters
  React.useEffect(() => {
    if (node) {
      setFormState(node.parameters || {});
    }
  }, [node]);

  // Property change handlers
  const handlePropertyChange = useCallback(
    (name: string, value: any) => {
      const newFormState = { ...formState, [name]: value };
      setFormState(newFormState);
      updateNodeParameters(nodeId, { [name]: value });
    },
    [formState, nodeId, updateNodeParameters]
  );

  const handleValidationChange = useCallback((result: PropertyValidationResult) => {
    setIsValid(result.isValid);
    setErrors(result.errors);
  }, []);

  const handleTest = useCallback(async () => {}, []);

  const handleSave = useCallback(async () => {}, []);

  const actions = [
    <Tooltip key="test" title="Test node">
      <Button
        type="primary"
        size="small"
        icon={<PlayCircleOutlined />}
        onClick={handleTest}
        disabled={!isValid}
      >
        Test
      </Button>
    </Tooltip>,
    <Tooltip key="debug" title="Debug mode">
      <Button
        type="text"
        size="small"
        icon={<BugOutlined />}
        onClick={() => {
          // Toggle debug mode for this node
        }}
      />
    </Tooltip>,
    <Tooltip key="save" title="Save configuration">
      <Button type="text" size="small" icon={<SaveOutlined />} onClick={handleSave} />
    </Tooltip>,
  ];

  const tabItems = [
    {
      key: 'properties',
      label: (
        <span>
          Properties
          {errors.size > 0 && (
            <Badge
              count={errors.size}
              size="small"
              style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }}
            />
          )}
        </span>
      ),
      children: (
        <div className="p-4">
          {enhancedProperties.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">⚙️</div>
              <div>No properties available</div>
              <div className="text-xs mt-2">
                This node type doesn't have configurable properties
              </div>
            </div>
          ) : (
            <EnhancedPropertyRenderer
              properties={enhancedProperties}
              formState={formState}
              onChange={handlePropertyChange}
              onValidationChange={handleValidationChange}
              theme="dark"
            />
          )}
        </div>
      ),
    },
    {
      key: 'credentials',
      label: 'Credentials',
      children: (
        <div className="p-4">
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">🔐</div>
            <div>Credential management</div>
            <div className="text-xs mt-2">Configure authentication for this node</div>
          </div>
        </div>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      children: (
        <div className="p-4">
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">⚙️</div>
            <div>Node settings</div>
            <div className="text-xs mt-2">Advanced configuration options</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ResizablePanel title="Configuration" width={550} actions={actions}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="h-full"
        tabBarStyle={{ margin: 0, paddingLeft: 16, paddingRight: 16 }}
      />
    </ResizablePanel>
  );
};

const OutputPreviewPanel: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { getNodeState } = useEnhancedExecutionStore();
  const nodeState = getNodeState(nodeId);

  const actions = [
    <Tooltip key="copy" title="Copy output">
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={() => {
          if (nodeState?.outputData) {
            navigator.clipboard.writeText(JSON.stringify(nodeState.outputData, null, 2));
          }
        }}
        disabled={!nodeState?.outputData}
      />
    </Tooltip>,
    <Tooltip key="fullscreen" title="Fullscreen view">
      <Button
        type="text"
        size="small"
        icon={<FullscreenOutlined />}
        onClick={() => {
          // Open fullscreen view
        }}
      />
    </Tooltip>,
  ];

  const hasOutput = nodeState?.outputData;
  const hasError = nodeState?.error;

  return (
    <ResizablePanel
      title="Output Preview"
      width={400}
      actions={actions}
      badge={hasOutput ? '✓' : hasError ? '✗' : undefined}
    >
      <div className="p-4">
        {hasError && nodeState?.error ? (
          <Card className="bg-red-900 border-red-600" title="Execution Error" size="small">
            <div className="text-red-200 text-sm">
              <div className="font-semibold mb-2">{nodeState.error.message}</div>
              {nodeState.error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs mt-2 overflow-x-auto">{nodeState.error.stack}</pre>
                </details>
              )}
            </div>
          </Card>
        ) : hasOutput ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-400">Output Data</span>
              {nodeState.duration && (
                <span className="text-xs text-gray-500">
                  {nodeState.duration < 1000
                    ? `${nodeState.duration}ms`
                    : `${(nodeState.duration / 1000).toFixed(2)}s`}
                </span>
              )}
            </div>
            <JsonViewer data={nodeState.outputData} theme="dark" collapsed={1} enableClipboard />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">📤</div>
            <div>No output data</div>
            <div className="text-xs mt-2">Execute this node to see output data</div>
          </div>
        )}
      </div>
    </ResizablePanel>
  );
};

export const AdvancedPropertyPanel: React.FC<AdvancedPropertyPanelProps> = ({
  isOpen,
  onClose,
  nodeId,
}) => {
  const [inputPanelWidth, setInputPanelWidth] = useState(700);
  const { getNodeById } = useLeanWorkflowStore();

  const node = nodeId ? getNodeById(nodeId) : null;

  if (!isOpen || !nodeId || !node) {
    return null;
  }

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingOutlined />
            <span>{node.name || node.type}</span>
            <Badge status="processing" text={node.type} />
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} size="small" />
        </div>
      }
      placement="bottom"
      height="80vh"
      open={isOpen}
      onClose={onClose}
      closable={false}
      className="advanced-property-panel"
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex h-full bg-gray-800">
        {/* INPUT Column */}
        <InputDataPanel nodeId={nodeId} width={inputPanelWidth} onResize={setInputPanelWidth} />

        {/* CONFIGURATION Column */}
        <ConfigurationPanel nodeId={nodeId} />

        {/* OUTPUT Column */}
        <OutputPreviewPanel nodeId={nodeId} />
      </div>
    </Drawer>
  );
};

export default AdvancedPropertyPanel;
