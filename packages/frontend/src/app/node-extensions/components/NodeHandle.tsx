/**
 * NodeHandle Component
 * Advanced handle system with custom styling and interactive features
 */

import { Tooltip } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useNodeTheme } from '../themes';
import type { CustomHandle, HandleStyle, NodeTheme } from '../types';

interface NodeHandleProps {
  handle: CustomHandle;
  theme?: NodeTheme;
  connected?: boolean;
  onConnect?: (handleId: string) => void;
  onDisconnect?: (handleId: string) => void;
  showTooltip?: boolean;
}

const NodeHandleComponent: React.FC<NodeHandleProps> = ({
  handle,
  theme: propTheme,
  connected = false,
  onConnect,
  onDisconnect,
  showTooltip = true,
}) => {
  const { theme: contextTheme } = useNodeTheme();
  const theme = propTheme || contextTheme;
  const [isHovered, setIsHovered] = useState(false);

  const getHandleStyles = (): React.CSSProperties => {
    const baseSize = handle.size || 10;
    const size = isHovered ? baseSize * 1.2 : baseSize;

    const baseStyles: React.CSSProperties = {
      width: size,
      height: size,
      background: handle.color || theme.colors.border,
      border: `2px solid ${connected ? theme.colors.success : 'transparent'}`,
      transition: `all ${theme.animations.duration.fast} ${theme.animations.easing.easeOut}`,
      boxShadow: connected
        ? `0 0 0 2px ${theme.colors.success}40`
        : isHovered
          ? theme.shadows.md
          : 'none',
    };

    // Apply shape-specific styles
    switch (handle.style) {
      case 'circle':
        return {
          ...baseStyles,
          borderRadius: theme.borderRadius.full,
        };
      case 'square':
        return {
          ...baseStyles,
          borderRadius: '2px',
        };
      case 'diamond':
        return {
          ...baseStyles,
          borderRadius: '2px',
          transform: `rotate(45deg) scale(${isHovered ? 1.2 : 1})`,
        };
      case 'triangle':
        return {
          ...baseStyles,
          borderRadius: '2px',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        };
      default:
        return {
          ...baseStyles,
          borderRadius: theme.borderRadius.full,
        };
    }
  };

  const getPositionValue = (): Position => {
    switch (handle.position) {
      case 'top':
        return Position.Top;
      case 'right':
        return Position.Right;
      case 'bottom':
        return Position.Bottom;
      case 'left':
        return Position.Left;
      default:
        return Position.Left;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleConnection = () => {
    if (connected && onDisconnect) {
      onDisconnect(handle.id);
    } else if (!connected && onConnect) {
      onConnect(handle.id);
    }
  };

  const renderHandle = () => (
    <Handle
      type={handle.type}
      position={getPositionValue()}
      id={handle.id}
      style={getHandleStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleConnection}
    />
  );

  if (showTooltip && handle.label) {
    return (
      <Tooltip
        title={handle.label}
        placement={handle.position === 'left' ? 'left' : 'right'}
        mouseEnterDelay={0.5}
      >
        {renderHandle()}
      </Tooltip>
    );
  }

  return renderHandle();
};

/**
 * NodeHandleGroup Component
 * Manages multiple handles for a single node
 */
interface NodeHandleGroupProps {
  handles: CustomHandle[];
  nodeId: string;
  theme?: NodeTheme;
  connections?: Record<string, boolean>;
  onConnect?: (handleId: string, nodeId: string) => void;
  onDisconnect?: (handleId: string, nodeId: string) => void;
}

export const NodeHandleGroup: React.FC<NodeHandleGroupProps> = ({
  handles,
  nodeId,
  theme,
  connections = {},
  onConnect,
  onDisconnect,
}) => {
  if (!handles || handles.length === 0) {
    return null;
  }

  return (
    <>
      {handles.map((handle) => (
        <NodeHandleComponent
          key={handle.id}
          handle={handle}
          theme={theme}
          connected={connections[handle.id]}
          onConnect={onConnect ? (handleId) => onConnect(handleId, nodeId) : undefined}
          onDisconnect={onDisconnect ? (handleId) => onDisconnect(handleId, nodeId) : undefined}
        />
      ))}
    </>
  );
};

/**
 * Predefined Handle Creators
 */
export const createInputHandle = (
  id: string = 'input',
  style: HandleStyle = 'circle',
  color?: string
): CustomHandle => ({
  id,
  type: 'target',
  position: 'left',
  style,
  color: color || '#666666',
  size: 10,
});

export const createOutputHandle = (
  id: string = 'output',
  style: HandleStyle = 'circle',
  color?: string
): CustomHandle => ({
  id,
  type: 'source',
  position: 'right',
  style,
  color: color || '#666666',
  size: 10,
});

export const createAIHandle = (
  type: 'ai_languageModel' | 'ai_memory' | 'ai_tool' | 'ai_vectorStore',
  position: 'top' | 'right' | 'bottom' | 'left' = 'top'
): CustomHandle => {
  const colors = {
    ai_languageModel: '#8b5cf6',
    ai_memory: '#06b6d4',
    ai_tool: '#10b981',
    ai_vectorStore: '#f59e0b',
  };

  const labels = {
    ai_languageModel: 'Language Model',
    ai_memory: 'Memory',
    ai_tool: 'Tool',
    ai_vectorStore: 'Vector Store',
  };

  return {
    id: type,
    type: 'target',
    position,
    style: 'diamond',
    color: colors[type],
    size: 8,
    label: labels[type],
  };
};

export const createConditionHandle = (
  condition: string,
  index: number,
  color?: string
): CustomHandle => {
  const conditionColors = {
    true: '#52c41a',
    false: '#ff4d4f',
    default: '#8c8c8c',
  };

  return {
    id: `condition_${index}`,
    type: 'source',
    position: 'right',
    style: 'circle',
    color:
      color ||
      conditionColors[condition as keyof typeof conditionColors] ||
      conditionColors.default,
    size: 8,
    label: condition,
  };
};

export const createWebhookHandle = (): CustomHandle => ({
  id: 'webhook',
  type: 'target',
  position: 'left',
  style: 'square',
  color: '#722ed1',
  size: 12,
  label: 'Webhook',
});

export const createTriggerHandle = (): CustomHandle => ({
  id: 'trigger',
  type: 'source',
  position: 'right',
  style: 'triangle',
  color: '#1890ff',
  size: 10,
  label: 'Trigger',
});

export default NodeHandleComponent;
