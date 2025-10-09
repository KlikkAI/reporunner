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
    return undefined;
  }, [isOpen, triggerRef, menuRef, onClose]);

  // Calculate initial position based on trigger only (Phase 1: Immediate)
  useLayoutEffect(() => {
    if (!(isOpen && triggerRef?.current)) {
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
        };
        strategy = 'left';
      }
      // Try positioning below the button
      else if (spaceBelow >= estimatedMenuHeight + offset) {
        newPosition = {
          left: Math.max(
            8,
            Math.min(
              triggerRect.left + triggerRect.width / 2 - estimatedMenuWidth / 2,
              viewport.width - estimatedMenuWidth - 8
            )
          ),
          top: triggerRect.bottom + offset,
        };
        strategy = 'below';
      }
      // Position above the button as last resort
      else {
        newPosition = {
          left: Math.max(
            8,
            Math.min(
              triggerRect.left + triggerRect.width / 2 - estimatedMenuWidth / 2,
              viewport.width - estimatedMenuWidth - 8
            )
          ),
          bottom: viewport.height - triggerRect.top + offset,
        };
        strategy = 'above';
      }

      setPosition(newPosition);
      setPositionStrategy(strategy);
      setIsPositioned(true);
    };

    calculateInitialPosition();
  }, [isOpen, triggerRef, offset]);

  // Refine position after menu DOM is available (Phase 2: Precise)
  useEffect(() => {
    if (!(isOpen && triggerRef?.current && menuRef?.current && isPositioned)) {
      return;
    }

    const refinePosition = () => {
      const trigger = triggerRef.current!;
      const menu = menuRef.current!;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Calculate available space in each direction
      const spaceRight = viewport.width - triggerRect.right;
      const spaceLeft = triggerRect.left;
      const spaceBelow = viewport.height - triggerRect.bottom;

      let newPosition: MenuPosition = {};
      let strategy: typeof positionStrategy = 'right';

      // Try positioning to the right of the button (preferred)
      if (spaceRight >= menuRect.width + offset) {
        newPosition = {
          left: triggerRect.right + offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateY(-50%)',
        };
        strategy = 'right';
      }
      // Try positioning to the left of the button
      else if (spaceLeft >= menuRect.width + offset) {
        newPosition = {
          right: viewport.width - triggerRect.left + offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateY(-50%)',
        };
        strategy = 'left';
      }
      // Try positioning below the button
      else if (spaceBelow >= menuRect.height + offset) {
        newPosition = {
          left: Math.max(
            8,
            Math.min(
              triggerRect.left + triggerRect.width / 2 - menuRect.width / 2,
              viewport.width - menuRect.width - 8
            )
          ),
          top: triggerRect.bottom + offset,
        };
        strategy = 'below';
      }
      // Position above the button as last resort
      else {
        newPosition = {
          left: Math.max(
            8,
            Math.min(
              triggerRect.left + triggerRect.width / 2 - menuRect.width / 2,
              viewport.width - menuRect.width - 8
            )
          ),
          bottom: viewport.height - triggerRect.top + offset,
        };
        strategy = 'above';
      }

      // Only update if position actually changed to avoid unnecessary re-renders
      if (JSON.stringify(newPosition) !== JSON.stringify(position)) {
        setPosition(newPosition);
        setPositionStrategy(strategy);
      }
    };

    // Use setTimeout to ensure menu DOM is fully rendered
    const timeoutId = setTimeout(refinePosition, 0);

    // Recalculate on scroll/resize
    const handleReposition = () => {
      requestAnimationFrame(refinePosition);
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, isPositioned, triggerRef, menuRef, offset, position]);

  // Generate CSS classes based on position strategy
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';

    switch (positionStrategy) {
      case 'right':
        return `${baseClasses}`;
      case 'left':
        return `${baseClasses}`;
      case 'below':
        return `${baseClasses}`;
      case 'above':
        return `${baseClasses}`;
      default:
        return baseClasses;
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    // Fallback position if calculation fails
    const fallbackStyles: React.CSSProperties = {
      position: 'fixed',
      top: '50px',
      left: '50px',
      zIndex: 9999,
    };

    const calculatedStyles: React.CSSProperties = {
      position: 'fixed',
      ...position,
      zIndex: 9999,
    };

    // If no position calculated, use fallback
    const hasValidPosition = Object.keys(position).length > 0;

    return hasValidPosition ? calculatedStyles : fallbackStyles;
  };

  return {
    positionClasses: getPositionClasses(),
    positionStyles: getPositionStyles(),
    positionStrategy,
    isPositioned,
  };
};
