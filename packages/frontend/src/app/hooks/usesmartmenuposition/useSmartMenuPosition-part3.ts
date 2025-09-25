8,
  Math.min(
    triggerRect.left + triggerRect.width / 2 - menuRect.width / 2,
    viewport.width - menuRect.width - 8
  );
),
          bottom: viewport.height - triggerRect.top + offset,
        }
strategy = 'above'
}

// Only update if position actually changed to avoid unnecessary re-renders
if (JSON.stringify(newPosition) !== JSON.stringify(position)) {
  setPosition(newPosition);
  setPositionStrategy(strategy);
}
}

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
}, [isOpen, isPositioned, triggerRef, menuRef, offset, position])

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
}
