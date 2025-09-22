import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type ConnectionLineType, getBezierPath, getSmoothStepPath, Position } from 'reactflow';
import { ConnectionType, type ConnectionTypeValue } from '@/core/types/edge';

// Connection line
const EDGE_PADDING_BOTTOM = 130;
const EDGE_PADDING_X = 40;
const EDGE_BORDER_RADIUS = 16;
const HANDLE_SIZE = 20;

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPosition: Position;
  toPosition: Position;
  connectionLineType?: ConnectionLineType;
  connectionLineStyle?: React.CSSProperties;
  connectionType?: ConnectionTypeValue;
}

// Check if connection is backwards (target is to the left of source)
const isRightOfSourceHandle = (sourceX: number, targetX: number) => sourceX - HANDLE_SIZE > targetX;

// Get connection line render data with path selection logic
const getConnectionLineRenderData = (props: {
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

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionLineStyle = {},
  connectionType = ConnectionType.Main,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Implement visibility delay to prevent flickering
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  // Calculate connection line render data
  const renderData = useMemo(
    () =>
      getConnectionLineRenderData({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
        connectionType,
      }),
    [fromX, fromY, fromPosition, toX, toY, toPosition, connectionType]
  );

  const { segments } = renderData;
  const isMainConnection = connectionType === ConnectionType.Main;

  // Dynamic styling based on connection type
  const getConnectionLineStyle = () => ({
    ...connectionLineStyle,
    ...(isMainConnection ? {} : { strokeDasharray: '8,8' }),
    strokeWidth: 1,
    stroke: isMainConnection ? '#374151' : '#6b7280',
    fill: 'none',
    transition: 'opacity 300ms ease',
    opacity: isVisible ? 1 : 0,
  });

  return (
    <g>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="connection-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={isMainConnection ? '#374151' : '#6b7280'}
            style={{
              transition: 'fill 0.3s ease',
            }}
          />
        </marker>
      </defs>
      {segments.map((segment, index) => (
        <path
          key={`connection-line-${index}`}
          d={segment[0]}
          style={getConnectionLineStyle()}
          className="react-flow__connection-path"
          markerEnd="url(#connection-arrowhead)"
        />
      ))}
    </g>
  );
};

export default ConnectionLine;
