import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useMemo, useRef } from 'react';
import { performanceService } from '@/core/services/PerformanceService';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];

  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Estimated size of each item in pixels (used for initial calculations) */
  estimateSize?: number;

  /** Height of the scrollable container */
  height: number | string;

  /** Width of the scrollable container */
  width?: number | string;

  /** Additional CSS classes for the container */
  className?: string;

  /** Additional CSS styles for the container */
  style?: React.CSSProperties;

  /** Callback when items come into view (useful for lazy loading) */
  onItemsRendered?: (visibleRange: { startIndex: number; endIndex: number }) => void;

  /** Key extractor function for stable item keys */
  getItemKey?: (item: T, index: number) => string | number;

  /** Gap between items in pixels */
  gap?: number;

  /** Padding around the scrollable area */
  padding?: number;

  /** Custom scroll element ref (if you want to control scrolling externally) */
  scrollElementRef?: React.RefObject<HTMLElement>;

  /** Whether to enable horizontal scrolling */
  horizontal?: boolean;

  /** Overscan count - number of items to render outside visible area */
  overscan?: number;

  /** Loading state */
  loading?: boolean;

  /** Empty state component */
  emptyState?: React.ReactNode;

  /** Error state component */
  errorState?: React.ReactNode;
}

/**
 * High-performance virtualized list component powered by TanStack Virtual
 *
 * Features:
 * - Only renders visible items + overscan buffer
 * - Smooth scrolling with automatic size estimation
 * - Support for dynamic item heights
 * - Performance monitoring integration
 * - Flexible styling and customization options
 *
 * Perfect for:
 * - Large datasets (1000+ items)
 * - Execution history lists
 * - Workflow lists
 * - Node palettes
 * - Any scrollable content with many items
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
  height,
  width = '100%',
  className = '',
  style = {},
  onItemsRendered,
  getItemKey,
  gap = 0,
  padding = 0,
  scrollElementRef,
  horizontal = false,
  overscan = 5,
  loading = false,
  emptyState,
  errorState,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollElement = scrollElementRef || parentRef;

  // Performance tracking
  const componentName = 'VirtualizedList';

  // Create virtualizer instance
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
      <div className={`virtualized-list-error ${className}`} style={containerStyles}>
        {errorState}
      </div>
    );
  }

  // Handle empty state
  if (items.length === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`} style={containerStyles}>
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
      className={`virtualized-list ${className}`}
      style={containerStyles}
      data-testid="virtualized-list"
    >
      <div style={totalSizeStyle}>
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) {
            return null;
          }
          const key = getItemKey ? getItemKey(item, virtualRow.index) : virtualRow.index;

          return (
            <div
              key={key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                [horizontal ? 'left' : 'top']: virtualRow.start,
                [horizontal ? 'height' : 'width']: '100%',
              }}
            >
              {item && renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Types are already exported above

// Default export for convenience
export default VirtualizedList;
