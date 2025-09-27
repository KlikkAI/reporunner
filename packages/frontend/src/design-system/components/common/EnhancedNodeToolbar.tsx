/**
 * Enhanced Node Toolbar
 * Advanced toolbar with customizable actions, themes, and interactions
 */

import {
  BugOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { useNodeTheme } from '../themes';
import type { NodeTheme, ToolbarAction } from '../types';

interface EnhancedNodeToolbarProps {
  nodeId: string;
  visible: boolean;
  actions?: ToolbarAction[];
  theme?: NodeTheme;
  onActionClick: (actionId: string, nodeId: string) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact' | 'floating';
}

const EnhancedNodeToolbar: React.FC<EnhancedNodeToolbarProps> = ({
  nodeId,
  visible,
  actions = [],
  theme: propTheme,
  onActionClick,
  position = 'top',
  size = 'medium',
  variant = 'default',
}) => {
  const { theme: contextTheme } = useNodeTheme();
  const theme = propTheme || contextTheme;
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Default actions if none provided
  const defaultActions: ToolbarAction[] = [
    {
      id: 'play',
      icon: 'PlayCircleOutlined',
      label: 'Run Node',
      action: 'execute',
      shortcut: 'Ctrl+R',
    },
    {
      id: 'stop',
      icon: 'StopOutlined',
      label: 'Stop Execution',
      action: 'stop',
    },
    {
      id: 'copy',
      icon: 'CopyOutlined',
      label: 'Duplicate Node',
      action: 'duplicate',
      shortcut: 'Ctrl+D',
    },
    {
      id: 'edit',
      icon: 'EditOutlined',
      label: 'Edit Node',
      action: 'edit',
      shortcut: 'Enter',
    },
    {
      id: 'delete',
      icon: 'DeleteOutlined',
      label: 'Delete Node',
      action: 'delete',
      shortcut: 'Del',
    },
    {
      id: 'more',
      icon: 'MoreOutlined',
      label: 'More Actions',
      action: 'menu',
    },
  ];

  const finalActions = actions.length > 0 ? actions : defaultActions;

  const getPositionStyles = (): React.CSSProperties => {
    const offset = variant === 'floating' ? 12 : 8;
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 9999,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          top: `-${offset + 32}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: `-${offset + 32}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyles,
          left: `-${offset + 120}px`,
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyles,
          right: `-${offset + 120}px`,
          top: '50%',
          transform: 'translateY(-50%)',
        };
      default:
        return {
          ...baseStyles,
          top: `-${offset + 32}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { buttonSize: 24, iconSize: 12, padding: '4px' };
      case 'large':
        return { buttonSize: 36, iconSize: 16, padding: '8px' };
      default:
        return { buttonSize: 28, iconSize: 14, padding: '6px' };
    }
  };

  const getVariantStyles = (): React.CSSProperties => {
    const { padding } = getSizeConfig();

    // Defensive theme access with fallbacks
    const borderRadius = theme?.borderRadius?.md || '6px';
    const duration = theme?.animations?.duration?.normal || '150ms';
    const easing = theme?.animations?.easing?.easeOut || 'ease-out';

    const baseStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      borderRadius,
      transition: `all ${duration} ${easing}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.9)',
      padding,
    };

    switch (variant) {
      case 'compact':
        return {
          ...baseStyles,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${theme?.colors?.border || '#ddd'}40`,
        };
      case 'floating':
        return {
          ...baseStyles,
          background: theme?.colors?.background || '#fff',
          border: `1px solid ${theme?.colors?.border || '#ddd'}`,
          boxShadow: theme?.shadows?.lg || '0 10px 25px rgba(0, 0, 0, 0.1)',
        };
      default:
        return {
          ...baseStyles,
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid ${theme?.colors?.border || '#ddd'}60`,
          boxShadow: theme?.shadows?.md || '0 4px 12px rgba(0, 0, 0, 0.05)',
        };
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      PlayCircleOutlined,
      StopOutlined,
      DeleteOutlined,
      MoreOutlined,
      CopyOutlined,
      EditOutlined,
      SettingOutlined,
      BugOutlined,
      ReloadOutlined,
    };

    const IconComponent = iconMap[iconName] || MoreOutlined;
    return IconComponent;
  };

  const handleActionClick = (action: ToolbarAction, e: React.MouseEvent) => {
    e.stopPropagation();

    // Special handling for menu action
    if (action.id === 'more') {
      // Show additional actions menu
      return;
    }

    onActionClick(action.id, nodeId);
  };

  const getButtonStyles = (actionId: string): React.CSSProperties => {
    const { buttonSize, iconSize } = getSizeConfig();
    const isHovered = hoveredAction === actionId;

    const buttonColor = getActionColor(actionId);

    return {
      width: buttonSize,
      height: buttonSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.sm,
      background: isHovered ? buttonColor : 'transparent',
      color: isHovered ? theme.colors.background : getActionTextColor(actionId),
      border: 'none',
      cursor: 'pointer',
      transition: `all ${theme.animations.duration.fast} ${theme.animations.easing.easeOut}`,
      fontSize: iconSize,
      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    };
  };

  const getActionColor = (actionId: string): string => {
    switch (actionId) {
      case 'play':
        return theme.colors.success;
      case 'stop':
        return theme.colors.error;
      case 'delete':
        return theme.colors.error;
      case 'copy':
        return theme.colors.info;
      case 'edit':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getActionTextColor = (actionId: string): string => {
    if (variant === 'floating') {
      return getActionColor(actionId);
    }
    return theme.colors.background;
  };

  const renderMoreMenu = () => {
    const moreActions: ToolbarAction[] = [
      {
        id: 'settings',
        icon: 'SettingOutlined',
        label: 'Node Settings',
        action: 'settings',
      },
      {
        id: 'debug',
        icon: 'BugOutlined',
        label: 'Debug Node',
        action: 'debug',
      },
      {
        id: 'reload',
        icon: 'ReloadOutlined',
        label: 'Reload Node',
        action: 'reload',
      },
    ];

    const menuItems = moreActions.map((action) => ({
      key: action.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {React.createElement(getIconComponent(action.icon))}
          <span>{action.label}</span>
          {action.shortcut && (
            <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>
              {action.shortcut}
            </span>
          )}
        </div>
      ),
      onClick: () => onActionClick(action.id, nodeId),
    }));

    return <Menu items={menuItems} />;
  };

  if (!visible) return null;

  return (
    <div ref={toolbarRef} style={getPositionStyles()}>
      <div style={getVariantStyles()}>
        {finalActions.map((action) => {
          if (action.id === 'more') {
            return (
              <Dropdown
                key={action.id}
                overlay={renderMoreMenu()}
                trigger={['click']}
                placement="bottomCenter"
              >
                <button
                  style={getButtonStyles(action.id)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  {React.createElement(getIconComponent(action.icon))}
                </button>
              </Dropdown>
            );
          }

          return (
            <Tooltip
              key={action.id}
              title={
                <div>
                  <div>{action.label}</div>
                  {action.shortcut && (
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{action.shortcut}</div>
                  )}
                </div>
              }
              placement="bottom"
              mouseEnterDelay={0.5}
            >
              <button
                style={getButtonStyles(action.id)}
                onClick={(e) => handleActionClick(action, e)}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
              >
                {React.createElement(getIconComponent(action.icon))}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedNodeToolbar;
