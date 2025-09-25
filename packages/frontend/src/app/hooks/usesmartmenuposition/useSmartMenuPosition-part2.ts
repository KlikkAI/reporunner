}
strategy = 'left'
}
      // Try positioning below the button
      else
if (spaceBelow >= estimatedMenuHeight + offset) {
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
}

calculateInitialPosition()
}, [isOpen, triggerRef, offset])

// Refine position after menu DOM is available (Phase 2: Precise)
useEffect(() =>
{
    if (!isOpen || !triggerRef?.current || !menuRef?.current || !isPositioned) {
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
