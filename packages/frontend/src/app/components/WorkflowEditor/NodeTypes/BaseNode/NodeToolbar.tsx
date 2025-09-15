import React from "react";

interface NodeToolbarProps {
  visible: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDelete: (event: React.MouseEvent) => void;
  onMenuToggle: () => void;
  menuTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const NodeToolbar: React.FC<NodeToolbarProps> = ({
  visible,
  onPlay,
  onStop,
  onDelete,
  onMenuToggle,
  menuTriggerRef,
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute -top-10 left-1/2 h-10 transform -translate-x-1/2 flex items-center  bg-transparent rounded-md shadow-lg px-1 py-0.5"
      style={{ zIndex: 9999 }}
    >
      {/* Play Button */}
      <button
        className="w-6 h-6 bg-transparent hover:bg-green-600 text-green-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        title="Play"
      >
        ▶
      </button>

      {/* Stop Button */}
      <button
        className="w-6 h-6 bg-transparent hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onStop();
        }}
        title="Stop"
      >
        ⏹
      </button>

      {/* Delete Button */}
      <button
        className="w-6 h-6 bg-transparent hover:bg-gray-600 text-gray-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs"
        onClick={onDelete}
        title="Delete"
      >
        🗑
      </button>

      {/* Three Dots Menu */}
      <button
        ref={menuTriggerRef}
        className="w-6 h-6 bg-transparent hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-colors flex items-center justify-center text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle();
        }}
        title="More options"
      >
        ⋯
      </button>
    </div>
  );
};

export default NodeToolbar;
