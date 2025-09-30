import { DeleteOutlined, MoreOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type React from 'react';
import styles from './NodeAnimations.module.css';

interface CustomNodeToolbarProps {
  visible: boolean;
  nodeId: string;
  onPlay: (nodeId: string) => void;
  onStop: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onMenuToggle: (nodeId: string) => void;
}

/**
 * Custom Node Toolbar Component
 * Provides hover-based toolbar functionality for all nodes in the registry system
 */
const CustomNodeToolbar: React.FC<CustomNodeToolbarProps> = ({
  visible,
  nodeId,
  onPlay,
  onStop,
  onDelete,
  onMenuToggle,
}) => {
  if (!visible) {
    return null;
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(nodeId);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop(nodeId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(nodeId);
  };

  const handleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuToggle(nodeId);
  };

  return (
    <div
      className={`
        absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5 
        bg-gray-800 rounded-md shadow-lg px-1 py-0.5
        ${styles.toolbar} ${visible ? styles.toolbarVisible : ''}
      `}
      style={{ zIndex: 9999 }}
    >
      <Tooltip title="Play">
        <button
          className={`w-6 h-6 bg-transparent hover:bg-green-600 text-green-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs ${styles.toolbarButton}`}
          onClick={handlePlay}
        >
          <PlayCircleOutlined />
        </button>
      </Tooltip>

      <Tooltip title="Stop">
        <button
          className={`w-6 h-6 bg-transparent hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs ${styles.toolbarButton}`}
          onClick={handleStop}
        >
          <StopOutlined />
        </button>
      </Tooltip>

      <Tooltip title="Delete">
        <button
          className={`w-6 h-6 bg-transparent hover:bg-gray-600 text-gray-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs ${styles.toolbarButton}`}
          onClick={handleDelete}
        >
          <DeleteOutlined />
        </button>
      </Tooltip>

      <Tooltip title="More">
        <button
          className={`w-6 h-6 bg-transparent hover:bg-gray-600 text-gray-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs ${styles.toolbarButton}`}
          onClick={handleMenu}
        >
          <MoreOutlined />
        </button>
      </Tooltip>
    </div>
  );
};

export default CustomNodeToolbar;
