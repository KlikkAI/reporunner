const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollElement.current,
  estimateSize: () => estimateSize,
  overscan,
  horizontal,
  gap,
  paddingStart: padding,
  paddingEnd: padding,
});

// Get virtual items (only the visible ones + overscan)
const virtualItems = virtualizer.getVirtualItems();

// Track visible range changes
React.useEffect(() => {
  if (onItemsRendered && virtualItems.length > 0) {
    const startIndex = virtualItems[0]?.index || 0;
    const endIndex = virtualItems[virtualItems.length - 1]?.index || 0;
    onItemsRendered({ startIndex, endIndex });
  }
}, [virtualItems, onItemsRendered]);

// Performance monitoring
React.useEffect(() => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    performanceService.trackComponentRender(componentName, startTime, endTime);
  };
}, []);

// Memoize container styles for performance
const containerStyles = useMemo(
  () => ({
    height,
    width,
    overflow: 'auto',
    contain: 'strict', // Performance optimization
    ...style,
  }),
  [height, width, style]
);

const totalSizeStyle = useMemo(
  () => ({
    [horizontal ? 'width' : 'height']: virtualizer.getTotalSize(),
    [horizontal ? 'height' : 'width']: '100%',
    position: 'relative' as const,
  }),
  [virtualizer, horizontal]
);

// Handle loading state
if (loading) {
    return (
      <div className={`virtualized-list-loading ${className}`} style={containerStyles}>
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (errorState) {
    return (
      <div className={`virtualized-list-error $className`} style={containerStyles}>
        {errorState}
      </div>
    );
  }

  // Handle empty state
  if (items.length === 0) {
    return (
      <div className={`virtualized-list-empty $className`} style={containerStyles}>
        {emptyState || (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <div>No items to display</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`virtualized-list $className`}
      style={containerStyles}
      data-testid="virtualized-list"
    >
      <div style={totalSizeStyle}>
        {virtualItems.map((virtualRow) => {
