import React, { useRef } from "react";
import { useSmartMenuPosition } from "../../../../hooks/useSmartMenuPosition";

interface NodeMenuProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
  onTest: () => void;
  onRename: () => void;
  onDeactivate: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const NodeMenu: React.FC<NodeMenuProps> = ({
  visible,
  onClose,
  onOpen,
  onTest,
  onRename,
  onDeactivate,
  onCopy,
  onDuplicate,
  triggerRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const { positionClasses, positionStyles } = useSmartMenuPosition({
    isOpen: visible,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    menuRef: menuRef as React.RefObject<HTMLElement>,
    offset: 4,
  });

  // Click-outside handling is now centralized in useSmartMenuPosition hook

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={`${positionClasses} bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[100px]`}
      style={positionStyles}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>📂</span> Open
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTest();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>🧪</span> Test
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>✏️</span> Rename
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeactivate();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>⏸️</span> Deactivate
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>📄</span> Copy
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1"
      >
        <span>📋</span> Duplicate
      </button>
      <hr className="my-0.5" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          // onDelete() // This would need to be passed as a prop
          onClose();
        }}
        className="w-full px-2 py-1 text-left text-xs hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
      >
        <span>🗑️</span> Delete
      </button>
    </div>
  );
};

export default NodeMenu;
