/**
 * User Presence Overlay
 *
 * Real-time visualization of user cursors, selections, and viewport indicators.
 * Shows collaborative user activity with smooth animations and clear visual cues.
 */

import React, { useCallback } from "react";
import { Avatar, Tooltip } from "antd";
import { useCollaborationStore } from "../../../core/stores/collaborationStore";
import { useLeanWorkflowStore } from "../../../core/stores/leanWorkflowStore";
import type { UserPresence } from "../../../core/services/collaborationService";

interface UserPresenceOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  transform: {
    x: number;
    y: number;
    zoom: number;
  };
}

export const UserPresenceOverlay: React.FC<UserPresenceOverlayProps> = ({
  containerRef,
  transform,
}) => {
  const {
    userPresences,
    showUserCursors,
    showUserSelections,
  } = useCollaborationStore();

  const { nodes } = useLeanWorkflowStore();

  // Generate consistent user colors
  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      "#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1",
      "#13c2c2", "#eb2f96", "#fa541c", "#2f54eb", "#a0d911"
    ];
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Convert workflow coordinates to screen coordinates
  const workflowToScreen = useCallback(
    (x: number, y: number) => ({
      x: (x + transform.x) * transform.zoom,
      y: (y + transform.y) * transform.zoom,
    }),
    [transform]
  );

  // Get node position and dimensions
  const getNodeBounds = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;

      const screenPos = workflowToScreen(node.position.x, node.position.y);
      return {
        x: screenPos.x,
        y: screenPos.y,
        width: 240 * transform.zoom, // Standard node width
        height: 100 * transform.zoom, // Standard node height
      };
    },
    [nodes, workflowToScreen, transform.zoom]
  );

  // Render user cursor
  const renderUserCursor = useCallback(
    (presence: UserPresence) => {
      if (!presence.cursor || !showUserCursors) return null;

      const screenPos = workflowToScreen(presence.cursor.x, presence.cursor.y);
      const userColor = getUserColor(presence.userId);

      return (
        <div
          key={`cursor-${presence.userId}`}
          className="absolute pointer-events-none z-50 transition-all duration-200"
          style={{
            left: screenPos.x,
            top: screenPos.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor pointer */}
          <div
            className="relative"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              className="cursor-pointer"
            >
              <path
                d="M0 0L0 16L4.5 11.5L7 16.5L9.5 15L7 10L12 10L0 0Z"
                fill={userColor}
                stroke="white"
                strokeWidth="1"
              />
            </svg>

            {/* User label */}
            <div
              className="absolute top-5 left-4 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
              style={{
                backgroundColor: userColor,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {presence.user.name}
            </div>
          </div>
        </div>
      );
    },
    [showUserCursors, workflowToScreen, getUserColor]
  );

  // Render user selection highlights
  const renderUserSelections = useCallback(
    (presence: UserPresence) => {
      if (!presence.selection?.nodeIds || !showUserSelections) return null;

      const userColor = getUserColor(presence.userId);

      return presence.selection.nodeIds
        .map((nodeId) => {
          const bounds = getNodeBounds(nodeId);
          if (!bounds) return null;

          return (
            <div
              key={`selection-${presence.userId}-${nodeId}`}
              className="absolute pointer-events-none z-40 transition-all duration-200"
              style={{
                left: bounds.x - 2,
                top: bounds.y - 2,
                width: bounds.width + 4,
                height: bounds.height + 4,
                border: `2px solid ${userColor}`,
                borderRadius: "8px",
                backgroundColor: `${userColor}20`,
                boxShadow: `0 0 0 1px ${userColor}40`,
              }}
            >
              {/* User avatar in corner */}
              <div
                className="absolute -top-3 -right-3"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
              >
                <Tooltip title={`${presence.user.name} selected this node`}>
                  <Avatar
                    size={20}
                    src={presence.user.avatar}
                    style={{
                      backgroundColor: userColor,
                      border: "2px solid white",
                      fontSize: "10px",
                    }}
                  >
                    {presence.user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              </div>
            </div>
          );
        })
        .filter(Boolean);
    },
    [showUserSelections, getNodeBounds, getUserColor]
  );

  // Render viewport indicators (mini rectangles showing what other users see)
  const renderViewportIndicators = useCallback(
    (presence: UserPresence) => {
      if (!presence.viewport) return null;

      const userColor = getUserColor(presence.userId);
      const viewport = presence.viewport;

      // Calculate the viewport rectangle in screen coordinates
      const viewportWidth = 400; // Approximate viewport width
      const viewportHeight = 300; // Approximate viewport height

      const screenPos = workflowToScreen(viewport.x, viewport.y);

      return (
        <div
          key={`viewport-${presence.userId}`}
          className="absolute pointer-events-none z-30 transition-all duration-500"
          style={{
            left: screenPos.x,
            top: screenPos.y,
            width: viewportWidth * viewport.zoom * transform.zoom,
            height: viewportHeight * viewport.zoom * transform.zoom,
            border: `1px dashed ${userColor}60`,
            borderRadius: "4px",
          }}
        >
          {/* User label for viewport */}
          <div
            className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white"
            style={{
              backgroundColor: userColor,
              opacity: 0.8,
            }}
          >
            {presence.user.name}'s view
          </div>
        </div>
      );
    },
    [workflowToScreen, getUserColor, transform.zoom]
  );

  // Don't render if container is not available
  if (!containerRef.current) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {userPresences.map((presence) => (
        <React.Fragment key={presence.userId}>
          {renderUserCursor(presence)}
          {renderUserSelections(presence)}
          {renderViewportIndicators(presence)}
        </React.Fragment>
      ))}

      {/* Connection status indicator */}
      {userPresences.length > 0 && (
        <div className="absolute top-4 right-4 pointer-events-auto z-50">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex -space-x-2">
              {userPresences.slice(0, 3).map((presence) => (
                <Avatar
                  key={presence.userId}
                  size={24}
                  src={presence.user.avatar}
                  style={{
                    backgroundColor: getUserColor(presence.userId),
                    border: "2px solid white",
                  }}
                  className="shadow-sm"
                >
                  {presence.user.name.charAt(0).toUpperCase()}
                </Avatar>
              ))}
              {userPresences.length > 3 && (
                <Avatar
                  size={24}
                  style={{
                    backgroundColor: "#f0f0f0",
                    color: "#666",
                    border: "2px solid white",
                  }}
                  className="shadow-sm"
                >
                  +{userPresences.length - 3}
                </Avatar>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {userPresences.length} other{userPresences.length !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS styles for smooth cursor animations
export const userPresenceStyles = `
  .cursor-pointer {
    animation: cursor-pulse 2s infinite;
  }

  @keyframes cursor-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .user-selection-highlight {
    animation: selection-pulse 3s infinite;
  }

  @keyframes selection-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 currentColor;
    }
    50% {
      box-shadow: 0 0 0 4px currentColor;
    }
  }
`;
