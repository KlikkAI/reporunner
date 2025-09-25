import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';

interface MenuPosition {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  transform?: string;
}

interface UseSmartMenuPositionProps {
  isOpen: boolean;
  triggerRef?: RefObject<HTMLElement | null>;
  menuRef?: RefObject<HTMLElement | null>;
  offset?: number;
  onClose?: () => void;
}

export const useSmartMenuPosition = ({
  isOpen,
  triggerRef,
  menuRef,
  offset = 4,
  onClose,
}: UseSmartMenuPositionProps) => {
  const [position, setPosition] = useState<MenuPosition>({});
  const [positionStrategy, setPositionStrategy] = useState<'right' | 'left' | 'below' | 'above'>(
    'right'
  );
  const [isPositioned, setIsPositioned] = useState(false);

  // Handle click outside to close menu - centralized handler with delay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click was outside both menu and trigger
      if (
        menuRef?.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    if (isOpen) {
      // Delay adding the click-outside handler to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 100); // 100ms delay to prevent race condition

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen, triggerRef, menuRef, onClose]);

  // Calculate initial position based on trigger only (Phase 1: Immediate)
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef?.current) {
      setIsPositioned(false);
      return;
    }

    const calculateInitialPosition = () => {
      const trigger = triggerRef.current!;
      const triggerRect = trigger.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Estimate menu dimensions (fallback values)
      const estimatedMenuWidth = 120;
      const estimatedMenuHeight = 200;

      // Calculate available space in each direction
      const spaceRight = viewport.width - triggerRect.right;
      const spaceLeft = triggerRect.left;
      const spaceBelow = viewport.height - triggerRect.bottom;

      let newPosition: MenuPosition = {};
      let strategy: typeof positionStrategy = 'right';

      // Try positioning to the right of the button (preferred)
      if (spaceRight >= estimatedMenuWidth + offset) {
        newPosition = {
          left: triggerRect.right + offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateY(-50%)',
        };
        strategy = 'right';
      }
      // Try positioning to the left of the button
      else if (spaceLeft >= estimatedMenuWidth + offset) {
        newPosition = {
          right: viewport.width - triggerRect.left + offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateY(-50%)',
