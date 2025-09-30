// src/components/WorkflowEditor/CustomEdge.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EdgeLabelRenderer, getBezierPath, getSmoothStepPath, Position } from 'reactflow';
import { ConnectionType, type ConnectionTypeValue, type CustomEdgeProps } from '@/core/types/edge';

// Edge rendering constants
const EDGE_PADDING_BOTTOM = 80;
const EDGE_PADDING_X = 10;
const EDGE_BORDER_RADIUS = 6;
const HANDLE_SIZE = 20;

// Check if connection is backwards (target is to the left of source)
const isRightOfSourceHandle = (sourceX: number, targetX: number) => sourceX - HANDLE_SIZE > targetX;

// Get edge render data with path selection logic
const getEdgeRenderData = (props: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  connectionType?: ConnectionTypeValue;
}) => {
  const {
    targetX,
    targetY,
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    connectionType = ConnectionType.Main,
  } = props;
  const isConnectorStraight = sourceY === targetY;

  // Use Bezier path for normal connections or non-main connections
  if (!isRightOfSourceHandle(sourceX, targetX) || connectionType !== ConnectionType.Main) {
    const segment = getBezierPath(props);
    return {
      segments: [segment],
      labelPosition: [segment[1], segment[2]],
      isConnectorStraight,
    };
  }

  // Connection is backwards and the source is on the right side
  // Use smooth step path to avoid overlapping the source node
  const firstSegmentTargetX = (sourceX + targetX) / 2;
  const firstSegmentTargetY = sourceY + EDGE_PADDING_BOTTOM;
  const firstSegment = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX: firstSegmentTargetX,
    targetY: firstSegmentTargetY,
    sourcePosition,
    targetPosition: Position.Right,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  const secondSegment = getSmoothStepPath({
    sourceX: firstSegmentTargetX,
    sourceY: firstSegmentTargetY,
    targetX,
    targetY,
    sourcePosition: Position.Left,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PADDING_X,
  });

  return {
    segments: [firstSegment, secondSegment],
    labelPosition: [firstSegmentTargetX, firstSegmentTargetY],
    isConnectorStraight,
  };
};

const CustomEdge: React.FC<CustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected = false,
  hovered = false,
  bringToFront = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [delayedHovered, setDelayedHovered] = useState(hovered);
  const delayedHoveredTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectionType = data?.connectionType || ConnectionType.Main;
  const status = data?.status;
  const isMainConnection = connectionType === ConnectionType.Main;

  // Implement visibility delay to prevent flickering
  useEffect(() => {
    visibilityTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 30);

    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  // Implement delayed hover state
  useEffect(() => {
    if (hovered) {
      if (delayedHoveredTimeoutRef.current) {
        clearTimeout(delayedHoveredTimeoutRef.current);
      }
      setDelayedHovered(true);
    } else {
      delayedHoveredTimeoutRef.current = setTimeout(() => {
        setDelayedHovered(false);
      }, 100);
    }

    return () => {
      if (delayedHoveredTimeoutRef.current) {
        clearTimeout(delayedHoveredTimeoutRef.current);
      }
    };
  }, [hovered]);

  // Calculate edge render data
  const renderData = useMemo(
    () =>
      getEdgeRenderData({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        connectionType,
      }),
    [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, connectionType]
  );

  const { segments, labelPosition, isConnectorStraight } = renderData;

  // Dynamic edge styling
  const getEdgeColor = () => {
    if (status === 'success') {
      return '#10b981'; // green
    }
    if (status === 'error') {
      return '#ef4444'; // red
    }
    if (status === 'running') {
      return '#f59e0b'; // yellow
    }
    if (status === 'pinned') {
      return '#8b5cf6'; // purple
    }
    if (!isMainConnection) {
      return '#6b7280'; // gray for supplemental
    }
    if (selected) {
      return '#1f2937'; // dark gray for selected
    }
    return '#E2DFD0'; // default dark gray
  };

  const getEdgeStyle = () => ({
    ...style,
    ...(isMainConnection ? {} : { strokeDasharray: '8,8' }),
    strokeWidth: delayedHovered || isHovered ? 2 : 1,
    stroke: delayedHovered || isHovered ? '#3b82f6' : getEdgeColor(), // blue on hover
    fill: 'none',
    transition: 'stroke 0.3s ease, opacity 0.3s ease, stroke-width 0.3s ease',
    opacity: isVisible ? 1 : 0,
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      if (data?.onDelete) {
        data.onDelete(id);
      }
    },
    [id, data]
  );

  const renderToolbar = (selected || delayedHovered || isHovered) && data?.onDelete;

  return (
    <g
      data-testid="edge"
      className={bringToFront ? 'bring-to-front' : ''}
      style={{ zIndex: bringToFront ? 1 : 0 }}
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={`arrowhead-${id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={delayedHovered || isHovered ? '#3b82f6' : getEdgeColor()}
            style={{
              transition: 'fill 0.3s ease',
            }}
          />
        </marker>
      </defs>
      {segments.map((segment, index) => (
        <React.Fragment key={`${id}-${index}`}>
          {/* Invisible wider path for easier hover detection */}
          <path
            d={segment[0]}
            style={{
              stroke: 'transparent',
              strokeWidth: 40,
              fill: 'none',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />

          {/* Visible edge path */}
          <path
            d={segment[0]}
            style={getEdgeStyle()}
            className={`react-flow__edge-path ${isHovered || delayedHovered ? 'hovered' : ''}`}
            markerEnd={`url(#arrowhead-${id})`}
            pointerEvents="none"
          />
        </React.Fragment>
      ))}

      <EdgeLabelRenderer>
        {/* Toolbar with delete button */}
        {renderToolbar && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPosition[0]}px, ${labelPosition[1]}px)`,
              pointerEvents: 'all',
              zIndex: delayedHovered || isHovered ? 1 : 0,
            }}
            className="nodrag nopan"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onMouseDown={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-all duration-200 border-2 border-white hover:scale-110"
              title="Delete connection"
              style={{
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Connection status indicator */}
        {status && status !== 'success' && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPosition[0]}px, ${labelPosition[1] - (isConnectorStraight ? 20 : 0)}px)`,
              pointerEvents: 'none',
              zIndex: 999,
            }}
          >
            <div
              className={`
              w-2 h-2 rounded-full
              ${status === 'error' ? 'bg-red-500' : ''}
              ${status === 'running' ? 'bg-yellow-500 animate-pulse' : ''}
              ${status === 'pinned' ? 'bg-purple-500' : ''}
            `}
            />
          </div>
        )}
      </EdgeLabelRenderer>
    </g>
  );
};

export default CustomEdge;
