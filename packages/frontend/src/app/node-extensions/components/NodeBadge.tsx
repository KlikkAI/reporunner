/**
 * NodeBadge Component
 * Reusable badge component for displaying status, counts, and indicators on nodes
 */

import type React from 'react';
import { useNodeTheme } from '../themes';
import type { BadgePosition, NodeBadge, NodeTheme } from '../types';

interface NodeBadgeProps {
  badge: NodeBadge;
  theme?: NodeTheme;
  visible?: boolean;
  onClick?: (badgeId: string) => void;
}

const NodeBadgeComponent: React.FC<NodeBadgeProps> = ({
  badge,
  theme: propTheme,
  visible = true,
  onClick,
}) => {
  const { theme: contextTheme } = useNodeTheme();
  const theme = propTheme || contextTheme;

  if (!visible) return null;

  const getPositionStyles = (position: BadgePosition): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '-6px', left: '-6px' };
      case 'top-right':
        return { ...baseStyles, top: '-6px', right: '-6px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '-6px', left: '-6px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '-6px', right: '-6px' };
      default:
        return { ...baseStyles, top: '-6px', right: '-6px' };
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(badge.id);
    }
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: badge.backgroundColor || theme.colors.primary,
    color: badge.color || theme.colors.background,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.sm,
    padding: '2px 6px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: theme.shadows.sm,
    transition: `all ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut}`,
    transform: 'scale(1)',
  };

  const hoverStyles: React.CSSProperties = onClick
    ? {
        transform: 'scale(1.1)',
        boxShadow: theme.shadows.md,
      }
    : {};

  return (
    <div
      style={getPositionStyles(badge.position)}
      onClick={onClick ? handleClick : undefined}
      onMouseEnter={(e) => {
        if (onClick) {
          Object.assign((e.target as HTMLElement).style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          Object.assign((e.target as HTMLElement).style, {
            transform: 'scale(1)',
            boxShadow: theme.shadows.sm,
          });
        }
      }}
    >
      <div style={badgeStyle}>
        {badge.icon && <span style={{ marginRight: badge.text ? '2px' : '0' }}>{badge.icon}</span>}
        {badge.text && <span>{badge.text}</span>}
      </div>
    </div>
  );
};

/**
 * NodeBadgeGroup Component
 * Manages multiple badges for a single node
 */
interface NodeBadgeGroupProps {
  badges: NodeBadge[];
  nodeId: string;
  theme?: NodeTheme;
  onBadgeClick?: (badgeId: string, nodeId: string) => void;
}

export const NodeBadgeGroup: React.FC<NodeBadgeGroupProps> = ({
  badges,
  nodeId,
  theme,
  onBadgeClick,
}) => {
  if (!badges || badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => (
        <NodeBadgeComponent
          key={badge.id}
          badge={badge}
          theme={theme}
          onClick={onBadgeClick ? (badgeId) => onBadgeClick(badgeId, nodeId) : undefined}
        />
      ))}
    </>
  );
};

/**
 * Predefined Badge Types
 */
export const createStatusBadge = (
  status: 'success' | 'error' | 'warning' | 'info' | 'processing',
  position: BadgePosition = 'top-right'
): NodeBadge => {
  const statusConfig = {
    success: { icon: '✓', color: '#ffffff', backgroundColor: '#52c41a' },
    error: { icon: '✗', color: '#ffffff', backgroundColor: '#ff4d4f' },
    warning: { icon: '⚠', color: '#000000', backgroundColor: '#faad14' },
    info: { icon: 'ℹ', color: '#ffffff', backgroundColor: '#1890ff' },
    processing: { icon: '⟳', color: '#ffffff', backgroundColor: '#722ed1' },
  };

  const config = statusConfig[status];

  return {
    id: `status-${status}`,
    text: '',
    position,
    ...config,
  };
};

export const createCountBadge = (
  count: number,
  position: BadgePosition = 'top-right',
  color?: string,
  backgroundColor?: string
): NodeBadge => ({
  id: `count-${count}`,
  text: count.toString(),
  color: color || '#ffffff',
  backgroundColor: backgroundColor || '#ff4d4f',
  position,
});

export const createTextBadge = (
  text: string,
  position: BadgePosition = 'top-right',
  color?: string,
  backgroundColor?: string
): NodeBadge => ({
  id: `text-${text}`,
  text,
  color: color || '#ffffff',
  backgroundColor: backgroundColor || '#1890ff',
  position,
});

export const createIconBadge = (
  icon: string,
  position: BadgePosition = 'top-right',
  color?: string,
  backgroundColor?: string
): NodeBadge => ({
  id: `icon-${icon}`,
  text: '',
  icon,
  color: color || '#ffffff',
  backgroundColor: backgroundColor || '#52c41a',
  position,
});

export default NodeBadgeComponent;
